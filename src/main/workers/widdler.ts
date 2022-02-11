import { spawn } from 'child_process'
import { isMainThread, workerData } from 'worker_threads'
import {info, error} from 'electron-log'

/**
 * 包装 widdler 为线程
 */

(() => {
    if (!isMainThread) {
        // 触发 data 事件
        let ps = spawn("widdler", workerData as string[])
        ps.on("error", error)
        ps.once("spawn", () => info("Widdler started!"))
    }
})()