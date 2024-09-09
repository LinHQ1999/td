import {execSync} from 'child_process'
import {info} from 'electron-log'
import {default as ElectronStore, default as Store} from 'electron-store'
import {existsSync} from 'original-fs'
import {join} from 'path'
import {platform} from  'os'

/**
 * 环境参数
 */
interface Env {
    os: string
    // tiddlywiki.js 路径
    tw: string | undefined

    opened: string
}

class Config {
    // 持久化配置/状态
    store: ElectronStore<Env>

    constructor() {
        this.store = new Store<Env>({
            defaults: {
              os: platform(),
              tw: undefined,
              opened: ''
            }
        })

        info(this.store.store)
        info(this.Opened)
    }

    /**
     * 缓存 -> 实时 -> undefined
     */
    get tw(): string | undefined {
      const prev = this.store.get('tw')
      if (existsSync(prev as string)) return prev
      const tw = join(execSync("npm root -g").toString().trim(), "tiddlywiki", "tiddlywiki.js")
      info(`尝试使用新获取的 tw 路径 ${tw}`)
      return existsSync(tw) ? tw : undefined
    }

    set tw(path: string | undefined) {
      this.store.set('tw', path)
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
