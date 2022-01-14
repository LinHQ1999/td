import ElectronStore from 'electron-store'
import Store from 'electron-store'

class Config {
    store: ElectronStore

    constructor() {
        this.store = new Store()
    }
    

    set lastOpen(dir: string) {
        this.store.set("last", dir)
    }

    get lastOpen(): string {
        return this.store.get("last") as string
    }
}

export let config = new Config()