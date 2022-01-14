import { app, BrowserWindow, dialog, Notification } from 'electron'
import { error as err, warn } from 'electron-log'
import { existsSync } from 'original-fs'
import { config } from './config'
import { initMenu } from './menu'
import { services } from './services'
import { Wiki } from './wiki'

initMenu();

if (app.requestSingleInstanceLock()) {
    app.whenReady().then(() => {
        let lastOpen = config.lastOpen
        if (!existsSync(config.env.exec)) {
            new Notification({ title: "环境错误", body: "执行 npm i -g tiddlywki" }).show()
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
                        Wiki.wikis.add(new Wiki(paths[0], win))
                    }
                })
        } else {
            Wiki.wikis.add(new Wiki(lastOpen))
        }
    }).catch(reason => {
        err(reason)
        app.quit()
    })
} else {
    warn("不允许多实例")
    app.quit()
}

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        // Wiki.createWindow().loadFile(path.join(__dirname, "render", "oops.html"))
        app.quit()
    }
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        services.stopAll()
        app.quit()
    }
})
