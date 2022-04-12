import { app, BrowserWindow, dialog, Notification } from 'electron'
import { error as err, warn } from 'electron-log'
import { existsSync } from 'fs-extra'
import { InitAPI } from './api'
import { config } from './config'
import { initMenu } from './menu'
import { TWService } from './services'
import { Wiki } from './wiki'

/**
 * 初始化菜单
 */
initMenu();

/**
 * 响应暴露的 api，需要安装 TDPlugins 插件
 */
InitAPI()

if (app.requestSingleInstanceLock()) {
    app.whenReady().then(() => {
        if (!config.has.tw) {
            new Notification({ title: "环境错误", body: "执行 npm i -g tiddlywki" }).show()
            err("宿主机不具备对应环境")
            app.quit()
        } else if (!config.has.wd) {
            new Notification({ title: "环境错误", body: "执行 go install suah.dev/widdler@latest" }).show()
            err("宿主机不具备对应环境")
            app.quit()
        }

        let lastOpen = config.Opened
        // 检查是否是初始状态或目录已变动
        if (lastOpen == undefined || !existsSync(lastOpen)) {
            let win = Wiki.createWindow()
            dialog.showOpenDialog(win, { properties: ["openDirectory"] })
                .then(selected => {
                    let paths = selected.filePaths
                    if (paths.length != 0) {
                        let first = new Wiki(paths[0], win)
                        Wiki.wikis.add(first)
                        // 把第一次打开的作为默认值
                        config.Opened = first.dir
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
        TWService.stopAll()
        app.quit()
    }
})
