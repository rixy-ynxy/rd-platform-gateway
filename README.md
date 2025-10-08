# Platform Gateway - Enterprise Multi-Tenant Management System

## 🎯 プロジェクト概要

**Platform Gateway**は、エンタープライズ級のマルチテナント管理プラットフォームです。Hono フレームワーク、TypeScript、Cloudflare Edge技術を統合した包括的なソリューションを提供します。

## 🌐 アクセスURL

- **開発環境（サンドボックス）**: https://3000-i9n5sf19nbptsxlk3p5b2-6532622b.e2b.dev
- **GitHub リポジトリ**: https://github.com/rixy-ynxy/rd-ai-agent-generator
- **API エンドポイント**: https://3000-i9n5sf19nbptsxlk3p5b2-6532622b.e2b.dev/api

## ✅ 現在実装済み機能

### 🚀 コア機能
- **フロントエンドアプリケーション**: TypeScript + Hono によるモジュラーSPA
- **バックエンドAPI**: Hono フレームワークによる高速なCloudflare Workers API
- **デモモード認証**: ローカルストレージベースのデモ認証システム
- **レスポンシブUI**: TailwindCSSによるモダンなデザイン

### 📊 ダッシュボード機能
- **統計表示**: ユーザー数、API呼び出し、ストレージ使用量等
- **メトリクスチャート**: Chart.jsを使用したリアルタイムデータ可視化
- **アクティビティフィード**: 最新のシステムアクティビティ表示

### 💳 請求・決済管理
- **請求概要**: サブスクリプション情報と使用量の表示
- **支払い方法管理**: クレジットカード情報の管理（モック）
- **請求書一覧**: 過去の請求書履歴と状態管理
- **Stripe Connect統合準備**: 本格的な決済処理への準備

### 👥 テナント・ユーザー管理
- **テナント情報**: 企業・組織情報の管理
- **ユーザープロファイル**: 個人設定とアカウント情報
- **権限管理**: ロールベースのアクセス制御（準備済み）

### 🛠️ 管理機能
- **システム管理**: プラットフォーム全体の設定と監視
- **監査ログ**: システム操作の追跡と記録
- **設定管理**: 各種システム設定の管理

## 🏗️ 技術スタック

### フロントエンド
- **フレームワーク**: TypeScript + モジュラーアーキテクチャ
- **ビルドツール**: Vite 6.x
- **スタイリング**: Tailwind CSS (CDN)
- **アイコン**: Font Awesome 6.x
- **チャート**: Chart.js
- **日時処理**: Day.js

### バックエンド
- **フレームワーク**: Hono 4.x
- **ランタイム**: Cloudflare Workers/Pages
- **言語**: TypeScript 5.x
- **ビルド**: @hono/vite-cloudflare-pages

### 開発・デプロイ
- **パッケージマネージャー**: npm
- **プロセス管理**: PM2（開発環境）
- **ホスティング**: Cloudflare Pages
- **バージョン管理**: Git

## 📋 APIエンドポイント

### 認証
- `GET /api/auth/me` - ユーザー情報取得

### ダッシュボード
- `GET /api/dashboard/stats` - ダッシュボード統計
- `GET /api/dashboard/metrics/api-calls` - API呼び出しメトリクス
- `GET /api/dashboard/activities` - アクティビティ履歴

### テナント管理
- `GET /api/tenant/financials` - テナント財務情報
- `GET /api/tenant/transactions` - 取引履歴
- `GET /api/tenant/payouts` - 支払い情報
- `GET /api/tenant/profile` - テナントプロファイル
- `GET /api/tenant/branding` - ブランディング設定

### 決済
- `GET /api/payment/methods` - 支払い方法一覧
- `GET /api/payment/invoices` - 請求書一覧
- `GET /api/payment/billing-summary` - 請求概要
- `GET /api/payment/connect-account/status` - Connect アカウント状態

### システム
- `GET /api/health` - ヘルスチェック

## 🚀 クイックスタート

### 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# フロントエンド・バックエンドのビルド
npm run build

# PM2での開発サーバー起動
pm2 start ecosystem.config.cjs

# サービス確認
curl http://localhost:3000/api/health
```

### 利用可能なスクリプト

```bash
# 開発
npm run dev:sandbox          # サンドボックス環境での開発サーバー
npm run build               # フロントエンド + バックエンドのビルド
npm run build:frontend      # フロントエンドのみビルド
npm run build:backend       # バックエンドのみビルド

# デプロイ
npm run deploy             # Cloudflare Pages へのデプロイ
npm run preview           # プレビューサーバー起動

# 開発サポート
npm run clean-port        # ポート3000のクリア
npm run test             # サービステスト
```

## 🗂️ プロジェクト構造

```
webapp/
├── src/                    # ソースコード
│   ├── frontend/          # フロントエンドアプリケーション
│   │   ├── components/    # UIコンポーネント
│   │   ├── services/      # APIサービス
│   │   ├── types/         # TypeScript型定義
│   │   └── utils/         # ユーティリティ関数
│   ├── routes/           # バックエンドAPIルート
│   │   ├── auth-api.ts    # 認証API
│   │   ├── dashboard.ts   # ダッシュボードAPI
│   │   ├── tenant-api.ts  # テナントAPI
│   │   └── payment-api.ts # 決済API
│   ├── types/            # 共通型定義
│   └── index.tsx         # メインアプリケーションエントリ
├── public/               # 静的ファイル
│   └── static/          # ビルド済みフロントエンドアセット
├── dist/                # ビルド出力
├── docs/                # ドキュメント
└── migrations/          # データベーススキーマ
```

## 📖 使用方法

1. **アクセス**: https://3000-i9n5sf19nbptsxlk3p5b2-6532622b.e2b.dev
2. **自動ログイン**: デモモードが自動的に有効になります
3. **ナビゲーション**: サイドバーメニューから各機能にアクセス
4. **ページ切り替え**: Dashboard、Billing、Analytics、Admin、Profile 等

## 🔄 現在の動作状態

### ✅ 正常動作中
- フロントエンドアプリケーション
- 全APIエンドポイント
- ナビゲーション機能
- デモモード認証
- レスポンシブデザイン

### 📊 機能確認済み
- ダッシュボード表示
- 請求管理画面
- アナリティクス表示
- 管理画面
- プロファイル管理

## 🔧 技術的詳細

### デモモード
アプリケーションは現在デモモードで動作しており、以下の機能が有効です：
- ローカルストレージベースの認証
- モック API レスポンス
- 完全なUIナビゲーション
- リアルタイムデータ表示

### セキュリティ
- CORS設定済み
- 認証ミドルウェア準備済み
- セキュアなAPIエンドポイント設計

## 🚧 今後の実装予定

1. **データベース統合**: Cloudflare D1 との本格連携
2. **認証システム**: JWT/OIDC 認証の実装
3. **決済統合**: Stripe Connect の実装
4. **Cloudflare Pages デプロイ**: 本番環境への展開

## 📞 サポート

- **開発者**: Riu (AIlinearソリューションアーキテクト)
- **最終更新**: 2025-10-08
- **バージョン**: 1.0.0-demo

---

*このプロジェクトは、現代的なエッジコンピューティング技術を使用したエンタープライズ級のマルチテナント管理システムです。*