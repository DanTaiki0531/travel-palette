const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// データベース接続
const dbPath = path.join(__dirname, '../../database/app.db');
console.log('Auth DB path:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Auth database connection error:', err);
  } else {
    console.log('Auth connected to SQLite database');
  }
});

// JWTシークレットキー（実環境では環境変数を使用）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// レート制限設定
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の試行
  message: { error: 'ログイン試行回数が上限に達しました。15分後に再試行してください。' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ユーザーテーブル作成
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ユーザー登録
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 入力バリデーション
    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'ユーザー名は3文字以上20文字以下で入力してください' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上で入力してください' });
    }

    // ユーザー名の重複チェック
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }

      if (row) {
        return res.status(409).json({ error: 'このユーザー名は既に使用されています' });
      }

      try {
        // パスワードハッシュ化
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // ユーザー登録
        db.run(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, hashedPassword],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: 'ユーザー登録に失敗しました' });
            }

            // JWTトークン生成
            const token = jwt.sign(
              { userId: this.lastID, username: username },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              message: 'ユーザー登録が完了しました',
              token: token,
              user: {
                id: this.lastID,
                username: username
              }
            });
          }
        );
      } catch (hashError) {
        console.error('Hash error:', hashError);
        res.status(500).json({ error: 'パスワード処理中にエラーが発生しました' });
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// ユーザーログイン
router.post('/login', authLimiter, (req, res) => {
  try {
    const { username, password } = req.body;

    // 入力バリデーション
    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' });
    }

    // ユーザー検索
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'サーバーエラーが発生しました' });
      }

      if (!user) {
        return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません' });
      }

      try {
        // パスワード検証
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません' });
        }

        // JWTトークン生成
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'ログインしました',
          token: token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      } catch (compareError) {
        console.error('Password compare error:', compareError);
        res.status(500).json({ error: 'パスワード検証中にエラーが発生しました' });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// トークン検証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'アクセストークンが必要です' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'トークンが無効です' });
    }
    req.user = user;
    next();
  });
};

// プロフィール取得（認証が必要）
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });
  });
});

// ユーザー名の重複チェック
router.get('/check-username/:username', (req, res) => {
  const { username } = req.params;

  if (!username || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'ユーザー名は3文字以上20文字以下で入力してください' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }

    res.json({ available: !row });
  });
});

module.exports = { router, authenticateToken };
