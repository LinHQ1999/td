import { BrowserWindow, shell } from 'electron'
import { existsSync, readJsonSync } from 'fs-extra'
import path from 'path'
import { config } from './config'
import { Service, services } from './services'

/**
 * 直接依赖 services 进行服务管理
 */
export class Wiki {
    static wikis: Set<Wiki> = new Set()

    dir: string
    service: Service
    win: BrowserWindow

    /**
     * 启动新 wiki 并打开新窗口
     * 
     * @param dir 启动目录
     * @param window 是否使用已有的 BrowserWindow
     * @param port 起始端口，默认 11111
     */
    constructor(dir: string, window: BrowserWindow | null = null, port: number = 11111) {
        this.dir = dir
        // 始终使用修正后的端口
        this.service = services.launch(dir, port, ...this.loadCfg())

        if (!window) {
            // 创建浏览器窗口
            this.win = Wiki.createWindow()
        } else {
            this.win = window
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

        // 服务一旦到达就加载页面，仅加载一次，多了会闪退
        if (this.service.worker.stdout) {
            this.service.worker.stdout.once("data", () => {
                this.win.loadURL(`http://localhost:${this.service.port}`)
                    .then(() => this.win.setTitle(this.win.webContents.getTitle()))
                    .catch(() => this.win.reload())
            })
        }

        this.confWin()

        // 缓存最后一次打开
        config.lastOpen = dir
    }

    /**
     * 重启服务
     */
    restart() {
        // 停止服务，但不要移除窗口
        services.stop(this.service.port)
        // 重启
        this.win.setTitle("正在重载服务……")
        this.service = services.launch(this.dir, this.service.port, ...this.loadCfg())
        // 并刷新
        this.service.worker.stdout?.once("data", _ => {
            this.win.reload()
            this.win.setTitle(this.win.webContents.getTitle())
        })
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
            services.stop(this.service.port);
            Wiki.wikis.delete(this)
        })
    }

    /**
     * 创建一个空窗口
     * 
     * @returns null
     */
    static createWindow(title = "等待服务启动", nomenu = true) {
        let win = new BrowserWindow({
            width: 1200,
            height: 800,
            autoHideMenuBar: nomenu,
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(__dirname, "preloads", "preload.js")
            }
        })
        win.setTitle(title)
        return win
    }
}
