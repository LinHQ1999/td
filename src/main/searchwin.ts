import {BrowserWindow} from "electron"
import {join} from 'path'
import {Wiki} from "./wiki"

export class searchWin {
    static instance: searchWin | null = null
    window: BrowserWindow
    show = false

    constructor() {
        if (searchWin.instance) {
            this.window = searchWin.instance.window
            return
        }
        this.window = new BrowserWindow({
            alwaysOnTop: true,
            frame: false,
            transparent: true,
            autoHideMenuBar: true,
            show: this.show,
            height: 150,
            width: 400,
            resizable: false,
            movable: false,
            y: 0,
            webPreferences: {
                preload: join(__dirname, "preloads", "search.js")
            }
        })
        this.window.loadFile(join(__dirname, "..", "src", "render", "search.html"))
        searchWin.instance = this
    }

    searchIn(parent: BrowserWindow) {
        this.window.setParentWindow(parent)
        this.open()
        return this
    }

    toggle() {
        if (this.show) {
            this.close()
        } else {
            this.open()
        }
    }

    open() {
        this.window.show()
    }

    close() {
        this.window.close()
    }
}
