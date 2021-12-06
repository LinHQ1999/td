const path = require('path')
const { fork } = require('child_process')

class TWService {
    constructor(decode = "gbk") {
        this.decoder = new TextDecoder(decode)
        this.services = new Set();
    }

    /**
     * 
     * @param {string} dir wiki 所在目录
     * @returns 
     */
    launch(dir) {
        let ps = fork(path.join(__dirname, "..", "node_modules", "tiddlywiki", "tiddlywiki.js"), [".", "--listen", "host=0.0.0.0", "port=9080", "anon-username=林汉青"], {
            cwd: dir
        })
        // let ps = spawn("cmd", ["/c", `"${this.prg}"`, ".", "--listen", "host=0.0.0.0", "port=9080", "anon-username=林汉青"], {
        //     cwd: dir
        // })

        this.services.add(ps)

        ps.on("error", (err) => console.log(err.message))
        return ps
    }

    /**
     * 
     * @param {Nodejs.Process} service 进程
     */
    stop(service) {
        service.kill()
    }

    stopAll() {
        for (let e of this.services) {
            this.stop(e)
        }
    }
}

exports.services = TWService;