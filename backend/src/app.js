const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// データベース初期化
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/travel-palette.db');
const db = new sqlite3.Database(dbPath);

// テーブル作成
db.serialize(() => {
  // 旅行プランテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 目的地テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL,
      longitude REAL,
      category TEXT CHECK(category IN ('restaurant', 'attraction', 'hotel', 'other')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    )
  `);

  // リアクションテーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination_id INTEGER,
      emoji TEXT NOT NULL,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (destination_id) REFERENCES destinations (id)
    )
  `);

  // 旅程テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS itinerary_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      day_number INTEGER,
      time TEXT,
      activity TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    )
  `);
});

// ルート設定

// 旅行プラン関連API
app.get('/api/trips', (req, res) => {
  db.all('SELECT * FROM trips ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/trips', (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  db.run(
    'INSERT INTO trips (title, description, start_date, end_date) VALUES (?, ?, ?, ?)',
    [title, description, start_date, end_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, title, description, start_date, end_date });
    }
  );
});

// 目的地関連API
app.get('/api/destinations', (req, res) => {
  const tripId = req.query.trip_id;
  let query = `
    SELECT d.*, 
           GROUP_CONCAT(r.emoji) as reactions
    FROM destinations d
    LEFT JOIN reactions r ON d.id = r.destination_id
  `;
  let params = [];
  
  if (tripId) {
    query += ' WHERE d.trip_id = ?';
    params.push(tripId);
  }
  
  query += ' GROUP BY d.id ORDER BY d.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // reactionsを配列に変換
    const destinations = rows.map(row => ({
      ...row,
      reactions: row.reactions ? row.reactions.split(',') : []
    }));
    
    res.json(destinations);
  });
});

app.post('/api/destinations', (req, res) => {
  const { trip_id, name, description, latitude, longitude, category } = req.body;
  db.run(
    'INSERT INTO destinations (trip_id, name, description, latitude, longitude, category) VALUES (?, ?, ?, ?, ?, ?)',
    [trip_id, name, description, latitude, longitude, category],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        trip_id, 
        name, 
        description, 
        latitude, 
        longitude, 
        category 
      });
    }
  );
});

// リアクション関連API
app.post('/api/reactions', (req, res) => {
  const { destination_id, emoji, user_name = 'Anonymous' } = req.body;
  db.run(
    'INSERT INTO reactions (destination_id, emoji, user_name) VALUES (?, ?, ?)',
    [destination_id, emoji, user_name],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, destination_id, emoji, user_name });
    }
  );
});

// 旅程関連API
app.get('/api/itinerary', (req, res) => {
  const tripId = req.query.trip_id;
  if (!tripId) {
    res.status(400).json({ error: 'trip_id is required' });
    return;
  }
  
  db.all(
    'SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY day_number, time',
    [tripId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post('/api/itinerary', (req, res) => {
  const { trip_id, day_number, time, activity, location, notes } = req.body;
  db.run(
    'INSERT INTO itinerary_items (trip_id, day_number, time, activity, location, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [trip_id, day_number, time, activity, location, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id: this.lastID, 
        trip_id, 
        day_number, 
        time, 
        activity, 
        location, 
        notes 
      });
    }
  );
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Travel Palette API is running!' });
});

// 静的ファイル配信（開発用）
app.get('/', (req, res) => {
  res.json({ 
    message: 'Travel Palette API Server',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/trips',
      'POST /api/trips',
      'GET /api/destinations',
      'POST /api/destinations',
      'POST /api/reactions',
      'GET /api/itinerary',
      'POST /api/itinerary'
    ]
  });
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌍 Travel Palette API Server is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
});

// プロセス終了時にDBを閉じる
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
