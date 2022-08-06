import {execSync} from 'child_process'
import {error as err, info} from 'electron-log'
import {default as ElectronStore, default as Store} from 'electron-store'
import {existsSync} from 'original-fs'
import {platform} from 'os'
import {join} from 'path'

/**
 * 环境参数
 */
interface Env {
    os: string
    // tiddlywiki.js 路径
    tw: string

    opened: string
}

class Config {
    // 持久化配置/状态
    store: ElectronStore<Env>

    // 运行时状态，不持久化
    has = {tw: true}

    constructor() {
        this.store = new Store<Env>({
            defaults: this.scan()
        })

        // 启动时检查原路径是否失效
        this.check()

        // 更新运行时状态
        if (!this.has.tw) {
            // 状态重置
            this.store.reset()
            this.scan()
            this.check()
        }

        info(this.store.store)
        info(this.Opened)
        info(this.has)
    }

    /**
     * 生成默认的配置
     * @returns 默认配置
     */
    scan(): Env {
        let os = platform() as string

        let tw = ""

        try {
            tw = join(execSync("npm root -g").toString().trim(), "tiddlywiki", "tiddlywiki.js")
        } catch (error) {
            err(error)
        }

        return {tw, os, opened: ""}
    }

    check() {
        if (!existsSync(this.store.get("tw"))) this.has.tw = false
    }

    /**
     * 提供兼容层
     */
    get env() {
        return this.store.store
    }

    set Opened(dir: string) {
        this.store.set("opened", dir)
    }

    get Opened(): string {
        return this.store.get("opened")
    }
}

export let config = new Config()
