import { app, BrowserWindow, dialog } from "electron";
import { info, error as err, warn } from "electron-log";
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
      const lastOpen = config.Opened;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, existsLast] = await Promise.all([app.whenReady(), pathExists(lastOpen)])
      // 检查是否是初始状态或目录已变动
      if (lastOpen === undefined || !existsLast ) {
        const win = Wiki.createWindow();
        const selected = await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
        const paths = selected.filePaths;
        if (paths.length != 0 && !selected.canceled) {
          const first = await Wiki.bootstrap(paths[0], win);
          Wiki.wikis.add(first);
          // 把第一次打开的作为默认值
          config.Opened = first.dir;
        } else {
          info("用户手动取消操作")
          app.quit()
        }
      } else {
        Wiki.wikis.add(await Wiki.bootstrap(lastOpen));
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
