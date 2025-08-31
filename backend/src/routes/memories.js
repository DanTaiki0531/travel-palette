const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const router = express.Router();

// データベース接続
const dbPath = path.join(__dirname, '../../database/app.db');
const db = new sqlite3.Database(dbPath);

// 思い出画像アップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'memory-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for memories
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('video/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('画像または動画ファイルのみアップロード可能です'));
    }
  }
});

// 旅行の思い出一覧取得
router.get('/trip/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT tm.*, ts.name as spot_name, ts.category as spot_category
    FROM trip_memories tm
    LEFT JOIN trip_spots ts ON tm.trip_spot_id = ts.id
    WHERE tm.trip_id = ? AND tm.user_id = ?
    ORDER BY tm.date DESC, tm.created_at DESC
  `;
  
  db.all(query, [tripId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// 思い出詳細取得
router.get('/:id', (req, res) => {
  const memoryId = req.params.id;
  
  const query = `
    SELECT tm.*, ts.name as spot_name, t.title as trip_title
    FROM trip_memories tm
    LEFT JOIN trip_spots ts ON tm.trip_spot_id = ts.id
    LEFT JOIN trips t ON tm.trip_id = t.id
    WHERE tm.id = ? AND tm.user_id = ?
  `;
  
  db.get(query, [memoryId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else if (!row) {
      res.status(404).json({ error: '思い出が見つかりません' });
    } else {
      res.json(row);
    }
  });
});

// 思い出追加
router.post('/', upload.single('media'), (req, res) => {
  const { 
    trip_id, trip_spot_id, title, content, emotion, weather, date 
  } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!trip_id || !title || !date) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }
  
  const query = `
    INSERT INTO trip_memories (
      trip_id, trip_spot_id, user_id, title, content, image_url,
      emotion, weather, date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    trip_id, trip_spot_id || null, req.user.userId, title, content,
    imageUrl, emotion, weather, date
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '思い出の追加に失敗しました' });
    } else {
      res.status(201).json({ 
        id: this.lastID, 
        message: '思い出が追加されました',
        imageUrl: imageUrl 
      });
    }
  });
});

// 思い出更新
router.put('/:id', upload.single('media'), (req, res) => {
  const memoryId = req.params.id;
  const { 
    trip_spot_id, title, content, emotion, weather, date 
  } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  let query = `
    UPDATE trip_memories 
    SET trip_spot_id = ?, title = ?, content = ?, emotion = ?, weather = ?, date = ?
  `;
  let params = [trip_spot_id || null, title, content, emotion, weather, date];
  
  if (imageUrl) {
    query += ', image_url = ?';
    params.push(imageUrl);
  }
  
  query += ' WHERE id = ? AND user_id = ?';
  params.push(memoryId, req.user.userId);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '思い出の更新に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '思い出が見つかりません' });
    } else {
      res.json({ message: '思い出が更新されました' });
    }
  });
});

// 思い出削除
router.delete('/:id', (req, res) => {
  const memoryId = req.params.id;
  
  db.run('DELETE FROM trip_memories WHERE id = ? AND user_id = ?', [memoryId, req.user.userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '思い出の削除に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '思い出が見つかりません' });
    } else {
      res.json({ message: '思い出が削除されました' });
    }
  });
});

// 日別思い出取得
router.get('/trip/:tripId/daily', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      date,
      COUNT(*) as memory_count,
      GROUP_CONCAT(title, '|') as titles,
      GROUP_CONCAT(emotion, '|') as emotions
    FROM trip_memories 
    WHERE trip_id = ? AND user_id = ?
    GROUP BY date
    ORDER BY date
  `;
  
  db.all(query, [tripId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      // タイトルと感情を配列に変換
      const result = rows.map(row => ({
        ...row,
        titles: row.titles ? row.titles.split('|') : [],
        emotions: row.emotions ? row.emotions.split('|').filter(e => e) : []
      }));
      res.json(result);
    }
  });
});

// 感情別統計取得
router.get('/trip/:tripId/emotions', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      emotion,
      COUNT(*) as count
    FROM trip_memories 
    WHERE trip_id = ? AND user_id = ? AND emotion IS NOT NULL AND emotion != ''
    GROUP BY emotion
    ORDER BY count DESC
  `;
  
  db.all(query, [tripId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// 天気統計取得
router.get('/trip/:tripId/weather', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      weather,
      COUNT(*) as count,
      date
    FROM trip_memories 
    WHERE trip_id = ? AND user_id = ? AND weather IS NOT NULL AND weather != ''
    GROUP BY weather, date
    ORDER BY date
  `;
  
  db.all(query, [tripId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// スポット別思い出取得
router.get('/spot/:spotId', (req, res) => {
  const spotId = req.params.spotId;
  
  const query = `
    SELECT tm.*
    FROM trip_memories tm
    WHERE tm.trip_spot_id = ? AND tm.user_id = ?
    ORDER BY tm.created_at DESC
  `;
  
  db.all(query, [spotId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

// 旅行の思い出統計
router.get('/trip/:tripId/stats', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      COUNT(*) as total_memories,
      COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as memories_with_media,
      COUNT(DISTINCT date) as active_days,
      COUNT(DISTINCT trip_spot_id) as spots_with_memories
    FROM trip_memories 
    WHERE trip_id = ? AND user_id = ?
  `;
  
  db.get(query, [tripId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(row || {
        total_memories: 0,
        memories_with_media: 0,
        active_days: 0,
        spots_with_memories: 0
      });
    }
  });
});

module.exports = router;
