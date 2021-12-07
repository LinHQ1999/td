import { app, BrowserWindow, dialog } from 'electron'
import path from 'path'
import { config } from './main/config'
import { initMenu } from './main/menu'
import { Wiki } from './main/wiki'

initMenu();

app.whenReady().then(() => {
    let lastOpen = config.lastOpen
    if (lastOpen == undefined) {
        let win = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                preload: path.join(__dirname, "preloads", "preload.js")
            }
        })
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
})

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
