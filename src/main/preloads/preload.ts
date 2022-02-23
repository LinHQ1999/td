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
  "delete": (canonical: string) => ipcRenderer.invoke("delete", canonical)
}
contextBridge.exposeInMainWorld("TD", api)