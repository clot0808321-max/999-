# Railway Volume 永久保存設定（888台灣商店）

## 1. Railway Volume 建立

1. 進入 Railway 專案
2. 點你的 Web Service
3. 找到 **Volumes**
4. 新增 Volume
5. Mount Path 請填：

```
/data
```

## 2. Railway Variables 設定

請到 **Variables** 新增：

```
PERSIST_DIR=/data
SQLITE_PATH=/data/shop.sqlite
UPLOAD_DIR=/data/uploads
SESSION_SECRET=請改成一組很長的隨機字串
```

## 3. 資料實際保存位置

SQLite：

```
/data/shop.sqlite
```

商品圖片 uploads：

```
/data/uploads
```

JSON 相容備份：

```
/data/shop-data.json
```

## 4. 重要說明

- `public/uploads` 不再當正式永久圖片庫。
- 程式會把 `/uploads/...` 指向 Railway Volume 的 `/data/uploads`。
- 舊 JSON 結構仍會保留備份，方便回滾或人工檢查。
- 第一次啟動時，如果 SQLite 是空的，會自動從舊 JSON 匯入資料。

## 5. 測試方式

1. 登入後台新增一個商品與圖片
2. 確認前台看得到商品
3. 在 Railway 按 Restart
4. 再重新打開網站
5. 商品與圖片仍存在，即代表 Volume 永久保存成功

## 6. 如果 Railway Build 失敗

本版使用 `better-sqlite3`。請確認 Railway 使用 Node 20。`package.json` 已指定：

```json
"engines": { "node": "20.x" }
```

如果 Railway 仍使用其他版本，請在 Railway Variables 加：

```
NIXPACKS_NODE_VERSION=20
```
