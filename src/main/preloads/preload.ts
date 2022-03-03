import { contextBridge, ipcRenderer } from "electron"

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
  "download": (file:ArrayBuffer, fname:string) => ipcRenderer.invoke("download", file, fname),
  "convert": (file:string, fname:string) => ipcRenderer.invoke("convert", file, fname),
  "delete": (canonical: string) => ipcRenderer.invoke("delete", canonical)
}
contextBridge.exposeInMainWorld("TD", api)