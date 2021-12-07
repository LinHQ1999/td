const path = require('path')
const { fork, ChildProcess } = require('child_process')

class TWService {
    constructor(decode = "gbk") {
        this.exec = path.join(__dirname, "..", "node_modules", "tiddlywiki", "tiddlywiki.js")
        this.decoder = new TextDecoder(decode)
        // Map<port, process>
        this.services = new Map();
    }

    /**
     * 
     * @param {string} dir wiki 所在目录
     * @param {number} port 端口，如果被占用则递增
     * @returns 
     */
    launch(dir, port) {
        let ports = Array.from(this.services.keys())
        if (ports.includes(port)) {
            // 比最大的端口号大 1
            port = ports[0] + 1
        }

        let ps = fork(this.exec, [".", "--listen", "host=0.0.0.0", `port=${port}`, "anon-username=林汉青"], {
            cwd: dir
        })
        // let ps = spawn("cmd", ["/c", `"${this.prg}"`, ".", "--listen", "host=0.0.0.0", "port=9080", "anon-username=林汉青"], {
        //     cwd: dir
        // })

        this.services.set(port, ps)
        ps.on("error", (err) => console.log(err.message))
        return port
    }

    /**
     * 请使用 stop 和 stopAll
     * 
     * @param {ChildProcess} service 进程
     */
    stopPs(process) {
        process.kill()
    }

    stop(port = 9080) {
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

exports.services = new TWService();