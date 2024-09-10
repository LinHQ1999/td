import { app, BrowserWindow, dialog } from "electron";
import { error as err, warn } from "electron-log";
import { pathExists } from "fs-extra";
import { InitAPI } from "./api";
import { config } from "./config";
import { initMenu } from "./menu";
import { TWService } from "./services";
import { Wiki } from "./wiki";

(async () => {

  /**
   * 初始化菜单
   */
  initMenu();

  /**
   * 响应暴露的 api，需要安装 TDPlugins 插件
   */
  InitAPI();

  try {
    if (app.requestSingleInstanceLock()) {
      await app.whenReady()
      const lastOpen = config.Opened;
      // 检查是否是初始状态或目录已变动
      if (lastOpen == undefined || !await pathExists(lastOpen)) {
        const win = Wiki.createWindow();
        const selected = await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
        const paths = selected.filePaths;
        if (paths.length != 0) {
          const first = await Wiki.createWiki(paths[0], win);
          Wiki.wikis.add(first);
          // 把第一次打开的作为默认值
          config.Opened = first.dir;
        }
      } else {
        Wiki.wikis.add(await Wiki.createWiki(lastOpen));
      }
    } else {
      warn("不允许多实例");
      app.quit();
    }
  } catch (reason) {
    err(reason);
    app.quit();
  }

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      // Wiki.createWindow().loadFile(path.join(__dirname, "render", "oops.html"))
      app.quit();
    }
  });

  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
      TWService.stopAll();
      app.quit();
    }
  });
})()
