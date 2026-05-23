const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway Volume 永久保存設定：
// 建議 Railway Variables：PERSIST_DIR=/data、SQLITE_PATH=/data/shop.sqlite、UPLOAD_DIR=/data/uploads
const persistDir = process.env.PERSIST_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
const dataDir = persistDir;
const bundledDataDir = path.join(__dirname, 'data');
const uploadDir = process.env.UPLOAD_DIR || path.join(persistDir, 'uploads');
const bundledUploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const dbFile = path.join(dataDir, 'shop-data.json'); // JSON 備份 / 相容舊結構
const oldDbFile = path.join(bundledDataDir, 'shop-data.json');
const sqliteFile = process.env.SQLITE_PATH || path.join(dataDir, 'shop.sqlite');
let sqlite = null;
try {
  const BetterSqlite3 = require('better-sqlite3');
  sqlite = new BetterSqlite3(sqliteFile);
  sqlite.pragma('journal_mode = WAL');
} catch (err) {
  console.error('SQLite 初始化失敗，請確認已安裝 better-sqlite3：', err.message);
  throw err;
}

const defaultCategories = [
  '飲料區','台灣來的酒','香煙區','冷凍食品區','濾嘴區','盤子、隨身盤',
  '生活用品區','泡麵、麵食區','藥品區','調味品、罐頭區','餅乾區','拜拜金紙區'
];

function defaultData() {
  const categories = defaultCategories.map((name, i) => ({ id: i + 1, name, sort_order: i + 1 }));
  const cid = (name) => categories.find(c => c.name === name).id;
  return {
    nextProductId: 9,
    nextCategoryId: 13,
    nextOrderId: 1,
    categories,
    products: [
      {id:1,name:'黑松沙士',price:2,stock:24,description:'台灣經典汽水，冰過更好喝。',image:'/uploads/sample-1.svg',category_id:cid('飲料區'),is_active:1,created_at:new Date().toISOString()},
      {id:2,name:'維力炸醬麵',price:3,stock:40,description:'台灣泡麵代表，快速方便。',image:'/uploads/sample-2.svg',category_id:cid('泡麵、麵食區'),is_active:1,created_at:new Date().toISOString()},
      {id:3,name:'台灣米酒',price:8,stock:10,description:'料理常用酒品，購買請遵守當地法規。',image:'/uploads/sample-3.svg',category_id:cid('台灣來的酒'),is_active:1,created_at:new Date().toISOString()},
      {id:4,name:'香菸展示品',price:5,stock:20,description:'年齡限制商品，請依所在地法律購買。',image:'/uploads/sample-4.svg',category_id:cid('香煙區'),is_active:1,created_at:new Date().toISOString()},
      {id:5,name:'冷凍蔥抓餅',price:6,stock:15,description:'台灣早餐常見冷凍食品。',image:'/uploads/sample-5.svg',category_id:cid('冷凍食品區'),is_active:1,created_at:new Date().toISOString()},
      {id:6,name:'金蘭醬油',price:4,stock:18,description:'台灣家用調味料。',image:'/uploads/sample-6.svg',category_id:cid('調味品、罐頭區'),is_active:1,created_at:new Date().toISOString()},
      {id:7,name:'義美小泡芙',price:3,stock:35,description:'台灣人氣餅乾零食。',image:'/uploads/sample-7.svg',category_id:cid('餅乾區'),is_active:1,created_at:new Date().toISOString()},
      {id:8,name:'拜拜金紙組',price:3,stock:30,description:'祭拜用品，適合家庭日常使用。',image:'/uploads/sample-8.svg',category_id:cid('拜拜金紙區'),is_active:1,created_at:new Date().toISOString()}
    ],
    orders: [],
    order_items: [],
    admins: [{ id: 1, username: 'My999', password_hash: bcrypt.hashSync('Mas999', 10) }]
  };
}
function normalizeData(data) {
  const fallback = defaultData();
  data = data || fallback;
  data.categories = Array.isArray(data.categories) && data.categories.length ? data.categories : fallback.categories;
  data.products = Array.isArray(data.products) ? data.products : [];
  data.orders = Array.isArray(data.orders) ? data.orders : [];
  data.order_items = Array.isArray(data.order_items) ? data.order_items : [];
  data.admins = Array.isArray(data.admins) && data.admins.length ? data.admins : fallback.admins;
  data.products.forEach((p, i) => {
    p.id = Number(p.id);
    p.price = parsePrice(p.price);
    p.stock = Math.max(0, Number.parseInt(p.stock ?? 0, 10) || 0);
    p.unit = p.unit || '件';
    p.sort_order = Number(p.sort_order || i + 1);
    p.is_active = p.is_active ? 1 : 0;
    p.category_id = Number(p.category_id || 1);
  });
  data.categories.forEach((c, i) => { c.id = Number(c.id); c.sort_order = Number(c.sort_order || i + 1); });
  data.orders.forEach(o => { o.id = Number(o.id); o.total = parsePrice(o.total); });
  data.order_items.forEach((i, idx) => { i.id = Number(i.id || idx + 1); i.order_id = Number(i.order_id); i.product_id = Number(i.product_id); i.price = parsePrice(i.price); i.quantity = Number(i.quantity || 1); i.subtotal = parsePrice(i.subtotal); });
  data.nextProductId = Number(data.nextProductId || (Math.max(0, ...data.products.map(p => p.id || 0)) + 1));
  data.nextCategoryId = Number(data.nextCategoryId || (Math.max(0, ...data.categories.map(c => c.id || 0)) + 1));
  data.nextOrderId = Number(data.nextOrderId || (Math.max(0, ...data.orders.map(o => o.id || 0)) + 1));
  return data;
}

