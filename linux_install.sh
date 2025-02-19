#!/bin/bash

set -e

if [[ ! -f "./dist/td-3.1.1.AppImage" ]]; then
    if [[ ! -d "node_modules" ]]; then
        pnpm install
    fi
    pnpm dist
fi

dest=~/.local/share/applications/td.desktop

cat <<D > $dest
[Desktop Entry]
Name=Tiddly Desktop
Comment=Tiddlywiki for Desktop
Exec=$(realpath ./dist/td-3.1.1.AppImage) --ozone-platform-hint=auto
Icon=$(realpath ./build/icon.png)
Terminal=false
Type=Application
Categories=Utility;Application;
Keywords=notes;text;editor;
StartupNotify=true
D

if desktop-file-validate $dest &> /dev/null;then
    echo '安装成功'
else
    echo '安装失败'
fi

unset $dest

set +e
