import { ipcMain, Notification } from "electron"
import { copyFile, existsSync, mkdirSync, move, writeFile } from "fs-extra"
import { basename, join } from 'path'
import { FileInfo } from "./preloads/preload"
import { Wiki } from "./wiki"

/**
 * 初始化所有的 preload 中的操作
 */
export function InitAPI() {

  // 处理 file.path 为空的文件的导入行为
  ipcMain.handle("download", (_, file: ArrayBuffer, fname: string) => {
    if (Wiki.cwd) {
      let cwd = Wiki.cwd.dir
      writeFile(join(cwd, "files", fname), Buffer.from(file))
    }
  })

  // 处理大文件导入
  ipcMain.handle("import", (_, file: FileInfo) => {
    if (file.path && Wiki.cwd) {
      let cwd = Wiki.cwd.dir
      let base = basename(file.path)
      let destDIR = join(cwd, "files")
      if (!existsSync(join(destDIR, base))) {
        copyFile(file.path, join(destDIR, file.name))
      } else {
        new Notification({ title: "已存在相关文件！" }).show()
      }
    } else {
      new Notification({ title: "拖你 M 呢，空玩意" }).show()
    }
  })

  /**
   * path: ./files/*
   */
  ipcMain.handle("delete", (_, path: string) => {
    // 防止执行到一半发生变化，存储快照
    if (Wiki.cwd) {
      let cwd = Wiki.cwd.dir
      let trash = join(cwd, "files", ".trash")
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
  })

}