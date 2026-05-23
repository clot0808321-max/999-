

## 正確啟動方式

1. 先把 ZIP 完整解壓縮。
2. 進入資料夾。
3. 雙擊 `START-HERE.bat`。
4. 前台：http://localhost:3000
5. 後台：http://localhost:3000/admin
6. 後台帳號：My999
7. 後台密碼：Mas999

不要在 ZIP 壓縮檔裡面直接點啟動，必須先解壓縮。

# 888台灣商店

這是一套完整可本地執行的商店網站：

- 前台商店
- 商品分類
- 商品列表與商品詳細頁
- 購物車
- 結帳下單
- 商家後台
- 商品管理
- 分類管理
- 訂單管理
- SQLite 資料庫

## 後台登入

網址：

```txt
http://localhost:3000/My999
```

帳號：

```txt
My999
```

密碼：

```txt
Mas999
```

## 本地測試教學

### 第 1 步：安裝 Node.js

到 Node.js 官網下載 LTS 版本並安裝。

### 第 2 步：解壓縮本專案

把 `99-taiwan-shop.zip` 解壓縮。

### 第 3 步：開啟資料夾

在資料夾空白處按右鍵，選擇「在終端機中開啟」或「Open in Terminal」。

### 第 4 步：安裝套件

輸入：

```bash
npm install
```

### 第 5 步：啟動網站

輸入：

```bash
npm start
```

看到：

```txt
888台灣商店已啟動：http://localhost:3000
```

代表成功。

### 第 6 步：打開網站

前台：

```txt
http://localhost:3000
```

後台：

```txt
http://localhost:3000/My999
```

## 如何新增商品

1. 打開 `http://localhost:3000/My999`
2. 登入帳號 `My999`，密碼 `Mas999`
3. 點左邊「商品管理」
4. 點「新增商品」
5. 填商品名稱、價格、庫存、分類、描述
6. 上傳圖片
7. 勾選「上架」
8. 點「儲存」

## 如何查看訂單

1. 進入後台
2. 點「訂單管理」
3. 點某一筆訂單的「查看」
4. 可以看到客戶姓名、電話、地址、商品、數量、總金額、備註
5. 可以修改訂單狀態：新訂單、處理中、已完成、已取消

## 如何部署上線：Railway 簡易版

1. 註冊 Railway
2. 建立 New Project
3. 選擇 Deploy from GitHub repo
4. 把這個專案上傳到 GitHub
5. Railway 會自動執行 `npm install`
6. Start Command 設定：

```bash
npm start
```

7. 產生網址後即可開啟

## 如何部署到 VPS / 雲伺服器

1. 安裝 Node.js
2. 把整個資料夾上傳到伺服器
3. 進入資料夾後執行：

```bash
npm install
npm start
```

正式環境建議使用 PM2：

```bash
npm install -g pm2
pm2 start server.js --name 99-taiwan-shop
pm2 save
```

## 重要提醒

本網站部分商品可能涉及年齡限制或當地法規，請依照所在地法律規定購買。

目前版本沒有會員系統，也沒有線上支付。流程是：客戶下單，商家到後台查看訂單。


# Windows 一鍵啟動

直接雙擊：

```txt
一鍵啟動.bat
```

系統會自動：

1. 檢查 Node.js
2. 自動安裝套件
3. 自動開啟網站
4. 啟動伺服器

不用再手動輸入 npm install / npm start


# 如果「一鍵啟動.bat」閃退

請改用新版的一鍵啟動檔：

```txt
一鍵啟動.bat
```

如果還是閃退，請先雙擊：

```txt
檢查環境.bat
```

然後把黑色視窗的畫面截圖給我。

常見原因：

1. 電腦沒有安裝 Node.js
2. npm install 安裝失敗
3. 沒有在正確資料夾啟動
4. Windows 安全性阻擋 bat 檔

手動啟動方式：

在資料夾空白處按右鍵，選擇「在終端機中開啟」，輸入：

```bash
npm install
npm start
```


# 這版更新內容

本版本已把前台改成更接近參考網站 tw.a45.me 的商品總覽風格：

- 上方導覽列
- 大型商店橫幅
- NEWs 最新消息跑馬燈
- 商品分類篩選列
- 商品區塊標題
- 圖片商品卡片
- 售完 / 現貨 / 價格顯示
- 保留購物車
- 保留結帳下單
- 保留後台管理
- 保留不閃退啟動檔

# 啟動方式

請點：

```txt
點我啟動網站.cmd
```

如果出錯，請點：

```txt
點我檢查錯誤.cmd
```


## 修改 Telegram / TG 按鈕連結

首頁左下角已新增 TG 浮動按鈕。
如果要改成你的 Telegram，請打開：

```text
views/home.ejs
```

找到：

```text
https://t.me/TWSHOP888
```

改成你的 Telegram 連結，例如：

```text
https://t.me/你的帳號
```
