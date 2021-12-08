import { app, BrowserWindow, dialog, Notification } from 'electron'
import { existsSync } from 'fs-extra'
import { error as err } from 'electron-log'
import path from 'path'
import { config } from './main/config'
import { initMenu } from './main/menu'
import { services } from './main/services'
import { Wiki } from './main/wiki'

initMenu();

(async () => {
    try {
        let [_, tw] = await Promise.all([app.whenReady(), services.setup()])
        let lastOpen = config.lastOpen
        if (!existsSync(tw)) {
            new Notification({ title: "环境错误", body: "执行 npm i -g tiddlywki" })
            err("宿主机不具备对应环境")
            app.quit()
        }
        // 检查是否是初始状态
        if (lastOpen == undefined) {
            let win = Wiki.createWindow()
            dialog.showOpenDialog(win, { properties: ["openDirectory"] })
                .then(selected => {
                    let paths = selected.filePaths
                    if (paths.length != 0) {
                        new Wiki(paths[0], win)
                    }
                })
        } else {
            new Wiki(lastOpen)
        }
    } catch (error) {
        err(error)
    }
})()

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        Wiki.createWindow().loadFile(path.join(__dirname, "render", "oops.html"))
    }
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
