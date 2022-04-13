import {BrowserWindow, Notification, shell} from 'electron'
import electronIsDev from 'electron-is-dev'
import {error} from 'electron-log'
import {existsSync, readdirSync, readJsonSync} from 'fs-extra'
import path from 'path'
import {config} from './config'
import {CheckCommit} from './git'
import {Service, TWService} from './services'

interface SingleInfo {
    isSingle: boolean
    path: string
}

/**
 * 直接依赖 services 进行服务管理
 */
export class Wiki {
    static wikis: Set<Wiki> = new Set()
    // 窗口聚焦则切换
    static current: Wiki | null = null

    dir: string
    // 单文件不需要后端服务
    service: Service | undefined
    win: BrowserWindow
    // 是否单文件版
    single: SingleInfo

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

        if (!this.single.isSingle) {
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
        // this.win.once('ready-to-show', this.win.show)

        this.loadWin()
        this.confWin()

        if (electronIsDev) this.win.webContents.openDevTools()
    }

    /**
     * 重启服务
     */
    restart() {
        // 停止服务，但不要移除窗口
        if (this.service && !this.single.isSingle) {
            TWService.stop(this.service)
            // 重启
            this.win.setTitle("正在重载服务……")
            this.service = TWService.launch(this.dir, this.service.port, ...this.loadCfg())
            // 并刷新
            this.service.worker.stdout?.once("data", _ => {
                this.win.reload()
                this.win.setTitle(this.win.webContents.getTitle())
            })
        } else {
            new Notification({title: "当前加载：单文件版", body: "单文件版不支持重载服务！"}).show()
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
        // 其他平台没有此问题
        if (config.env.os == "win32") {
            // 劫持默认的 window.confirm 函数
            this.win.webContents
                // 返回可以被序列化的值
                .executeJavaScript(`window.confirm = message => window.TD.confirm(message);0;`)
                .catch(error)
        }

        // 页面内的链接始终采用默认浏览器打开而不是新建一个窗口
        this.win.webContents.setWindowOpenHandler(details => {
            shell.openExternal(details.url)
            return {action: 'deny'}
        })

        // 关闭窗口之后也关闭服务（如果有）并移除窗口
        this.win.once("closed", () => {
            if (this.service) {
                TWService.stop(this.service);
            }
            Wiki.wikis.delete(this)
        })

        // 实时更新正在工作的 wiki
        this.win.on("focus", () => Wiki.current = this)
    }

    /**
     * 加载页面资源
     */
    loadWin() {
        // 加载前先提交变更
        CheckCommit(this.dir)
        if (this.single.isSingle) {
            this.win.loadFile(this.single.path)
                .then(() => this.win.setTitle(this.win.webContents.getTitle()))
                .catch(error)
        } else if (this.service && this.service.worker.stdout) {
            // 服务一旦到达就加载页面，仅加载一次，多了会闪退
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
     * @returns SingleInfo
     */
    checkSingleFile(): SingleInfo {
        let files = readdirSync(this.dir)
        for (let file of files) {
            // 采用绝对路径
            if (file.includes(".html")) return {path: path.join(this.dir, file), isSingle: true}
        }
        return {path: "", isSingle: false}
    }

    /**
     * 通过 BrowserWindow 匹配对应的 wiki 实例
     */
    static getWiki(win: BrowserWindow): Wiki | null {
        for (const wiki of this.wikis) {
            if (wiki.win.id == win.id) {
                return wiki
            }
        }
        return null
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
                preload: path.join(__dirname, "preloads", "preload.js")
            }
        })
    }
}
