const path = require('path');
const { BrowserWindow } = require('electron');
const { services } = require('./services');

/**
 * 直接依赖 services 进行服务管理
 */

module.exports = class Wiki {
    constructor(dir, window = null, port = 11111) {
        this.dir = dir
        // 始终使用修正后的端口
        this.real_port = services.launch(dir, port)

        if (!window) {
            // 创建浏览器窗口
            this.win = new BrowserWindow({
                width: 1200,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    preload: path.join(__dirname, "preloads", "preload.js")
                }
            })
        } else {
            this.win = window
        }

        // 关闭窗口的同时也关闭服务
        this.win.on("close", _ => services.stop(this.real_port))

        // 服务到达前不停刷新
        this.win.loadURL(`http://localhost:${this.real_port}`)
            .catch(_ => this.win.reload())
    }
}