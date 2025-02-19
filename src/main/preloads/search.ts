import { contextBridge, ipcRenderer } from "electron";
import { ISearchOpts, ISearchRes } from "../api";

export const api = {
  search: (opt: ISearchOpts) => {
    ipcRenderer.send("search", opt)
  },
  onSearch: (cb: (res: ISearchRes) => void) => {
    ipcRenderer.on("search:res", (_, res: ISearchRes) => cb(res))
  }
};

contextBridge.exposeInMainWorld("SC", api);
