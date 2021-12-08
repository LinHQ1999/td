import { BrowserWindow } from 'electron'
import { existsSync } from 'fs-extra'
import path from 'path'
import { config } from './config'
import { services } from './services'

/**
 * 直接依赖 services 进行服务管理
 */
export class Wiki {
    dir: string
    real_port: number
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
        let server = services.launch(dir, port)
        this.real_port = server.port

        if (!window) {
            // 创建浏览器窗口
            this.win = Wiki.createWindow()
        } else {
            this.win = window
        }

        // 获取 wiki 中的自定义 ico
        let icon = path.join(dir, "tiddlers", "$__favicon.ico")
        if (existsSync(icon))
            this.win.setIcon(icon)

        // 关闭窗口的同时也关闭服务
        this.win.once("close", _ => services.stop(this.real_port))

        // 服务一旦到达就加载页面，仅加载一次，多了会闪退
        server.ps.stdout.once("data", () => {
            this.win.loadURL(`http://localhost:${this.real_port}`)
                .then(() => this.win.setTitle(this.win.webContents.getTitle()))
                .catch(() => this.win.reload())
        })

        // 缓存最后一次打开
        config.lastOpen = dir
    }

    /**
     * 创建一个空窗口
     * 
     * @returns null
     */
    static createWindow(title="等待服务启动", nomenu = true) {
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
