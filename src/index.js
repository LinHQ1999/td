// 控制应用生命周期和创建原生浏览器窗口的模组
const { app, BrowserWindow, Menu } = require('electron')
const { services: TWService } = require('./main/services')
const path = require('path')
const { menu } = require('./main/menu')

let twService = new TWService()
twService.launch("C:\\Users\\11571\\Documents\\tws\\我的笔记 - 副本")

function createWindow() {
    // 创建浏览器窗口
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "src", "main", "preload.js"),
            nodeIntegration: true
        }
    })
    mainWindow.maximize()
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu))

    // 加载 index.html
    // mainWindow.loadFile(path.join(__dirname, "..", "render", "index.html"))
    mainWindow.loadURL("http://localhost:9080")
    // 打开开发工具
    // mainWindow.webContents.openDevTools()
}


app.whenReady().then(() => {
    createWindow()
})

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        twService.stopAll()
        app.quit()
    }
})
