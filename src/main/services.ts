import { error } from 'electron-log'
import { Worker } from 'worker_threads'
import { config } from './config'

export interface Service {
    worker: Worker
    port: number
}

class TWService {
    tw: string = ""
    services: Map<number, Worker>

    constructor() {
        this.services = new Map<number, Worker>()
        this.tw = config.env.exec
    }

    /**
     * 
     * @param {string} dir wiki 所在目录
     * @param {number} port 端口，如果被占用则递增，不应由用户设定
     * @param {string[]} args 额外启动参数，一行一组
     * @returns 
     */
    launch(dir: string, port: number, ...args: string[]): Service {
        // 先判断在不在表中很有必要，否则端口可能会取到负数
        if (this.services.has(port)) {
            port = Math.max(...Array.from(this.services.keys())) + 1
        }

        let worker = new Worker(this.tw,
            {
                argv: [dir, "--listen", `port=${port}`].concat(args)
            })
        this.services.set(port, worker)
        worker.on("error", (err) => error(err.message))
        return { worker, port }
    }

    /**
     * 根据端口号停止服务进程
     * 
     * @param port 端口号
     */
    stop(port: number) {
        let worker = this.services.get(port)
        if (worker != null) {
            worker.terminate()
            // 同时从表中移除
            this.services.delete(port)
        }
    }

    stopAll() {
        for (let [port, _] of this.services) {
            this.stop(port)
        }
    }
}

export let services = new TWService();