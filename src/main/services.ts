import { error } from 'electron-log'
import { Worker } from 'worker_threads'
import { config } from './config'
import { join } from 'path'
import isDev from 'electron-is-dev'

interface Service {
    worker: Worker
    port: number
}

enum LaunchType {
    "node",
    "html"
}

class TWService {
    static tw: string = config.env.tw
    static wd: string | undefined = config.env.wd
    static services: Map<number, Worker> = new Map<number, Worker>()
    /**
     * 启动 nodejs 版 wiki, 考虑结合 enum 实现
     * @param {string} dir wiki 所在目录
     * @param {number} port 端口，如果被占用则递增，不应由用户设定
     * @param {string[]} args 额外启动参数，一行一组
     * @returns 
     */
    static launch(dir: string, port: number, ...args: string[]): Service {
        port = TWService.schport(port)

        let worker = new Worker(TWService.tw,
            {
                argv: [dir, "--listen", `port=${port}`].concat(args)
            })
        TWService.services.set(port, worker)
        worker.on("error", (err) => error(err.message))
        return { worker, port }
    }

    /**
     * (实验性) 使用 widdler 启动单文件 wiki
     * @param dir wiki 目录
     * @param port 预期端口号
     * @returns none
     */
    static launchFile(dir: string, port: number) {
        let workerjs = isDev ? join(__dirname, "workers","widdler.js") : join(process.resourcesPath, "app.asar.unpacked", "workers", "widdler.js")
        // 重分配端口
        port = TWService.schport(port)
        let worker = new Worker(workerjs, {
            workerData: ["-wikis", dir, "-auth", false, "-http", `0.0.0.0:${TWService.schport(port)}`]
        })
        TWService.services.set(port, worker)
        worker.on("error", (err) => error(err.message))
        return { worker, port }
    }

    /**
     * 解决端口冲突
     * @param port 预期端口号
     * @returns 解决冲突后的端口号
     */
    static schport(port: number): number {
        // 先判断在不在表中很有必要，否则端口可能会取到负数
        if (TWService.services.has(port)) {
            port = Math.max(...Array.from(TWService.services.keys())) + 1
        }
        return port
    }

    /**
     * 根据端口号停止服务进程
     * 
     * @param port 端口号
     */
    static stop(port: number) {
        let worker = TWService.services.get(port)
        if (worker != null) {
            worker.terminate()
            // 同时从表中移除
            TWService.services.delete(port)
        }
    }

    static stopAll() {
        for (let [port, _] of TWService.services) {
            TWService.stop(port)
        }
    }
}

export {LaunchType, Service, TWService}