import { ChildProcess, spawn } from 'child_process'
import { error } from 'electron-log'
import { existsSync } from 'fs-extra'
import path from 'path'

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
     * @param {number} port 端口，如果被占用则递增
     * @returns 
     */
    launch(dir: string, port: number) {
        let ports = Array.from(this.services.keys()).sort().reverse()
        if (ports.includes(port)) {
            // 比最大的端口号大 1
            port = ports[0] + 1
        }

        // 原生方式启动
        let ps = spawn("node", [this.tw, ".", "--listen", "host=0.0.0.0", `port=${port}`, "anon-username=林汉青"], {
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
     * 请使用 stop 和 stopAll
     * 
     * @param {ChildProcess} service 进程
     */
    stopPs(process: ChildProcess) {
        process.kill()
    }

    stop(port: number) {
        let ps = this.services.get(port)
        if (ps != null)
            this.stopPs(ps);
    }

    stopAll() {
        for (let [_, service] of this.services) {
            this.stopPs(service)
        }
    }
}

export let services = new TWService();