import { dialog, Menu, shell } from 'electron'
import { Wiki } from './wiki'

let menu = [
    {
        label: '文件',
        submenu: [
            {
                label: '打开目录',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    let selected = await dialog.showOpenDialog(browserWindow, { properties: ["openDirectory"] })
                    if (selected.filePaths.length != 0) {
                        new Wiki(selected.filePaths[0])
                    }
                }
            },
            { type: 'separator' },
            { role: 'quit' }

        ]
    },
    {
        label: '浏览',
        submenu: [
            {
                label: '浏览器中打开',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    shell.openExternal(browserWindow.webContents.getURL())
                }
            },
            { type: 'separator' },
            { role: 'reload' },
        ]
    }
]

export function initMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu as any))
}