function initSQLite() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, sort_order INTEGER DEFAULT 99);
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '件',
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      category_id INTEGER,
      sort_order INTEGER DEFAULT 999,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      customer_name TEXT,
      phone TEXT,
      address TEXT,
      note TEXT,
      total REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT '新訂單',
      created_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT,
      price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
  `);
  const productCols = sqlite.prepare('PRAGMA table_info(products)').all().map(c => c.name);
  if (!productCols.includes('unit')) sqlite.exec("ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT '件'");
  if (!productCols.includes('sort_order')) sqlite.exec('ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 999');
}

function readJSONSeed() {
  const source = fs.existsSync(dbFile) ? dbFile : oldDbFile;
  if (fs.existsSync(source)) return JSON.parse(fs.readFileSync(source, 'utf8'));
  return defaultData();
}

function dbRowCount(table) {
  return sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function loadDBFromSQLite() {
  return normalizeData({
    nextProductId: Number(sqlite.prepare("SELECT value FROM meta WHERE key='nextProductId'").get()?.value || 0),
    nextCategoryId: Number(sqlite.prepare("SELECT value FROM meta WHERE key='nextCategoryId'").get()?.value || 0),
    nextOrderId: Number(sqlite.prepare("SELECT value FROM meta WHERE key='nextOrderId'").get()?.value || 0),
    categories: sqlite.prepare('SELECT * FROM categories ORDER BY sort_order ASC, id ASC').all(),
    products: sqlite.prepare('SELECT * FROM products ORDER BY sort_order ASC, id DESC').all(),
    orders: sqlite.prepare('SELECT * FROM orders ORDER BY id DESC').all(),
    order_items: sqlite.prepare('SELECT * FROM order_items ORDER BY id ASC').all(),
    admins: sqlite.prepare('SELECT * FROM admins ORDER BY id ASC').all()
  });
}

function saveDB(data) {
  data = normalizeData(data);
  const tx = sqlite.transaction((d) => {
    sqlite.prepare('DELETE FROM meta').run();
    sqlite.prepare('DELETE FROM categories').run();
    sqlite.prepare('DELETE FROM products').run();
    sqlite.prepare('DELETE FROM orders').run();
    sqlite.prepare('DELETE FROM order_items').run();
    sqlite.prepare('DELETE FROM admins').run();
    const meta = sqlite.prepare('INSERT INTO meta(key,value) VALUES(?,?)');
    meta.run('nextProductId', String(d.nextProductId));
    meta.run('nextCategoryId', String(d.nextCategoryId));
    meta.run('nextOrderId', String(d.nextOrderId));
    const cat = sqlite.prepare('INSERT INTO categories(id,name,sort_order) VALUES(@id,@name,@sort_order)');
    const prod = sqlite.prepare(`INSERT INTO products(id,name,price,stock,unit,description,image,category_id,sort_order,is_active,created_at)
      VALUES(@id,@name,@price,@stock,@unit,@description,@image,@category_id,@sort_order,@is_active,@created_at)`);
    const ord = sqlite.prepare(`INSERT INTO orders(id,customer_name,phone,address,note,total,status,created_at)
      VALUES(@id,@customer_name,@phone,@address,@note,@total,@status,@created_at)`);
    const item = sqlite.prepare(`INSERT INTO order_items(id,order_id,product_id,product_name,price,quantity,subtotal)
      VALUES(@id,@order_id,@product_id,@product_name,@price,@quantity,@subtotal)`);
    const admin = sqlite.prepare('INSERT INTO admins(id,username,password_hash) VALUES(@id,@username,@password_hash)');
    d.categories.forEach(x => cat.run(x));
    d.products.forEach(x => prod.run(x));
    d.orders.forEach(x => ord.run(x));
    d.order_items.forEach(x => item.run(x));
    d.admins.forEach(x => admin.run(x));
  });
  tx(data);
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8'); // 保留 JSON 相容備份
}

function loadDB() {
  initSQLite();
  if (dbRowCount('products') === 0 && dbRowCount('orders') === 0) {
    const seed = normalizeData(readJSONSeed());
    saveDB(seed);
    return seed;
  }
  const data = loadDBFromSQLite();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

let db = loadDB();

function makeSvg(name, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="100%" height="100%" rx="32" fill="${color}"/>
    <circle cx="670" cy="90" r="70" fill="#ffffff" opacity=".28"/>
    <rect x="90" y="120" width="620" height="320" rx="28" fill="#fff" opacity=".92"/>
    <text x="400" y="280" text-anchor="middle" font-family="Arial,'Microsoft JhengHei'" font-size="54" font-weight="700" fill="#b91c1c">${name}</text>
    <text x="400" y="350" text-anchor="middle" font-family="Arial,'Microsoft JhengHei'" font-size="28" fill="#555">888台灣商店</text>
  </svg>`;
}
['黑松沙士','維力炸醬麵','台灣米酒','香菸展示品','冷凍蔥抓餅','金蘭醬油','義美小泡芙','拜拜金紙組'].forEach((n, i) => {
  const file = path.join(uploadDir, `sample-${i+1}.svg`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, makeSvg(n, ['#fee2e2','#ffedd5','#fef3c7','#e5e7eb','#dbeafe','#dcfce7','#fce7f3','#f3e8ff'][i]), 'utf8');
});
if (fs.existsSync(bundledUploadDir)) {
  fs.readdirSync(bundledUploadDir).forEach(name => {
    const from = path.join(bundledUploadDir, name);
    const to = path.join(uploadDir, name);
    if (fs.statSync(from).isFile() && !fs.existsSync(to)) fs.copyFileSync(from, to);
  });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-99-shop',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + (path.extname(file.originalname || '') || '.jpg'))
});
const upload = multer({ storage });

