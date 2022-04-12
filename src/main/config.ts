import { execSync } from 'child_process'
import electronIsDev from 'electron-is-dev'
import { info, error as err } from 'electron-log'
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
    // widdler 路径
    wd: string

    opened: string
}

class Config {
    // 持久化配置/状态
    store: ElectronStore<Env>

    // 运行时状态，不持久化
    has = { tw: true, wd: true }

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
            this.check()
        }
        if (!this.has.wd) {
            // Windows 可以使用打包的 widdler
            if (this.store.get("os") == "win32") {
                info("Using bundled server")
                this.store.set("wd", electronIsDev ?
                    join(__dirname, "..", "binaries", "widdler.exe")
                    : join(process.resourcesPath, "binaries", "widdler.exe"))
                // 状态修正
                this.has.wd = true
            }
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

        let tw = "", wd = ""

        try {
            tw = join(execSync("npm root -g").toString().trim(), "tiddlywiki", "tiddlywiki.js")
            wd = join(execSync("go env GOPATH").toString().trim(), "bin", "widdler")
        } catch (error) {
            err(error)
        }

        return { tw, os, wd, opened: "" }
    }

    check() {
        if (!existsSync(this.store.get("tw"))) this.has.tw = false
        if (!existsSync(this.store.get("wd"))) this.has.wd = false
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
