const Store = require('electron-store')

class Config {
    constructor(){
        this.store = new Store()
    }

    set lastOpen(dir){
        this.store.set("last", dir)
    }

    get lastOpen(){
        return this.store.get("last")
    }
}

exports.config = new Config()