function getCart(req) { if (!req.session.cart) req.session.cart = []; return req.session.cart; }
function cartCount(req){ return getCart(req).reduce((a,b)=>a+b.quantity,0); }
function requireAdmin(req, res, next) { if (req.session.admin) return next(); res.redirect('/admin/login'); }
function categories() { return [...db.categories].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0) || a.id-b.id); }
function productWithCategory(p) {
  const c = db.categories.find(x => x.id === Number(p.category_id));
  return { ...p, category_name: c ? c.name : '未分類' };
}
function now(){ return new Date().toLocaleString('zh-TW', { hour12:false }); }
function parsePrice(value){
  const price = Number.parseFloat(String(value ?? '0').replace(',', '.'));
  if (!Number.isFinite(price) || price < 0) return 0;
  return Math.round(price * 100) / 100;
}
function money(value){
  const n = Number(value || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
function calcTotal(items){
  return Math.round(items.reduce((sum, item) => sum + parsePrice(item.price) * Number(item.quantity || 0), 0) * 100) / 100;
}
function calcSubtotal(item){
  return Math.round(parsePrice(item.price) * Number(item.quantity || 0) * 100) / 100;
}
app.locals.formatPrice = money;

app.get('/', (req, res) => {
  const cat = req.query.cat ? Number(req.query.cat) : null;
  let products = db.products.filter(p => p.is_active);
  if (cat) products = products.filter(p => Number(p.category_id) === cat);
  products = products.sort((a,b)=>(a.sort_order||999)-(b.sort_order||999) || b.id-a.id).map(productWithCategory);
  const orderedCategories = categories();
  const productsByCategory = orderedCategories.map(category => ({
    category,
    products: products.filter(product => Number(product.category_id) === category.id)
  })).filter(group => group.products.length > 0);
  res.render('home', { categories: orderedCategories, products, productsByCategory, currentCat: cat, cartCount: cartCount(req) });
});

app.get('/product/:id', (req, res) => {
  const p = db.products.find(x => x.id === Number(req.params.id) && x.is_active);
  if (!p) return res.status(404).send('商品不存在或已下架');
  res.render('product', { product: productWithCategory(p), cartCount: cartCount(req) });
});

app.post('/cart/add', (req, res) => {
  const productId = Number(req.body.product_id);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  const product = db.products.find(p => p.id === productId && p.is_active);
  if (!product) return res.redirect('/');
  const cart = getCart(req);
  const item = cart.find(i => i.product_id === productId);
  const currentQty = item ? Number(item.quantity || 0) : 0;
  if (currentQty + quantity > Number(product.stock || 0)) return res.redirect('/cart?error=stock');
  if (item) item.quantity += quantity;
  else cart.push({ product_id: product.id, name: product.name, price: product.price, image: product.image, unit: product.unit || '件', quantity });
  res.redirect('/cart');
});

app.get('/cart', (req, res) => {
  const cart = getCart(req);
  const total = calcTotal(cart);
  res.render('cart', { cart, total, cartCount: cartCount(req), error: req.query.error || null });
});

app.post('/cart/update', (req, res) => {
  const cart = getCart(req);
  const ids = Array.isArray(req.body.product_id) ? req.body.product_id : [req.body.product_id];
  const qtys = Array.isArray(req.body.quantity) ? req.body.quantity : [req.body.quantity];
  req.session.cart = cart.map(item => {
    const idx = ids.findIndex(id => Number(id) === item.product_id);
    if (idx >= 0) {
      const p = db.products.find(x => x.id === item.product_id);
      const want = Math.max(1, Number(qtys[idx] || 1));
      item.quantity = p ? Math.min(want, Math.max(0, Number(p.stock || 0))) : want;
    }
    return item;
  });
  res.redirect('/cart');
});

app.post('/cart/remove', (req, res) => {
  req.session.cart = getCart(req).filter(i => i.product_id !== Number(req.body.product_id));
  res.redirect('/cart');
});

app.get('/checkout', (req, res) => {
  const cart = getCart(req);
  if (!cart.length) return res.redirect('/cart');
  const total = calcTotal(cart);
  res.render('checkout', { cart, total, cartCount: cartCount(req), error: req.query.error || null });
});

app.post('/checkout', (req, res) => {
  const cart = getCart(req);
  if (!cart.length) return res.redirect('/cart');
  const insufficient = cart.find(item => {
    const p = db.products.find(x => x.id === item.product_id && x.is_active);
    return !p || Number(item.quantity || 0) > Number(p.stock || 0);
  });
  if (insufficient) return res.redirect('/checkout?error=stock');
  const total = calcTotal(cart);
  const orderId = db.nextOrderId++;
  const order = { id: orderId, customer_name:req.body.customer_name, phone:req.body.phone, address:req.body.address, note:req.body.note||'', total, status:'新訂單', created_at: now() };
  db.orders.push(order);
  cart.forEach(item => {
    db.order_items.push({ id: db.order_items.length+1, order_id: orderId, product_id:item.product_id, product_name:item.name, price:parsePrice(item.price), quantity:item.quantity, subtotal:calcSubtotal(item) });
    const p = db.products.find(x => x.id === item.product_id);
    if (p) p.stock = Math.max((p.stock || 0) - item.quantity, 0);
  });
  saveDB(db);
  req.session.cart = [];
  res.render('order-success', { orderId, cartCount: 0 });
});

app.get('/admin/login', (req, res) => res.render('admin-login', { error: null }));
app.post('/admin/login', (req, res) => {
  const admin = db.admins.find(a => a.username === req.body.username);
  if (!admin || !bcrypt.compareSync(req.body.password, admin.password_hash)) return res.render('admin-login', { error: '帳號或密碼錯誤' });
  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect('/admin');
});
app.get('/admin/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

app.get('/admin', requireAdmin, (req, res) => {
  const productTotal = db.products.length;
  const orderTotal = db.orders.length;
  const newOrders = db.orders.filter(o=>o.status==='新訂單').length;
  const recentOrders = [...db.orders].sort((a,b)=>b.id-a.id).slice(0,8);
  res.render('admin-dashboard', { admin: req.session.admin, productTotal, orderTotal, newOrders, recentOrders });
});

app.get('/admin/products', requireAdmin, (req, res) => {
  const products = [...db.products].sort((a,b)=>(a.sort_order||999)-(b.sort_order||999) || b.id-a.id).map(productWithCategory);
  res.render('admin-products', { products });
});
app.get('/admin/products/new', requireAdmin, (req, res) => res.render('admin-product-form', { product: null, categories: categories() }));
app.post('/admin/products/new', requireAdmin, upload.single('image'), (req, res) => {
  const image = req.file ? '/uploads/' + req.file.filename : '';
  const nextSort = Math.max(0, ...db.products.map(p => Number(p.sort_order || 0))) + 1;
  db.products.push({ id: db.nextProductId++, name:req.body.name, price:parsePrice(req.body.price), stock:Math.max(0, Number(req.body.stock || 0)), unit:req.body.unit || '件', description:req.body.description||'', image, category_id:Number(req.body.category_id), sort_order:nextSort, is_active:req.body.is_active?1:0, created_at: now() });
  saveDB(db);
  res.redirect('/admin/products');
});
app.get('/admin/products/:id/edit', requireAdmin, (req, res) => {
  const product = db.products.find(p=>p.id===Number(req.params.id));
  if (!product) return res.redirect('/admin/products');
  res.render('admin-product-form', { product, categories: categories() });
});
app.post('/admin/products/:id/edit', requireAdmin, upload.single('image'), (req, res) => {
  const p = db.products.find(x=>x.id===Number(req.params.id));
  if (!p) return res.redirect('/admin/products');
  p.name=req.body.name; p.price=parsePrice(req.body.price); p.stock=Math.max(0, Number(req.body.stock || 0)); p.unit=req.body.unit || '件'; p.description=req.body.description||''; p.category_id=Number(req.body.category_id); p.is_active=req.body.is_active?1:0;
  if (req.file) p.image = '/uploads/' + req.file.filename;
  saveDB(db);
  res.redirect('/admin/products');
});
app.post('/admin/products/:id/delete', requireAdmin, (req,res)=>{ db.products = db.products.filter(p=>p.id!==Number(req.params.id)); saveDB(db); res.redirect('/admin/products'); });

app.post('/admin/products/sort', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];
  ids.forEach((id, index) => {
    const p = db.products.find(x => x.id === id);
    if (p) p.sort_order = index + 1;
  });
  saveDB(db);
  res.json({ ok: true });
});

app.get('/admin/categories', requireAdmin, (req,res)=>res.render('admin-categories', { categories: categories() }));
app.post('/admin/categories/new', requireAdmin, (req,res)=>{ db.categories.push({id:db.nextCategoryId++, name:req.body.name, sort_order:Number(req.body.sort_order||99)}); saveDB(db); res.redirect('/admin/categories'); });
app.post('/admin/categories/:id/edit', requireAdmin, (req,res)=>{ const c=db.categories.find(x=>x.id===Number(req.params.id)); if(c){c.name=req.body.name;c.sort_order=Number(req.body.sort_order||99);saveDB(db)} res.redirect('/admin/categories'); });
app.post('/admin/categories/:id/delete', requireAdmin, (req,res)=>{ db.categories=db.categories.filter(c=>c.id!==Number(req.params.id)); saveDB(db); res.redirect('/admin/categories'); });

app.get('/admin/orders', requireAdmin, (req,res)=>res.render('admin-orders', { orders:[...db.orders].sort((a,b)=>b.id-a.id) }));
app.get('/admin/orders/:id', requireAdmin, (req,res)=>{
  const order = db.orders.find(o=>o.id===Number(req.params.id));
  if(!order) return res.redirect('/admin/orders');
  const items = db.order_items.filter(i=>i.order_id===order.id);
  res.render('admin-order-detail', { order, items });
});
app.post('/admin/orders/:id/status', requireAdmin, (req,res)=>{
  const order = db.orders.find(o=>o.id===Number(req.params.id));
  if(order){ order.status=req.body.status; saveDB(db); }
  res.redirect('/admin/orders/' + req.params.id);
});

app.listen(PORT, () => {
  console.log('');
  console.log('====================================');
  console.log('888台灣商店已啟動');
  console.log('前台：http://localhost:' + PORT);
  console.log('後台：http://localhost:' + PORT + '/admin');
  console.log('帳號：My999');
  console.log('密碼：Mas999');
  console.log('SQLite：' + sqliteFile);
  console.log('Uploads：' + uploadDir);
  console.log('====================================');
  console.log('');
});
