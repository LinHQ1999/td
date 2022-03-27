import {dialog, Menu, shell} from 'electron'
import {config} from './config'
import {Wiki} from './wiki'

export let MenuTmpl = [
    {
        label: '文件',
        submenu: [
            {
                label: '打开目录',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    let selected = await dialog.showOpenDialog(win, {properties: ["openDirectory"]})
                    if (selected.filePaths.length != 0) {
                        Wiki.wikis.add(new Wiki(selected.filePaths[0]))
                    }
                }
            },
            {
                label: '重载服务',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    const wiki = Wiki.getWiki(win)
                    if (wiki) {
                        wiki.restart()
                    }
                }
            },
            {
                label: '设为默认',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    const wiki = Wiki.getWiki(win)
                    if (wiki) {
                        config.Opened = wiki.dir
                    }
                }
            },
            {type: 'separator'},
            {role: 'quit'}

        ]
    },
    {
        label: '浏览',
        submenu: [
            {
                label: '浏览器中打开',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    await shell.openExternal(win.webContents.getURL())
                    win.minimize()
                }
            },
            {
                label: '打开所在位置',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    const wiki = Wiki.getWiki(win)
                    if (wiki) {
                        shell.openPath(wiki.dir)
                    }
                }
            },
            {type: 'separator'},
            {
                label: '开发者工具',
                async click(_: any, win: Electron.BrowserWindow, _event: Electron.Event) {
                    win.webContents.openDevTools()
                }
            }, {role: 'reload'},
        ]
    }
]

export function initMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate(<any>MenuTmpl))
}
