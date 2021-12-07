// 控制应用生命周期和创建原生浏览器窗口的模组
const { dialog, app, BrowserWindow } = require('electron')
const Wiki = require('./main/wiki');
const { initMenu } = require('./main/menu');
const path = require('path')
const { config } = require('./main/config');

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
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
