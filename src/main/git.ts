import { exec } from 'child_process'
import { info } from 'electron-log'
import { existsSync } from 'original-fs'

/**
 * 检查 git 状态并提交
 * @param dir 工作目录
 */
export function CheckCommit(dir: string): void {
    if (existsSync(".git")) {
        exec("git status", { cwd: dir }, (err, out, stderr) => {
            if (out.toString().split("\n")[0] != "") {
                exec(`git add . && git commit -a -m "${new Date().toLocaleString()}"`, { cwd: dir, timeout: 5000 },
                    (error, out, stderr) => {
                        if (!error)
                            info("自动提交成功")
                        else
                            info(stderr)
                    })
            } else info("无变更")
        })
    } else {
        info("无仓库")
    }
}