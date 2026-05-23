# 888台灣商店部署重點

已修改：

- Telegram 客服連結已改為：https://t.me/TWSHOP888
- Header 客服按鈕已改為正式連結
- 左下角 Telegram 浮動按鈕已改為正式連結
- 訂單完成頁 Telegram 按鈕已改為正式連結
- Header Logo 已更新為 888 TAIWAN SHOP 圖片
- 保留 SQLite + Railway Volume 永久保存架構

Railway Variables：

```env
PERSIST_DIR=/data
SQLITE_PATH=/data/shop.sqlite
UPLOAD_DIR=/data/uploads
SESSION_SECRET=888SHOP_SECRET_2026_CHANGE_ME
NIXPACKS_NODE_VERSION=20
```

Railway Volume Mount Path：

```text
/data
```

後台預設帳密：

```text
帳號：My999
密碼：Mas999
```

部署注意：

- 不要上傳 node_modules
- GitHub 上傳整包檔案後 Railway 會自動 npm install
- Railway 必須使用 Node 20
