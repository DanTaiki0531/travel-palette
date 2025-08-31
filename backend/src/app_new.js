const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// 認証ルートとミドルウェアをインポート
const { router: authRouter, authenticateToken } = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

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

const db = new sqlite3.Database(dbPath);

// データベーステーブル作成
db.serialize(() => {
  // スポットテーブル
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

  // 行程テーブル
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
