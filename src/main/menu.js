exports.menu = [
    {
        label: '打开',
        submenu: [
            {
                label: '选择目录',
                click() {
                    console.log('👋')
                }
            },
            { type: 'separator'},
            { role: 'reload' }
        ]
    }
]
