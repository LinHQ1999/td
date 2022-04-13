import {error} from 'electron-log'
import {Worker} from 'worker_threads'
import {config} from './config'

interface Service {
    worker: Worker
    port: number
}

class TWServices {
    static tw: string = config.env.tw
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

        let instance = {worker, port}
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
        service.worker.terminate()
        TWServices.services.delete(service)
    }

    static stopAll() {
        for (let service of TWServices.services) {
            TWServices.stop(service)
        }
    }
}

export {Service, TWServices as TWService}
