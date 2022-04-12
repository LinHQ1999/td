import {ChildProcess, spawn} from 'child_process'
import {error} from 'electron-log'
import {Worker} from 'worker_threads'
import {config} from './config'

interface Service {
    worker: Worker | ChildProcess
    port: number
    type: LaunchType
}

enum LaunchType {
    "node",
    "html"
}

class TWServices {
    static tw: string = config.env.tw
    static wd: string | undefined = config.env.wd
    static services = new Set<Service>()
    /**
     * 启动 nodejs 版 wiki, 考虑结合 enum 实现
     * @param {string} dir wiki 所在目录
     * @param {number} port 端口，如果被占用则递增，不应由用户设定
     * @param {string[]} args 额外启动参数，一行一组
     * @returns 
     */
    static launch(dir: string, port: number, ...args: string[]): Service {
        port = TWServices.schport(port)

        let worker = new Worker(TWServices.tw,
            {
                argv: [dir, "--listen", `port=${port}`].concat(args)
            })
        worker.on("error", (err) => error(err.message))

        let instance = {worker, port, type: LaunchType.node}
        TWServices.services.add(instance)
        return instance
    }

    /**
     * 使用 widdler 启动单文件 wiki
     * @deprecated 不再使用外部程序，TD 自己进行管理
     * @param dir wiki 目录
     * @param port 预期端口号
     * @returns none
     */
    static launchFile(dir: string, port: number): Service {
        // let workerjs = isDev ? join(__dirname, "workers", "widdler.js") : join(process.resourcesPath, "app.asar.unpacked", "workers", "widdler.js")
        // 重分配端口
        port = TWServices.schport(port)
        let ps = spawn(config.env.wd, ["-wikis", dir, "-auth", "false", "-http", `0.0.0.0:${port}`])
        ps.on("error", error)

        let instance = {worker: ps, port: port, type: LaunchType.html}
        TWServices.services.add(instance)
        return instance
    }

    /**
     * 解决端口冲突
     * @param port 预期端口号
     * @returns 解决冲突后的端口号
     */
    static schport(port: number): number {
        // 先判断在不在表中很有必要，否则端口可能会取到负数
        let actual = port
        for (let service of TWServices.services) {
            if (service.port == actual) {
                actual = service.port + 1
            }
        }
        return actual
    }

    /**
     * 根据端口号停止服务进程
     * 
     * @param service 返回的服务
     */
    static stop(service: Service) {
        if (service.type == LaunchType.html) {
            let ps = service.worker as ChildProcess
            ps.kill()
        } else {
            let wk = service.worker as Worker
            wk.terminate()
        }
        TWServices.services.delete(service)
    }

    static stopAll() {
        for (let service of TWServices.services) {
            TWServices.stop(service)
        }
    }
}

export {LaunchType, Service, TWServices as TWService}
