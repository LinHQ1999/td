import { error, info } from "electron-log";
import { fork, ChildProcess } from 'child_process'
import { config } from "./config";
import { Notification, shell } from "electron";
import { join } from "path/win32";

interface Service {
  childProcess: ChildProcess;
  port: number;
}

class TWServices {
  static services = new Set<Service>();
  /**
   * 启动 nodejs 版 wiki, 考虑结合 enum 实现
   * @param {string} dir wiki 所在目录
   * @param {number} port 端口，如果被占用则递增，不应由用户设定
   * @param {string[]} args 额外启动参数，一行一组
   * @returns
   */
  static launch(dir: string, port: number, ...args: string[]): Service {
    port = TWServices.schport(port);

    const tw = config.tw;
    // 此处检查 tw 环境
    console.log(`是否存在 tw ${!tw}`);
    if (!tw) {
      const guide = new Notification({ title: "请执行 npm i -g tiddlywiki" });
      guide.show();
      guide.once("click", () =>
        shell.openPath(
          join(process.env.APPDATA ?? "", "td", "logs", "main.log"),
        ),
      );
      throw new Error("No tw detected!");
    }

    // 检查通过更新缓存
    info("更新 tw 路径成功！");
    config.tw = tw;

    // fork 比 worker 性能更好
    const childProcess = fork(tw, [dir, "--listen", `port=${port}`].concat(args), { stdio: 'pipe' }); /* 不指定为 pipe stdout 无法接受消息 */
    childProcess.on("exit", (err) => {
      error(err);
      throw err;
    });

    const instance = {  childProcess, port };
    TWServices.services.add(instance);
    return instance;
  }

  /**
   * 解决端口冲突
   * @param port 预期端口号
   * @returns 解决冲突后的端口号
   */
  static schport(port: number): number {
    // 先判断在不在表中很有必要，否则端口可能会取到负数
    let actual = port;
    for (const service of TWServices.services) {
      if (service.port == actual) {
        actual = service.port + 1;
      }
    }
    return actual;
  }

  /**
   * 根据端口号停止服务进程
   *
   * @param service 返回的服务
   */
  static stop(service: Service) {
    service.childProcess.kill();
    TWServices.services.delete(service);
  }

  static stopAll() {
    for (const service of TWServices.services) {
      TWServices.stop(service);
    }
  }
}

export { Service, TWServices as TWService };
