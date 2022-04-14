## 介绍

基于 electron 简单封装 TiddlyWiki 的启动逻辑，支持单文件版和 Node.js 版。

## 基本功能

使用 alt 键打开菜单栏。

- 打开 wiki 目录
- 打开 wiki 所在目录
- 在浏览器中打开
- 重载服务

## 将 td-plugins.json 拖至你的 wiki 以添加增强功能

1. 单文件支持。
2. 拖拽时自动将文件存储到 files 目录中。
3. 一键将内嵌文件转储到 files 目录中。
4. 启动时自动清理附件。
5. windows 上弹出提示不会丢失输入焦点。

## 环境

> 确保以下命令能够在终端中执行。

1. 需要安装 nodejs 版 tiddlywiki。

## 构建

1. 安装依赖：`yarn`
2. 开发环境：`yarn start`
3. 打包： `yarn dist`
