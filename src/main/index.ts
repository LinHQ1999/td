import { app, BrowserWindow, dialog, ipcMain, Notification } from 'electron'
import { error as err, warn } from 'electron-log'
import { existsSync, copyFileSync, removeSync, moveSync } from 'fs-extra'
import { config } from './config'
import { initMenu } from './menu'
import { FileInfo } from './preloads/preload'
import { TWService } from './services'
import { join, basename } from 'path'
import { Wiki } from './wiki'
import { mkdirSync } from 'original-fs'

initMenu();

if (app.requestSingleInstanceLock()) {
    app.whenReady().then(() => {
        let lastOpen = config.lastOpen
        if (!existsSync(config.env.tw)) {
            new Notification({ title: "环境错误", body: "执行 npm i -g tiddlywki" }).show()
            err("宿主机不具备对应环境")
            app.quit()
        }
        // 检查是否是初始状态或目录已变动
        if (lastOpen == undefined || !existsSync(lastOpen)) {
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
        TWService.stopAll()
        app.quit()
    }
})

/**
 * 响应暴露的 api，建议安装 TDPlugins 插件
 */

// 处理大文件导入
ipcMain.handle("import", (_, file: FileInfo) => {
    if (file.path && Wiki.cwd) {
        let cwd = Wiki.cwd.dir
        let base = basename(file.path)
        let destDIR = join(cwd, "files")
        if (!existsSync(join(destDIR, base))) {
            copyFileSync(file.path, join(destDIR, file.name))
        } else {
            new Notification({ title: "已存在相关文件！" }).show()
        }
    } else {
        new Notification({ title: "拖你 M 呢，空玩意" }).show()
    }
})

/**
 * path: ./files/*
 */
ipcMain.handle("delete", (_, path: string) => {
    // 防止执行到一半发生变化，存储快照
    if (Wiki.cwd) {
        let cwd = Wiki.cwd.dir
        let trash = join(cwd, "files", ".trash")
        if (!existsSync(trash)) {
            mkdirSync(trash)
        }
        let fullpath = join(cwd, path)
        if (existsSync(fullpath)) {
            moveSync(fullpath, join(trash, basename(fullpath)))
            // removeSync(fullpath)
        }
    }
})