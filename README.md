# Travel Palette
**想い出も育てる、共有型デジタルしおりアプリ**

## 🌟 コンセプト

旅行の計画から、旅行中の思い出作り、旅行後の振り返りまでを一つのアプリで完結できる旅行管理アプリです。直感的なインターフェースで旅行計画を立て、支出管理と思い出の記録を簡単に行えます。

## ✨ 実装済み機能

### 1. � ユーザー認証システム
- ユーザー登録・ログイン機能
- JWTトークンベースの認証
- セキュアなセッション管理

### 2. 📋 旅行プランナー
- 旅行プラン一覧表示・作成
- 旅行期間・予算設定
- 旅行プラン詳細管理

### 3. 📍 スポット管理
- 日別スポット追加・管理
- カテゴリ別分類（🏛️観光地、🍽️レストラン、🏨宿泊施設、🎭エンターテイメント、🛍️ショッピング）
- 訪問状況トラッキング
- 時間・予算情報管理

### 4. 📖 旅のしおり生成
- 日別スケジュール表示
- タイムライン形式での旅程確認
- 持ち物チェックリスト
- PDF形式での出力準備

### 5. � 支出管理（開発中）
- 旅行支出の記録・管理
- カテゴリ別支出分析
- 予算との比較

### 6. 📸 思い出管理（開発中）
- 写真・メモの記録
- 日別思い出アルバム
- 旅行後の振り返り機能

## 🛠️ 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **バックエンド**: Node.js + Express
- **データベース**: SQLite3
- **認証**: JWT (JSON Web Token)
- **スタイリング**: CSS Modules
- **開発環境**: Docker & Docker Compose
- **コンテナポート**: Frontend (3002), Backend API (3002/api)

## 🚀 セットアップ方法

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること

### 1. リポジトリのクローン
```bash
git clone https://github.com/DanTaiki0531/travel-palette.git
cd travel-palette
```

### 2. Docker環境の起動
```bash
docker-compose up --build
```

### 3. アプリケーションへのアクセス
- アプリケーション: http://localhost:3002
- バックエンドAPI: http://localhost:3002/api

### 4. 開発環境での起動
```bash
# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド（別ターミナル）
cd backend
npm install
npm run dev
```

## 📁 プロジェクト構造

```
travel-palette/
├── frontend/                    # React + TypeScript フロントエンド
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   │   ├── Auth/          # 認証関連
│   │   │   ├── TripPlanner.jsx # 旅行プラン管理
│   │   │   ├── TripDetail.jsx  # 旅行詳細表示
│   │   │   ├── SpotManager.jsx # スポット管理
│   │   │   ├── Itinerary.jsx   # 旅程表示
│   │   │   ├── ExpenseManager.jsx # 支出管理（開発中）
│   │   │   └── MemoryManager.jsx  # 思い出管理（開発中）
│   │   ├── contexts/          # Reactコンテキスト
│   │   │   └── AuthContext.jsx
│   │   ├── App.tsx           # メインアプリケーション
│   │   └── index.css         # グローバルスタイル
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/                    # Node.js + Express バックエンド
│   ├── src/
│   │   ├── app.js            # Express サーバー
│   │   ├── routes/           # APIルート
│   │   └── middleware/       # 認証ミドルウェア
│   ├── package.json
│   └── Dockerfile
├── data/                      # SQLite データベース保存先
├── docker-compose.yml         # Docker設定
├── DEVELOPMENT_LOG.md         # 開発履歴
├── IMPLEMENTATION_STATUS.md   # 実装状況
├── QUICK_START_GUIDE.md      # 開発者向けガイド
└── README.md
```

## 🎨 デザインシステム

### カラーパレット
- **プライマリーブラウン**: #8B4513
- **ライトブラウン**: #D2B48C
- **ダークブラウン**: #654321
- **クリーム**: #F5F5DC
- **ウォームホワイト**: #FFF8F0
- **アクセントオレンジ**: #CD853F

## 📚 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### 旅行プラン
- `GET /api/trips` - 旅行プラン一覧取得
- `POST /api/trips` - 新しい旅行プラン作成
- `GET /api/trips/:id` - 旅行プラン詳細取得
- `PUT /api/trips/:id` - 旅行プラン更新
- `DELETE /api/trips/:id` - 旅行プラン削除

### スポット管理
- `GET /api/trips/:tripId/spots` - スポット一覧取得
- `POST /api/trips/:tripId/spots` - 新しいスポット追加
- `PUT /api/spots/:id` - スポット更新
- `DELETE /api/spots/:id` - スポット削除

### 支出管理（開発中）
- `GET /api/trips/:tripId/expenses` - 支出一覧取得
- `POST /api/trips/:tripId/expenses` - 支出記録
- `PUT /api/expenses/:id` - 支出更新
- `DELETE /api/expenses/:id` - 支出削除

### 思い出管理（開発中）
- `GET /api/trips/:tripId/memories` - 思い出一覧取得
- `POST /api/trips/:tripId/memories` - 思い出追加
- `PUT /api/memories/:id` - 思い出更新
- `DELETE /api/memories/:id` - 思い出削除

## 🔧 開発ガイド

### 現在の開発状況
- **進捗率**: 約70%（基盤機能完了、詳細機能実装中）
- **実装完了**: 認証、旅行プラン管理、スポット管理、しおり生成
- **開発中**: 支出管理、思い出管理機能

### 開発環境での作業
```bash
# 開発サーバー起動
npm run dev

# エラーチェック
npm run lint

# ビルド
npm run build
```

### 開発効率化ツール
- `DEVELOPMENT_LOG.md` - 詳細な開発履歴
- `IMPLEMENTATION_STATUS.md` - 実装状況チェックリスト
- `QUICK_START_GUIDE.md` - 開発者向けクイックスタート
- `README_DEVELOPMENT.md` - 開発継続のための参考資料

### 次の開発予定
1. **ExpenseManager.jsx** の完全実装
2. **MemoryManager.jsx** の完全実装
3. PDF生成機能の実装
4. UI/UX改善とレスポンシブ対応

## 🤝 コントリビュート

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🎯 開発ロードマップ

### Phase 1: 基盤機能 ✅ (完了)
- [x] ユーザー認証システム
- [x] 旅行プラン基本機能
- [x] スポット管理システム
- [x] 旅程表示機能

### Phase 2: 詳細機能 🚧 (進行中)
- [ ] 支出管理システム
- [ ] 思い出記録システム
- [ ] PDF生成機能
- [ ] データ統合

### Phase 3: UX改善 ⏳ (未着手)
- [ ] レスポンシブデザイン
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング改善
- [ ] ローディング状態改善

### Phase 4: 拡張機能 ⏳ (未着手)
- [ ] 地図連携機能
- [ ] リアルタイム共有
- [ ] SNS連携
- [ ] 多言語対応

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 👥 コントリビュート

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

---

**Travel Palette で、あなたの旅行計画を素敵な想い出に変えましょう！** ✨🌍

*最終更新: 2025年8月31日*
