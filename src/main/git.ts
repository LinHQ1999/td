import { execSync as exec } from 'child_process'
import { info, warn } from 'electron-log'

/**
 * 检查 git 状态并提交
 * @param dir 工作目录
 */
export function CheckUpdate(dir: string): void {
    try {
        if (exec("git status", { cwd: dir }).toString().split("\n")[0] != "") {
            exec(`git add . && git commit -a -m "${new Date().toLocaleString()}"`, { cwd: dir })
        } else {
            info("无变更")
        }
    } catch (error) {
        warn(error, "没有 git 仓库")
    }
}