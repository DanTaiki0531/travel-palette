const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');

const router = express.Router();

// データベース接続
const dbPath = path.join(__dirname, '../../database/app.db');
const db = new sqlite3.Database(dbPath);

// レシート画像アップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('画像ファイルまたはPDFのみアップロード可能です'));
    }
  }
});

// 旅行の費用一覧取得
router.get('/trip/:tripId', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT te.*, ts.name as spot_name, ts.category as spot_category
    FROM trip_expenses te
    LEFT JOIN trip_spots ts ON te.trip_spot_id = ts.id
    WHERE te.trip_id = ? AND te.user_id = ?
    ORDER BY te.date DESC, te.created_at DESC
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

// 費用カテゴリ別集計取得
router.get('/trip/:tripId/summary', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      category,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount,
      currency
    FROM trip_expenses 
    WHERE trip_id = ? AND user_id = ?
    GROUP BY category, currency
    ORDER BY total_amount DESC
  `;
  
  db.all(query, [tripId, req.user.userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else {
      // 総額も計算
      const totalQuery = `
        SELECT SUM(amount) as grand_total, currency
        FROM trip_expenses 
        WHERE trip_id = ? AND user_id = ?
        GROUP BY currency
      `;
      
      db.all(totalQuery, [tripId, req.user.userId], (err, totals) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'データベースエラーが発生しました' });
        } else {
          res.json({
            by_category: rows,
            totals: totals
          });
        }
      });
    }
  });
});

// 費用記録詳細取得
router.get('/:id', (req, res) => {
  const expenseId = req.params.id;
  
  const query = `
    SELECT te.*, ts.name as spot_name, t.title as trip_title
    FROM trip_expenses te
    LEFT JOIN trip_spots ts ON te.trip_spot_id = ts.id
    LEFT JOIN trips t ON te.trip_id = t.id
    WHERE te.id = ? AND te.user_id = ?
  `;
  
  db.get(query, [expenseId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'データベースエラーが発生しました' });
    } else if (!row) {
      res.status(404).json({ error: '費用記録が見つかりません' });
    } else {
      res.json(row);
    }
  });
});

// 費用記録追加
router.post('/', upload.single('receipt'), (req, res) => {
  const { 
    trip_id, trip_spot_id, category, description, amount, 
    currency, date, payment_method 
  } = req.body;
  const receiptImage = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (!trip_id || !category || !description || !amount || !date) {
    return res.status(400).json({ error: '必須フィールドが不足しています' });
  }
  
  const query = `
    INSERT INTO trip_expenses (
      trip_id, trip_spot_id, user_id, category, description, amount,
      currency, date, payment_method, receipt_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    trip_id, trip_spot_id || null, req.user.userId, category, description,
    parseFloat(amount), currency || 'JPY', date, payment_method, receiptImage
  ], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '費用記録の追加に失敗しました' });
    } else {
      res.status(201).json({ 
        id: this.lastID, 
        message: '費用記録が追加されました',
        receiptImage: receiptImage 
      });
    }
  });
});

// 費用記録更新
router.put('/:id', upload.single('receipt'), (req, res) => {
  const expenseId = req.params.id;
  const { 
    trip_spot_id, category, description, amount, 
    currency, date, payment_method 
  } = req.body;
  const receiptImage = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  let query = `
    UPDATE trip_expenses 
    SET trip_spot_id = ?, category = ?, description = ?, amount = ?,
        currency = ?, date = ?, payment_method = ?
  `;
  let params = [
    trip_spot_id || null, category, description, parseFloat(amount),
    currency || 'JPY', date, payment_method
  ];
  
  if (receiptImage) {
    query += ', receipt_image = ?';
    params.push(receiptImage);
  }
  
  query += ' WHERE id = ? AND user_id = ?';
  params.push(expenseId, req.user.userId);
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '費用記録の更新に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '費用記録が見つかりません' });
    } else {
      res.json({ message: '費用記録が更新されました' });
    }
  });
});

// 費用記録削除
router.delete('/:id', (req, res) => {
  const expenseId = req.params.id;
  
  db.run('DELETE FROM trip_expenses WHERE id = ? AND user_id = ?', [expenseId, req.user.userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: '費用記録の削除に失敗しました' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: '費用記録が見つかりません' });
    } else {
      res.json({ message: '費用記録が削除されました' });
    }
  });
});

// 日別費用取得
router.get('/trip/:tripId/daily', (req, res) => {
  const tripId = req.params.tripId;
  
  const query = `
    SELECT 
      date,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      currency
    FROM trip_expenses 
    WHERE trip_id = ? AND user_id = ?
    GROUP BY date, currency
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

// 予算との比較取得
router.get('/trip/:tripId/budget-comparison', (req, res) => {
  const tripId = req.params.tripId;
  
  // 旅行プランの予算を取得
  const budgetQuery = 'SELECT budget FROM trips WHERE id = ? AND user_id = ?';
  
  db.get(budgetQuery, [tripId, req.user.userId], (err, trip) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'データベースエラーが発生しました' });
    }
    
    if (!trip) {
      return res.status(404).json({ error: '旅行プランが見つかりません' });
    }
    
    // 実際の支出を取得
    const expenseQuery = `
      SELECT SUM(amount) as total_spent, COUNT(*) as expense_count
      FROM trip_expenses 
      WHERE trip_id = ? AND user_id = ?
    `;
    
    db.get(expenseQuery, [tripId, req.user.userId], (err, expense) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'データベースエラーが発生しました' });
      }
      
      const budget = trip.budget || 0;
      const totalSpent = expense.total_spent || 0;
      const remaining = budget - totalSpent;
      const spentPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
      
      res.json({
        budget: budget,
        total_spent: totalSpent,
        remaining: remaining,
        spent_percentage: Math.round(spentPercentage * 100) / 100,
        expense_count: expense.expense_count || 0,
        over_budget: totalSpent > budget && budget > 0
      });
    });
  });
});

module.exports = router;
