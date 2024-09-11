import { dialog, Menu, Notification, shell } from "electron";
import { config } from "./config";
import { Wiki } from "./wiki";

export const MenuTmpl = [
  {
    label: "文件",
    submenu: [
      {
        label: "打开目录",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          const selected = await dialog.showOpenDialog(win, {
            properties: ["openDirectory"],
          });
          if (selected.filePaths.length != 0) {
            Wiki.wikis.add(await Wiki.createWiki(selected.filePaths[0]));
          }
        },
      },
      {
        label: "重载服务",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          const wiki = Wiki.getWiki(win);
          if (wiki) {
            wiki.restart();
          }
        },
      },
      {
        label: "设为默认",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          const wiki = Wiki.getWiki(win);
          if (wiki) {
            config.Opened = wiki.dir;
          }
        },
      },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "浏览",
    submenu: [
      {
        label: "浏览器中打开",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          const single = Wiki.getWiki(win)?.wkType;
          if (single && single.isSingle) {
            new Notification({
              title: "仅供预览",
              body: "默认情况下单文件版不支持编辑",
            }).show();
            await shell.openPath(single.path);
          } else {
            await shell.openPath(win.webContents.getURL());
          }
          win.minimize();
        },
      },
      {
        label: "页面内部搜索",
        accelerator: "Ctrl+F",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          new Notification({ title: "还未实现", body: "" }).show();
          // searchWin.instance?.searchIn(win).toggle()
        },
      },
      {
        label: "打开所在位置",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          const wiki = Wiki.getWiki(win);
          if (wiki) {
            shell.openPath(wiki.dir);
          }
        },
      },
      { type: "separator" },
      {
        label: "开发者工具",
        accelerator: "Ctrl+Alt+Shift+F12",
        async click(
          _: any,
          win: Electron.BrowserWindow,
          _event: Electron.Event,
        ) {
          win.webContents.openDevTools();
        },
      },
      { role: "reload" },
    ],
  },
];

export function initMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(<any>MenuTmpl));
}
