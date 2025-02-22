import { error } from 'electron-log'
import { dialog } from 'electron/main'
export class PathErr extends Error {
  dir: string

  constructor(msg: string, dir: string) {
    super(msg)
    this.dir = dir
  }
}

export function handlePathErr(e: unknown) {
  if (e instanceof PathErr) {
    error(`用户指定了无效目录：${e.dir}`)
    dialog.showErrorBox('此路径无效！', '请指定其他路径')
  } else {
    error(e)
  }
}
