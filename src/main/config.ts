import { execSync } from 'child_process'
import { default as ElectronStore, default as Store } from 'electron-store'
import { existsSync } from 'original-fs'
import { platform } from 'os'
import { join } from 'path'
import {info} from 'electron-log'

interface Env {
    os: string
    exec: string
}

class Config {
    env: Env
    store: ElectronStore

    constructor() {
        this.store = new Store()

        this.env = this.store.get("env") as Env
        if (!this.env) {
            let exec = join(execSync("npm root -g").toString(), "tiddlywiki", "tiddlywiki.js")
            let os = platform() as string
            this.env = { os, exec }
            this.store.set("env", this.env)
        } else if (!existsSync(this.env.exec)) {
            // 适用于存在配置但并不存在可执行文件的情况，将刷新路径
            // 可能并不需要
            this.env.exec = join(execSync("npm root -g").toString().trim(), "tiddlywiki", "tiddlywiki.js")
            this.store.set("env", this.env)
        }
        info(this.env)
    }

    set lastOpen(dir: string) {
        this.store.set("last", dir)
    }

    get lastOpen(): string {
        return this.store.get("last") as string
    }
}

export let config = new Config()