import {contextBridge, ipcRenderer} from "electron"

declare global {
    interface Window {
        TD: typeof api
    }
}

export interface FileInfo {
    name: string
    path: string
}

export const api = {
    "import": (info: FileInfo) => ipcRenderer.invoke("import", info),
    "gc": (files: string[]) => ipcRenderer.invoke("gc", files),
    "download": (file: ArrayBuffer, fname: string) => ipcRenderer.invoke("download", file, fname),
    "convert": (file: string, fname: string) => ipcRenderer.invoke("convert", file, fname),
    "delete": (canonical: string) => ipcRenderer.invoke("delete", canonical),
    "confirm": (msg:string) => ipcRenderer.sendSync("confirm", msg),
    "save": (abspath:string, text: string) => ipcRenderer.invoke("save", abspath, text),
    "savesync": (abspath:string, text: string) => ipcRenderer.sendSync("savesync", abspath, text)
}
contextBridge.exposeInMainWorld("TD", api)
