# Railway 部署修正版

這版加入 Dockerfile，會在 Railway build 時自動執行 npm install，修正：

- Cannot find module 'express'
- Railway 沒有安裝 node_modules

## 上傳 GitHub 時注意

請把這個壓縮檔解壓後的「全部檔案」上傳到 GitHub。

重要：
- 要上傳 Dockerfile
- 不要上傳 node_modules
- 如果 GitHub 之前已有舊 Dockerfile，請用這版覆蓋

## Railway Variables

PERSIST_DIR=/data
SQLITE_PATH=/data/shop.sqlite
UPLOAD_DIR=/data/uploads
SESSION_SECRET=888SHOP_SECRET_2026
NIXPACKS_NODE_VERSION=20

## Railway Volume

Mount Path:
/data

## 如果還是失敗

到 Railway：Settings → Clear Build Cache → Redeploy
