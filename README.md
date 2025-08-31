# Travel Palette
**想い出も育てる、共有型デジタルしおりアプリ**

## 🌟 コンセプト

旅行の計画が、そのまま旅行後の最高の「想い出」になるアプリです。計画を立てながら、お互いの「行きたい！」気持ちを共有し、旅行後には自動で感動的な想い出ムービーが完成します。

## ✨ 主な機能

### 1. 🗺️ わくわくマップ機能
- 地図上に、気になるお店や観光スポットをピン留め
- お互いがどんなことに興味があるか一目でわかる
- 「ここいいね！」とスタンプでリアクション可能
- 無料のOpenStreetMapを使用

### 2. 📖 旅のしおり自動生成
- 確定したスケジュールから、おしゃれなデザインの「旅のしおり」が自動生成
- 持ち物リストも完備
- PDF形式でダウンロード可能

### 3. 📋 旅行プランナー
- スポットの追加・管理
- カテゴリ別分類（観光地、レストラン、宿泊施設など）
- みんなでリアクション機能

## 🛠️ 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Node.js + Express
- **データベース**: SQLite
- **マップ**: OpenStreetMap (Leaflet)
- **コンテナ**: Docker & Docker Compose
- **デザイン**: ブラウン基調のシンプルなデザイン

## 🚀 セットアップ方法

### 前提条件
- Docker Desktop がインストールされていること
- Git がインストールされていること

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd travel-palette
```

### 2. Docker環境の起動
```bash
docker-compose up --build
```

### 3. アプリケーションへのアクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001

## 📁 プロジェクト構造

```
travel-palette/
├── frontend/              # Reactフロントエンド
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   ├── App.tsx       # メインアプリケーション
│   │   └── index.css     # スタイルシート
│   └── Dockerfile
├── backend/              # Node.jsバックエンド
│   ├── src/
│   │   └── app.js       # Express サーバー
│   └── Dockerfile
├── data/                # SQLiteデータベース保存
├── docker-compose.yml   # Docker設定
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

### 旅行プラン
- `GET /api/trips` - 旅行プラン一覧取得
- `POST /api/trips` - 新しい旅行プラン作成

### 目的地
- `GET /api/destinations` - 目的地一覧取得
- `POST /api/destinations` - 新しい目的地追加

### リアクション
- `POST /api/reactions` - リアクション追加

### 旅程
- `GET /api/itinerary` - 旅程取得
- `POST /api/itinerary` - 旅程アイテム追加

## 🔧 開発コマンド

### フロントエンド開発
```bash
cd frontend
npm run dev
```

### バックエンド開発
```bash
cd backend
npm run dev
```

### Docker環境のクリーンアップ
```bash
docker-compose down
docker system prune -f
```

## 🤝 コントリビュート

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🎯 今後の開発予定

- [ ] ユーザー認証機能
- [ ] リアルタイム共有機能
- [ ] 想い出ムービー自動生成
- [ ] モバイルアプリ版
- [ ] SNS連携機能
- [ ] 多言語対応

---

**Travel Palette で、あなたの旅行計画を素敵な想い出に変えましょう！** ✨🌍
