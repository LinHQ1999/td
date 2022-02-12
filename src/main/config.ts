import { execSync } from 'child_process'
import { info } from 'electron-log'
import { default as ElectronStore, default as Store } from 'electron-store'
import { existsSync } from 'original-fs'
import { platform } from 'os'
import { join } from 'path'

/**
 * 环境参数
 */
interface Env {
    os: string
    // tiddlywiki.js 路径
    tw: string
    // widdler 路径，可选
    wd?: string
}

class Config {
    env: Env
    store: ElectronStore

    constructor() {
        this.store = new Store()

        // 旧的
        this.env = this.store.get("env") as Env
        if (!this.env) {
            let exec = join(execSync("npm root -g").toString(), "tiddlywiki", "tiddlywiki.js")
            let os = platform() as string
            this.env = { os, tw: exec }
            this.store.set("env", this.env)
        } else if (!existsSync(this.env.tw)) {
            // 适用于存在配置但并不存在可执行文件的情况，将刷新路径
            // 可能并不需要
            this.env.tw = join(execSync("npm root -g").toString().trim(), "tiddlywiki", "tiddlywiki.js")
            this.store.set("env", this.env)
        }

        // 获取 widdler 环境
        if (process.env["GOPATH"]) {
            let gobin = join(process.env["GOPATH"], "bin", "widdler.exe")
            this.env.wd = (existsSync(gobin)) ? gobin : undefined
        }

        info(this.env)
        info(this.lastOpen)
    }

    set lastOpen(dir: string) {
        this.store.set("last", dir)
    }

    get lastOpen(): string {
        return this.store.get("last") as string
    }
}

export let config = new Config()