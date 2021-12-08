import { ChildProcess, exec as exec_, fork } from 'child_process'
import { error } from 'electron-log'
import path from 'path'
import { promisify } from 'util'

class TWService {
    tw: string = ""
    decoder: TextDecoder
    services: Map<number, ChildProcess>

    constructor(decode = "gbk") {
        // this.exec = path.join(__dirname, "..", "node_modules", "tiddlywiki", "tiddlywiki.js")
        this.decoder = new TextDecoder(decode)
        // Map<port, process>
        this.services = new Map<number, ChildProcess>()
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

        let ps = fork(this.tw, [".", "--listen", "host=0.0.0.0", `port=${port}`, "anon-username=林汉青"], {
            cwd: dir
        })
        // let ps = spawn("cmd", ["/c", `"${this.prg}"`, ".", "--listen", "host=0.0.0.0", "port=9080", "anon-username=林汉青"], {
        //     cwd: dir
        // })

        this.services.set(port, ps)
        ps.on("error", (err) => error(err.message))
        return port
    }

    /**
     * 必须先执行此方法，否则不能正确启动服务
     */
    async setup(): Promise<string> {
        let exec = promisify(exec_)
        let out = await exec("npm root -g")
        this.tw = path.join(out.stdout.trim(), "tiddlywiki", "tiddlywiki.js")
        return this.tw
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