const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const router = express.Router();

// データベース接続
const dbPath = path.join(__dirname, '../../database/app.db');
const db = new sqlite3.Database(dbPath);

// 画像アップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'trip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

// 旅行プラン一覧取得
router.get('/', (req, res) => {
  const query = `
    SELECT t.*, 
           COUNT(DISTINCT td.id) as day_count,
           COUNT(DISTINCT ts.id) as spot_count,
           COALESCE(SUM(te.amount), 0) as total_expense
    FROM trips t
    LEFT JOIN trip_days td ON t.id = td.trip_id
    LEFT JOIN trip_spots ts ON t.id = ts.trip_id
    LEFT JOIN trip_expenses te ON t.id = te.trip_id
    WHERE t.user_id = ?
    GROUP BY t.id
    ORDER BY t.created_at DESC
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

// 旅行プラン詳細取得
router.get('/:id', (req, res) => {
  const tripId = req.params.id;
  
  const tripQuery = 'SELECT * FROM trips WHERE id = ? AND user_id = ?';
  
  db.get(tripQuery, [tripId, req.user.userId], (err, trip) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'データベースエラーが発生しました' });
    }
    
    if (!trip) {
      return res.status(404).json({ error: '旅行プランが見つかりません' });
    }
    
    // 日程データ取得
    const daysQuery = 'SELECT * FROM trip_days WHERE trip_id = ? ORDER BY date';
    db.all(daysQuery, [tripId], (err, days) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'データベースエラーが発生しました' });
      }
      
      // スポットデータ取得
      const spotsQuery = `
        SELECT * FROM trip_spots 
        WHERE trip_id = ? 
        ORDER BY trip_day_id, order_index, visit_time
      `;
      db.all(spotsQuery, [tripId], (err, spots) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'データベースエラーが発生しました' });
        }
        
        res.json({
          trip,
          days,
          spots
        });
      });
    });
  });
});

// 旅行プラン作成
router.post('/', upload.single('cover_image'), (req, res) => {
  const { title, destination, start_date, end_date, description, budget } = req.body;
  const coverImage = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!title || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }
  
  const query = `
    INSERT INTO trips (user_id, title, destination, start_date, end_date, description, budget, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    req.user.userId, title, destination, start_date, end_date, 
    description || '', parseFloat(budget) || 0, coverImage
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '旅行プランの作成に失敗しました' });
    } else {
      // 日程を自動生成
      const tripId = this.lastID;
      generateTripDays(tripId, start_date, end_date, (err) => {
        if (err) {
          console.error('Days generation error:', err);
        }
        res.status(201).json({ 
          id: tripId, 
          message: '旅行プランが作成されました',
          coverImage: coverImage 
        });
      });
    }
  });
});

// 日程自動生成関数
function generateTripDays(tripId, startDate, endDate, callback) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayNum = Math.floor((d - start) / (1000 * 60 * 60 * 24)) + 1;
    days.push([tripId, dateStr, `${dayNum}日目`]);
  }
  
  const query = 'INSERT INTO trip_days (trip_id, date, title) VALUES (?, ?, ?)';
  let completed = 0;
  
  days.forEach(day => {
    db.run(query, day, (err) => {
      completed++;
      if (completed === days.length) {
        callback(err);
      }
    });
  });
}

// 旅行プラン更新
router.put('/:id', upload.single('cover_image'), (req, res) => {
  const tripId = req.params.id;
  const { title, destination, start_date, end_date, description, budget, status } = req.body;
  const coverImage = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  let query = `
    UPDATE trips 
    SET title = ?, destination = ?, start_date = ?, end_date = ?, 
        description = ?, budget = ?, status = ?, updated_at = CURRENT_TIMESTAMP
  `;
  let params = [title, destination, start_date, end_date, description, budget, status];
  
  if (coverImage) {
    query += ', cover_image = ?';
    params.push(coverImage);
  }
  
  query += ' WHERE id = ? AND user_id = ?';
  params.push(tripId, req.user.userId);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '旅行プランの更新に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '旅行プランが見つかりません' });
    } else {
      res.json({ message: '旅行プランが更新されました' });
    }
  });
});

// 旅行プラン削除
router.delete('/:id', (req, res) => {
  const tripId = req.params.id;
  
  db.run('DELETE FROM trips WHERE id = ? AND user_id = ?', [tripId, req.user.userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '旅行プランの削除に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '旅行プランが見つかりません' });
    } else {
      res.json({ message: '旅行プランが削除されました' });
    }
  });
});

// 旅行プランの状態更新
router.patch('/:id/status', (req, res) => {
  const tripId = req.params.id;
  const { status } = req.body;
  
  if (!['planning', 'ongoing', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: '無効なステータスです' });
  }
  
  db.run(
    'UPDATE trips SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [status, tripId, req.user.userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'ステータスの更新に失敗しました' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: '旅行プランが見つかりません' });
      } else {
        res.json({ message: 'ステータスが更新されました' });
      }
    }
  );
});

module.exports = router;
