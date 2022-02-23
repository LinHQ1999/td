import { BrowserWindow, Notification, shell } from 'electron'
import { error } from 'electron-log'
import { existsSync, readdirSync, readJsonSync } from 'fs-extra'
import path from 'path'
import { config } from './config'
import { CheckUpdate } from './git'
import { Service, TWService } from './services'

/**
 * 直接依赖 services 进行服务管理
 */
export class Wiki {
    static wikis: Set<Wiki> = new Set()
    // 窗口聚焦则切换
    static cwd: Wiki | null = null

    dir: string
    service: Service | undefined
    win: BrowserWindow
    // 是否单文件版
    single: boolean

    /**
     * 启动新 wiki 并打开新窗口
     * 
     * @param dir 启动目录
     * @param window 是否使用已有的 BrowserWindow
     * @param port 起始端口，默认 11111
     */
    constructor(dir: string, window: BrowserWindow | null = null, port: number = 11111) {
        this.dir = dir
        this.single = this.checkSingleFile()
        // 防止误操作，始终绑定本身对象
        this.confWin.bind(this)

        if (!window) {
            // 创建浏览器窗口
            this.win = Wiki.createWindow()
        } else {
            this.win = window
        }

        if (this.single) {
            // 环境检查
            if (config.env.wd) {
                this.service = TWService.launchFile(dir, port)
            } else {
                let note = new Notification({
                    title: "需要安装 widdler，系统当前不具备此环境",
                    body: "执行 go install suah.dev/widdler@latest 以进行安装"
                })
                note.show()
                error(note.title, note.body)
                return
            }
        } else {
            // 启动 node 版
            this.service = TWService.launch(dir, port, ...this.loadCfg())
        }

        // 获取 wiki 中的自定义 ico，只有 windows 才能够进行此设置
        // 同时只有 windows 才能自动关闭菜单
        if (config.env.os == "win32") {
            let icon = path.join(dir, "tiddlers", "$__favicon.ico")
            if (existsSync(icon))
                this.win.setIcon(icon)
        } else {
            this.win.setMenuBarVisibility(true)
            this.win.setAutoHideMenuBar(false)
        }

        // 防止视觉闪烁
        this.win.once('ready-to-show', this.win.show)

        this.loadWin()
        this.confWin()

        // 缓存最后一次打开
        config.lastOpen = dir
    }

    /**
     * 重启服务
     */
    restart() {
        // 停止服务，但不要移除窗口
        if (this.service && !this.single) {
            TWService.stop(this.service.port)
            // 重启
            this.win.setTitle("正在重载服务……")
            this.service = TWService.launch(this.dir, this.service.port, ...this.loadCfg())
            // 并刷新
            this.service.worker.stdout?.once("data", _ => {
                this.win.reload()
                this.win.setTitle(this.win.webContents.getTitle())
            })
        } else {
            new Notification({ title: "单文件版不支持重载服务！" }).show()
        }
    }

    /**
     * 读取额外的 listen 参数
     * 
     * @returns 额外的 listen 参数
     */
    loadCfg(): string[] {
        // 总是压缩
        let params: string[] = ["gzip=yes"]
        let file = path.join(this.dir, "launch.json")
        if (existsSync(file)) {
            let cfg = readJsonSync(file)
            for (let [k, v] of Object.entries(cfg)) {
                const param = `${k}=${v}`
                // 检查重复项
                if (!params.includes(param))
                    params.push(param)
            }
        }
        return params
    }

    /**
     * 处理 win 操作相关事宜
     */
    confWin() {
        // 页面内的链接始终采用默认浏览器打开而不是新建一个窗口
        this.win.webContents.setWindowOpenHandler(details => {
            shell.openExternal(details.url)
            return { action: 'deny' }
        })

        // 关闭窗口之后也关闭服务并移除窗口
        this.win.once("closed", () => {
            if (this.service) {
                TWService.stop(this.service.port);
                CheckUpdate(this.dir)
            }
            Wiki.wikis.delete(this)
        })

        // 实时更新正在工作的 wiki
        this.win.on("focus", () => Wiki.cwd = this)
    }

    /**
     * 加载页面资源
     */
    loadWin() {
        // 服务一旦到达就加载页面，仅加载一次，多了会闪退
        if (this.service && this.service.worker.stdout) {
            this.service.worker.stdout.once("data", async () => {
                try {
                    await this.win.loadURL(`http://localhost:${this.service?.port}`)
                    this.win.setTitle(this.win.webContents.getTitle())
                } catch (_) {
                    this.win.reload()
                }
            })
        }
    }

    /**
     * 判断当前 dir 是否是单文件版的
     * @returns 
     */
    checkSingleFile() {
        let files = readdirSync(this.dir)
        for (let file of files) {
            if (file.includes(".html")) return true
        }
        return false
    }

    /**
     * 创建一个空窗口
     * 
     * @returns null
     */
    static createWindow(title = "等待服务启动", show = false, nomenu = true) {
        return new BrowserWindow({
            width: 1200,
            height: 800,
            autoHideMenuBar: nomenu,
            title: title,
            show: show,
            webPreferences: {
                preload: path.join(__dirname, "preloads", "preload.js")
            }
        })
    }
}
