import { contextBridge, ipcRenderer } from "electron";

export const api = {
  search: (text: string, mode: number) =>
    ipcRenderer.invoke("search", text, mode),
};

contextBridge.exposeInMainWorld("SC", api);
