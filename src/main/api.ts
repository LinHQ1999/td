import { ipcMain, Notification, shell } from "electron"
import { error, info } from "electron-log"
import { copyFile, existsSync, mkdirSync, move, readdir, writeFile } from "fs-extra"
import { basename, join } from 'path'
import { FileInfo } from "./preloads/preload"
import { Wiki } from "./wiki"

/**
 * 初始化所有的 preload 中的操作
 */
export function InitAPI() {

  /**
   * 处理 file.path 为空的文件的导入行为
   * [实验性] 可能存在序列化和反序列化，大文件可能严重影响程序性能！
   */
  ipcMain.handle("download", (_, file: ArrayBuffer, fname: string) => {
    if (Wiki.current) {
      let cwd = Wiki.current.dir
      writeFile(join(cwd, "files", fname), Buffer.from(file))
    } else {
      new Notification({ title: "不同寻常的错误！", body: "窗口聚焦问题！" }).show()
    }
  })

  /**
   * 以复制的方式导入文件
   */
  ipcMain.handle("import", (_, file: FileInfo) => {
    if (file.path && Wiki.current) {
      let destDIR = join(Wiki.current.dir, "files")
      copyFile(file.path, join(destDIR, file.name))
    } else {
      new Notification({ title: "无法获取资源", body: "正在操作的文件已不存在" }).show()
    }
  })

  /**
   * 文件对比回收
   * fname: ./files/foo.bar
   */
  ipcMain.handle("gc", (_, fnames: string[]) => {
    if (Wiki.current) {
      const cwd = Wiki.current.dir
      // 去除 ./files/ 前缀
      let basenames = fnames.map(fname => basename(fname))
      readdir(join(cwd, "files"))
        .then(resources => {
          let counter = 0
          for (const resource of resources) {
            if (resource == ".trash") continue
            if (!basenames.includes(resource)) {
              info(resource)
              deleteFile(join("files", resource))
              counter++
            }
          }
          return counter
        })
        .then(counter => {
          if (counter != 0) {
            let note = new Notification({ title: "清理完毕", body: `共处理 ${counter} 个项目。` })
            let recycle = join(cwd, "files", ".trash")
            note.show()
            if (existsSync(recycle)) note.once("click", _ => shell.openPath(recycle))
          }
        })
        .catch(error)
    }
  })

  /**
   * path: ./files/foo.bar
   */
  ipcMain.handle("delete", (_, path: string) => {
    deleteFile(path)
  })

}

/**
 * 将指定路径的文件回收
 * 
 * @param path 文件路径[./files/foo.bar]
 */
function deleteFile(path: string) {
  if (Wiki.current) {
    let cwd = Wiki.current.dir
    let trash = join(Wiki.current.dir, "files", ".trash")
    if (!existsSync(trash)) {
      mkdirSync(trash)
    }
    let fullpath = join(cwd, path)
    if (existsSync(fullpath)) {
      move(fullpath, join(trash, basename(fullpath)), {
        overwrite: true
      })
      // removeSync(fullpath)
    }
  }

}