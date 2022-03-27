import {exec as _exec} from 'child_process'
import {info, error} from 'electron-log'
import {existsSync} from 'original-fs'
import {join} from 'path'
import {promisify} from 'util'

/**
 * 检查 git 状态并提交
 * @param dir 工作目录
 */
export function CheckCommit(dir: string): void {
    let exec = promisify(_exec)
    if (existsSync(join(dir, ".git"))) {
        exec("git status -s", {cwd: dir})
            .then(({stdout, stderr}) => {
                if (stdout.toString().split("\n")[0] != "") {
                    exec(`git add . && git commit -a -m "${new Date().toLocaleString()}"`, {cwd: dir, timeout: 5000})
                        .then(({stdout, stderr}) => {
                            if (!stderr) info(stdout)
                        })
                        .catch(error)
                }
            })
            .catch(error)
    } else {
        info("无仓库")
    }
}
