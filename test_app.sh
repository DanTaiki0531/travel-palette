#!/bin/bash

echo "🌍 Travel Palette アプリケーションテスト"
echo "=================================="

echo "1. バックエンドAPIのヘルスチェック..."
curl -s http://localhost:3001/api/health | echo

echo -e "\n2. フロントエンドアクセステスト..."
curl -s -I http://localhost:3000 | head -1

echo -e "\n3. サンプル旅行プランの作成..."
curl -s -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "title": "東京観光旅行",
    "description": "2泊3日の東京観光",
    "start_date": "2024-04-01",
    "end_date": "2024-04-03"
  }' | echo

echo -e "\n4. サンプル目的地の追加..."
curl -s -X POST http://localhost:3001/api/destinations \
  -H "Content-Type: application/json" \
  -d '{
    "trip_id": 1,
    "name": "東京タワー",
    "description": "東京のシンボル",
    "latitude": 35.6586,
    "longitude": 139.7454,
    "category": "attraction"
  }' | echo

echo -e "\n5. 目的地一覧の取得..."
curl -s http://localhost:3001/api/destinations | echo

echo -e "\n\n✅ テスト完了!"
echo "フロントエンド: http://localhost:3000"
echo "バックエンドAPI: http://localhost:3001"
