# Railway 部署修正版

這一版已移除 Dockerfile，改強制使用 Nixpacks 安裝 Node 套件，修正 Railway 出現：

```txt
Error: Cannot find module 'express'
```

## Railway Variables

```env
PERSIST_DIR=/data
SQLITE_PATH=/data/shop.sqlite
UPLOAD_DIR=/data/uploads
SESSION_SECRET=888SHOP_SECRET_2026
NIXPACKS_NODE_VERSION=20
```

## Volume

Mount Path:

```txt
/data
```

## GitHub 上傳注意

不要上傳 node_modules。
把本 ZIP 解壓縮後，進入資料夾內，全選所有檔案上傳到 GitHub 根目錄。

## Railway 操作

1. 上傳 GitHub 後回 Railway
2. 點左上 Deploy 套用變更
3. 若仍失敗，進 Settings → Clear Build Cache
4. 再 Redeploy
