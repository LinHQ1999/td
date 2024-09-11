import { BrowserWindow, Notification, dialog, shell } from "electron";
import electronIsDev from "electron-is-dev";
import { error, info } from "electron-log";
import { ensureDir, pathExists, readJson, readdir } from "fs-extra";
import path from "path";
import { config } from "./config";
import { Service, TWService } from "./services";

interface WikiInfo {
  isSingle: boolean;
  path: string;
}

/**
 * 直接依赖 services 进行服务管理
 */
export class Wiki {
  static wikis: Set<Wiki> = new Set();
  // 窗口聚焦则切换
  static current: Wiki | null = null;

  dir: string;
  // 单文件不需要后端服务
  service: Service | undefined;
  wkType: WikiInfo;
  win: BrowserWindow;
  // 是否单文件版

  /**
   * 启动新 wiki 并打开新窗口
   *
   * @param dir 启动目录
   * @param window 是否使用已有的 BrowserWindow
   * @param port 起始端口，默认 11111
   */
  constructor(
    dir: string,
    window: BrowserWindow,
    wikiType: WikiInfo,
    service?: Service
  ) {
    Wiki.current = this

    this.dir = dir;
    this.wkType = wikiType;
    this.win = window
    this.service = service

    // 防止误操作，始终绑定本身对象
    this.confWin.apply(this);

    info(`Current wiki has changed to ${this.dir}`)
  }

  /**
   * 重启服务
   */
  async restart() {
    // 停止服务，但不要移除窗口
    if (!this.wkType.isSingle && this.service !== undefined) {
      TWService.stop(this.service);
      // 重启
      this.win.setTitle("正在重载服务……");
      this.service = await TWService.launch(
        this.dir,
        this.service.port,
        ...await Wiki.loadCfg(this.dir),
      );
      // 并刷新
      this.service.childProcess.stdout?.once("data", () => {
        this.win.reload();
        this.win.setTitle(this.win.webContents.getTitle());
      });
    } else {
      new Notification({
        title: "当前加载：单文件版",
        body: "单文件版不支持重载服务！",
      }).show();
    }
  }

  /**
   * 读取额外的 listen 参数
   *
   * @returns 额外的 listen 参数
   */
  static async loadCfg(dir: string): Promise<string[]> {
    // 总是压缩
    const params: string[] = ["gzip=yes"];
    const file = path.join(dir, "launch.json");
    if (await pathExists(file)) {
      const cfg = await readJson(file);
      for (const [k, v] of Object.entries(cfg)) {
        const param = `${k}=${v}`;
        // 检查重复项
        if (!params.includes(param)) params.push(param);
      }
    }
    return params;
  }

  /**
   * 处理 win 操作相关事宜
   */
  confWin() {
    // 页面内的链接始终采用默认浏览器打开而不是新建一个窗口
    this.win.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.win.webContents.on("will-prevent-unload", (event) => {
      const selected = dialog.showMessageBoxSync(this.win, {
        title: "等一下",
        buttons: ["去保存", "不管了"],
        cancelId: 0,
        defaultId: 0,
        message: "你似乎没有保存！",
      });
      // 0 是去保存
      if (selected !== 0) event.preventDefault();
    });

    // 关闭窗口之后也关闭服务（如果有）并移除窗口
    this.win.once("closed", () => {
      if (this.service) {
        TWService.stop(this.service);
        info(`${this.dir} 的服务已关闭!`);
      }
      Wiki.wikis.delete(this);
    });

    this.win.webContents.on("found-in-page", (_, res) => {
      this.win.webContents.send("search:res", res);
    });

    // 实时更新正在工作的 wiki
    this.win.on("focus", () => (Wiki.current = this));
  }

  // Factory pattern to avoid asynchronous constructor
  static async createWiki(dir: string, bindWin?: BrowserWindow | undefined, port = 11111): Promise<Wiki> {
    let win: BrowserWindow
    if (!bindWin) {
      // 创建浏览器窗口
      win = Wiki.createWindow();
    } else {
      win = bindWin;
    }

    // 获取 wiki 中的自定义 ico，只有 windows 才能够进行此设置
    // 同时只有 windows 才能自动关闭菜单
    if (config.env.os == "win32") {
      const icon = path.join(dir, "tiddlers", "$__favicon.ico");
      if (await pathExists(icon)) win.setIcon(icon);
    } else {
      win.setMenuBarVisibility(true);
      win.setAutoHideMenuBar(false);
    }

    const wkType = await Wiki.checkSingleFile(dir)
    let service: Service | undefined = undefined

    // 在 await 前注册监听器
    win.webContents.once(
      "dom-ready",
      () =>
        electronIsDev && win.webContents.openDevTools({ mode: "detach" }),
    );

    if (wkType.isSingle) {
      await win.loadFile(wkType.path)
      win.setTitle(win.webContents.getTitle())
    } else {
      // 启动 node 版
      service = await TWService.launch(dir, port, ...await this.loadCfg(dir));
      if (service.childProcess.stdout) {
        service.childProcess.stdout.once("data", async () => {
          try {
            await win.loadURL(`http://localhost:${service?.port}`);
            win.setTitle(win.webContents.getTitle());
          } catch (err) {
            error(`重试载入内容 ${err}`)
            win.reload();
          }
        });
      }
    }

    // 防止视觉闪烁
    // this.win.once('ready-to-show', this.win.show)

    return new Wiki(dir, win, wkType, service)
  }

  /**
   * 判断当前 dir 是否是单文件版的
   * @returns SingleInfo
   */
  static async checkSingleFile(dir: string): Promise<WikiInfo> {
    const files = await readdir(dir);
    for (const file of files) {
      // 采用绝对路径
      if (file.includes(".html")) {
        const attachmentDir = path.join(dir, "files");
        ensureDir(attachmentDir)
        return { path: path.join(dir, file), isSingle: true };
      }
    }
    return { path: "", isSingle: false };
  }

  /**
   * 通过 BrowserWindow 匹配对应的 wiki 实例
   */
  static getWiki(win: BrowserWindow): Wiki | null {
    for (const wiki of this.wikis) {
      if (wiki.win.id == win.id) {
        return wiki;
      }
    }
    return null;
  }

  /**
   * 创建一个空窗口
   *
   * @returns null
   */
  static createWindow(title = "等待服务启动", show = true, nomenu = true) {
    return new BrowserWindow({
      width: 1200,
      height: 800,
      autoHideMenuBar: nomenu,
      title: title,
      show: show,
      webPreferences: {
        preload: path.join(__dirname, "preloads", "main.js"),
      },
    });
  }
}
