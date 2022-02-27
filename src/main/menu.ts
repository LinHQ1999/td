import { dialog, Menu, shell } from 'electron'
import { config } from './config'
import { Wiki } from './wiki'

type MenuTemplate = typeof MenuTmpl

export let MenuTmpl = [
    {
        label: '文件',
        submenu: [
            {
                label: '打开目录',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    let selected = await dialog.showOpenDialog(browserWindow, { properties: ["openDirectory"] })
                    if (selected.filePaths.length != 0) {
                        Wiki.wikis.add(new Wiki(selected.filePaths[0]))
                    }
                }
            },
            {
                label: '重载服务',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    for (let wiki of Wiki.wikis) {
                        if (wiki.win === browserWindow) {
                            wiki.restart()
                        }
                    }
                }
            },
            {
                label: '设为默认',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    for (let wiki of Wiki.wikis) {
                        if (wiki.win === browserWindow) {
                            config.Opened = wiki.dir
                        }
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
            }, {
                label: '打开所在位置',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    for (let wiki of Wiki.wikis) {
                        if (wiki.win === browserWindow) {
                            shell.openPath(wiki.dir)
                            return
                        }
                    }
                }
            },
            { type: 'separator' },
            {
                label: '开发者工具',
                async click(_: any, browserWindow: Electron.BrowserWindow, event: Electron.Event) {
                    browserWindow.webContents.openDevTools()
                }
            }, { role: 'reload' },
        ]
    }
]

export function initMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate(<any>MenuTmpl))
}