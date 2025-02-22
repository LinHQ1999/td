import { app, BrowserWindow, dialog } from "electron";
import { info, error as err, warn } from "electron-log";
import { pathExists } from "fs-extra";
import { InitAPI } from "./api";
import { config } from "./config";
import { initMenu } from "./menu";
import { TWService } from "./services";
import { Wiki } from "./wiki";
import { handlePathErr } from "./utils";

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
      if (lastOpen === undefined || !existsLast) {
        const win = Wiki.createWindow();

        // 这里允许重选
        while (true) {
          const selected = await dialog.showOpenDialog(win, { properties: ["openDirectory"] })
          const paths = selected.filePaths;
          if (paths.length === 1 && !selected.canceled) {
            try {
              const first = await Wiki.bootstrap(paths[0], win);
              config.Opened = first.dir
              break
            } catch (e) {
              handlePathErr(e)
            }
          } else {
            info("用户手动取消操作")
            app.quit()
            break
          }
        }
      } else {
        await Wiki.bootstrap(lastOpen)
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
