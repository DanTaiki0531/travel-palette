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
    cb(null, 'spot-' + uniqueSuffix + path.extname(file.originalname));
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

// 旅行スポット一覧取得（特定の旅行プラン）
router.get('/trip/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT ts.*, td.title as day_title, td.date as day_date
    FROM trip_spots ts
    LEFT JOIN trip_days td ON ts.trip_day_id = td.id
    WHERE ts.trip_id = ? AND ts.user_id = ?
    ORDER BY td.date, ts.order_index, ts.visit_time
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

// 旅行スポット詳細取得
router.get('/:id', (req, res) => {
  const spotId = req.params.id;
  
  const query = `
    SELECT ts.*, td.title as day_title, td.date as day_date,
           t.title as trip_title
    FROM trip_spots ts
    LEFT JOIN trip_days td ON ts.trip_day_id = td.id
    LEFT JOIN trips t ON ts.trip_id = t.id
    WHERE ts.id = ? AND ts.user_id = ?
  `;
  
  db.get(query, [spotId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else if (!row) {
      res.status(404).json({ error: 'スポットが見つかりません' });
    } else {
      res.json(row);
    }
  });
});

// 旅行スポット追加
router.post('/', upload.single('image'), (req, res) => {
  const { 
    trip_id, trip_day_id, name, category, lat, lng, address, 
    description, visit_time, duration, cost, notes, rating 
  } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!trip_id || !name || !category) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }
  
  // order_indexを取得（同じ日の最後に追加）
  const orderQuery = trip_day_id ? 
    'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM trip_spots WHERE trip_day_id = ?' :
    'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM trip_spots WHERE trip_id = ? AND trip_day_id IS NULL';
  
  const orderParam = trip_day_id || trip_id;
  
  db.get(orderQuery, [orderParam], (err, orderResult) => {
    if (err) {
      console.error('Order query error:', err);
      return res.status(500).json({ error: 'データベースエラーが発生しました' });
    }
    
    const orderIndex = orderResult.next_order;
    
    const query = `
      INSERT INTO trip_spots (
        trip_id, trip_day_id, user_id, name, category, lat, lng, address,
        description, image_url, visit_time, duration, cost, notes, rating, order_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
      trip_id, trip_day_id || null, req.user.userId, name, category, 
      lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null, address,
      description, imageUrl, visit_time, parseInt(duration) || 60, 
      parseFloat(cost) || 0, notes, parseInt(rating) || 0, orderIndex
    ], function(err) {
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
    });
  });
});

// 旅行スポット更新
router.put('/:id', upload.single('image'), (req, res) => {
  const spotId = req.params.id;
  const { 
    trip_day_id, name, category, lat, lng, address, 
    description, visit_time, duration, cost, notes, rating 
  } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  let query = `
    UPDATE trip_spots 
    SET trip_day_id = ?, name = ?, category = ?, lat = ?, lng = ?, address = ?,
        description = ?, visit_time = ?, duration = ?, cost = ?, notes = ?, rating = ?
  `;
  let params = [
    trip_day_id || null, name, category, 
    lat ? parseFloat(lat) : null, lng ? parseFloat(lng) : null, address,
    description, visit_time, parseInt(duration) || 60, 
    parseFloat(cost) || 0, notes, parseInt(rating) || 0
  ];
  
  if (imageUrl) {
    query += ', image_url = ?';
    params.push(imageUrl);
  }
  
  query += ' WHERE id = ? AND user_id = ?';
  params.push(spotId, req.user.userId);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'スポットの更新に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'スポットが見つかりません' });
    } else {
      res.json({ message: 'スポットが更新されました' });
    }
  });
});

// 旅行スポット削除
router.delete('/:id', (req, res) => {
  const spotId = req.params.id;
  
  db.run('DELETE FROM trip_spots WHERE id = ? AND user_id = ?', [spotId, req.user.userId], function(err) {
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

// スポット訪問状態更新
router.patch('/:id/visited', (req, res) => {
  const spotId = req.params.id;
  const { visited } = req.body;
  
  db.run(
    'UPDATE trip_spots SET visited = ? WHERE id = ? AND user_id = ?',
    [visited ? 1 : 0, spotId, req.user.userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: '訪問状態の更新に失敗しました' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'スポットが見つかりません' });
      } else {
        res.json({ message: '訪問状態が更新されました' });
      }
    }
  );
});

// スポット順序更新
router.patch('/:id/order', (req, res) => {
  const spotId = req.params.id;
  const { order_index } = req.body;
  
  if (typeof order_index !== 'number') {
    return res.status(400).json({ error: '順序は数値で指定してください' });
  }
  
  db.run(
    'UPDATE trip_spots SET order_index = ? WHERE id = ? AND user_id = ?',
    [order_index, spotId, req.user.userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: '順序の更新に失敗しました' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'スポットが見つかりません' });
      } else {
        res.json({ message: '順序が更新されました' });
      }
    }
  );
});

// 日程内のスポット一覧取得
router.get('/day/:dayId', (req, res) => {
  const dayId = req.params.dayId;
  
  const query = `
    SELECT ts.*, td.date, td.title as day_title
    FROM trip_spots ts
    JOIN trip_days td ON ts.trip_day_id = td.id
    WHERE ts.trip_day_id = ? AND ts.user_id = ?
    ORDER BY ts.order_index, ts.visit_time
  `;
  
  db.all(query, [dayId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
