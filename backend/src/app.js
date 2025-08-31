const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// 認証ルートとミドルウェアをインポート
const { router: authRouter, authenticateToken } = require('./routes/auth');

// 旅のしおりルートをインポート
const tripsRouter = require('./routes/trips');
const tripSpotsRouter = require('./routes/trip-spots');
const expensesRouter = require('./routes/expenses');
const memoriesRouter = require('./routes/memories');

const app = express();
const PORT = process.env.PORT || 3002;

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer設定（ファイルアップロード用）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB制限
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('画像ファイルのみアップロード可能です'));
    }
  }
});

// データベース設定
const dbDir = path.join(__dirname, '../database');
const dbPath = path.join(dbDir, 'app.db');

// データベースディレクトリが存在しない場合は作成
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Database path:', dbPath);
console.log('Database directory exists:', fs.existsSync(dbDir));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// データベーステーブル作成
db.serialize(() => {
  // ユーザーテーブル（認証で既に作成済み）
  
  // 旅行プランテーブル
  db.run(`CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    description TEXT,
    budget REAL DEFAULT 0,
    status TEXT DEFAULT 'planning',
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 旅行日程テーブル
  db.run(`CREATE TABLE IF NOT EXISTS trip_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    title TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
  )`);

  // 旅行スポットテーブル（既存のspotsテーブルを拡張）
  db.run(`CREATE TABLE IF NOT EXISTS trip_spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER,
    trip_day_id INTEGER,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    lat REAL,
    lng REAL,
    address TEXT,
    description TEXT,
    image_url TEXT,
    visit_time TEXT,
    duration INTEGER DEFAULT 60,
    cost REAL DEFAULT 0,
    notes TEXT,
    rating INTEGER DEFAULT 0,
    visited BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
    FOREIGN KEY (trip_day_id) REFERENCES trip_days (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 費用記録テーブル
  db.run(`CREATE TABLE IF NOT EXISTS trip_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    trip_spot_id INTEGER,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'JPY',
    date TEXT NOT NULL,
    payment_method TEXT,
    receipt_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
    FOREIGN KEY (trip_spot_id) REFERENCES trip_spots (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 思い出記録テーブル
  db.run(`CREATE TABLE IF NOT EXISTS trip_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    trip_spot_id INTEGER,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    emotion TEXT,
    weather TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
    FOREIGN KEY (trip_spot_id) REFERENCES trip_spots (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // スポットテーブル（既存）
  db.run(`CREATE TABLE IF NOT EXISTS spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT,
    description TEXT,
    image_url TEXT,
    reaction TEXT DEFAULT 'like',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 行程テーブル（既存）
  db.run(`CREATE TABLE IF NOT EXISTS itinerary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    spot_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (spot_id) REFERENCES spots (id)
  )`);
});

// 認証ルート
app.use('/api/auth', authRouter);

// 旅のしおりルート（認証が必要）
app.use('/api/trips', authenticateToken, tripsRouter);
app.use('/api/trip-spots', authenticateToken, tripSpotsRouter);
app.use('/api/expenses', authenticateToken, expensesRouter);
app.use('/api/memories', authenticateToken, memoriesRouter);

// API ルート（以下は認証が必要）

// スポット一覧取得
app.get('/api/spots', authenticateToken, (req, res) => {
  db.all('SELECT * FROM spots WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// スポット追加
app.post('/api/spots', authenticateToken, upload.single('image'), (req, res) => {
  const { name, category, lat, lng, address, description, reaction } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !category || !lat || !lng) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }

  const query = `INSERT INTO spots (user_id, name, category, lat, lng, address, description, image_url, reaction) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [req.user.userId, name, category, parseFloat(lat), parseFloat(lng), address, description, imageUrl, reaction || 'like'], 
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'スポットの追加に失敗しました' });
      } else {
        res.status(201).json({ 
          id: this.lastID, 
          message: 'スポットが追加されました',
          imageUrl: imageUrl 
        });
      }
    }
  );
});

// スポット削除
app.delete('/api/spots/:id', authenticateToken, (req, res) => {
  const spotId = req.params.id;
  
  db.run('DELETE FROM spots WHERE id = ? AND user_id = ?', [spotId, req.user.userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'スポットの削除に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'スポットが見つかりません' });
    } else {
      res.json({ message: 'スポットが削除されました' });
    }
  });
});

// 行程一覧取得
app.get('/api/itinerary', authenticateToken, (req, res) => {
  const query = `
    SELECT i.*, s.name as spot_name, s.category, s.lat, s.lng 
    FROM itinerary_items i 
    LEFT JOIN spots s ON i.spot_id = s.id 
    WHERE i.user_id = ?
    ORDER BY i.date, i.time
  `;
  
  db.all(query, [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// 行程アイテム追加
app.post('/api/itinerary', authenticateToken, (req, res) => {
  const { spotId, date, time, title, description } = req.body;

  if (!date || !time || !title) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }

  const query = `INSERT INTO itinerary_items (user_id, spot_id, date, time, title, description) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [req.user.userId, spotId || null, date, time, title, description], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '行程の追加に失敗しました' });
    } else {
      res.status(201).json({ 
        id: this.lastID, 
        message: '行程が追加されました' 
      });
    }
  });
});

// 行程完了状態更新
app.patch('/api/itinerary/:id/complete', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  const { completed } = req.body;

  db.run('UPDATE itinerary_items SET completed = ? WHERE id = ? AND user_id = ?', 
    [completed ? 1 : 0, itemId, req.user.userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: '更新に失敗しました' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: '行程が見つかりません' });
      } else {
        res.json({ message: '完了状態が更新されました' });
      }
    }
  );
});

// 行程削除
app.delete('/api/itinerary/:id', authenticateToken, (req, res) => {
  const itemId = req.params.id;
  
  db.run('DELETE FROM itinerary_items WHERE id = ? AND user_id = ?', [itemId, req.user.userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '行程の削除に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '行程が見つかりません' });
    } else {
      res.json({ message: '行程が削除されました' });
    }
  });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// エラーハンドリング
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'ファイルサイズが大きすぎます（最大5MB）' });
    }
  }
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}).on('error', (err) => {
  console.error('Server start error:', err);
  process.exit(1);
});
