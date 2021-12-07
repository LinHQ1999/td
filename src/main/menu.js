const { Menu, dialog } = require("electron")
const Wiki = require("./wiki")

let menu = [
    {
        label: '文件',
        submenu: [
            {
                label: '打开目录',
                async click(_, browserWindow, event) {
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

exports.initMenu = function () {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu))
}