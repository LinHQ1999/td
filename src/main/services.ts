import { ChildProcess, spawn } from 'child_process'
import { error } from 'electron-log'
import { existsSync } from 'fs-extra'
import path from 'path'

export interface Service {
    ps: ChildProcess
    port: number
}

class TWService {
    tw: string = ""
    services: Map<number, ChildProcess>

    constructor() {
        this.services = new Map<number, ChildProcess>()

        // 加载环境
        let nodes = process.env.Path?.split(";").filter(x => x.includes("nodejs"))
        if (nodes != undefined && nodes.length != 0) {
            this.tw = path.join(nodes[0], "node_modules", "tiddlywiki", "tiddlywiki.js")
        }
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

        // 原生方式启动
        let ps = spawn("node", [this.tw, ".", "--listen", "host=0.0.0.0", `port=${port}`].concat(args), {
            cwd: dir
        })
        this.services.set(port, ps)
        ps.on("error", (err) => error(err.message))
        return { ps, port }
    }

    /**
     * 必须先执行此方法，否则不能正确启动服务
     */
    ok(): boolean {
        return existsSync(this.tw)
    }

    /**
     * 根据端口号停止服务进程
     * 
     * @param port 端口号
     */
    stop(port: number) {
        let ps = this.services.get(port)
        if (ps != null) {
            ps.kill()
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