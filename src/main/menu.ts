import { Menu, dialog } from 'electron'
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
            { role: 'reload' },
            { role: 'quit' },

        ]
    }
]

export function initMenu (){
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu as any))
}