# Platform Gateway API ドキュメント

## 📋 概要

Platform Gateway APIは、エンタープライズ級マルチテナント管理プラットフォームの包括的なAPIセットです。

## 🎯 主な特徴

- **🔐 Keycloak OIDC/JWT認証**: エンタープライズ級認証システム
- **💳 Stripe Connect統合**: マルチテナント決済処理  
- **🏢 マルチテナント対応**: 組織単位でのデータ分離
- **🛡️ ロールベースアクセス制御**: 細かい権限管理
- **📊 リアルタイム分析**: ダッシュボード・メトリクス
- **🌐 Cloudflare Edge**: 高速・グローバル配信

## 🔗 API仕様書

### 📄 OpenAPI 3.0 仕様書
**完全版**: [api-specification.yaml](./api-specification.yaml)

### 🌐 Swagger UI (推奨)
オンラインでインタラクティブに仕様書を表示・テストできます：

#### 方法1: Swagger Editor (推奨)
1. [Swagger Editor](https://editor.swagger.io/) にアクセス
2. 左側に [api-specification.yaml](./api-specification.yaml) の内容をコピー＆ペースト
3. 右側でリアルタイムにAPI仕様書を確認
4. 「Try it out」でAPIテスト可能

#### 方法2: Redoc (美しい表示)
1. [Redoc Demo](https://redocly.github.io/redoc/) にアクセス
2. URLに以下を入力:
   ```
   https://raw.githubusercontent.com/rixy-ynxy/rd-ai-agent-generator/main/docs/api-specification.yaml
   ```

#### 方法3: ローカルSwagger UI
```bash
# Docker使用
docker run -p 8080:8080 -e SWAGGER_JSON=/api-spec.yaml -v /path/to/api-specification.yaml:/api-spec.yaml swaggerapi/swagger-ui

# または npm使用
npm install -g swagger-ui-dist
```

## 🚀 クイックスタート

### 1. 本番環境API
```
Base URL: https://ac94bb42.platform-gateway.pages.dev/api
```

### 2. 認証
```bash
# 1. ログインURL取得
curl -X GET "https://ac94bb42.platform-gateway.pages.dev/api/auth/login"

# 2. デモモード (開発・テスト用)
curl -H "X-Demo-Mode: true" \
     "https://ac94bb42.platform-gateway.pages.dev/api/auth/me"

# 3. JWT Bearer認証 (本番用)
curl -H "Authorization: Bearer <your_jwt_token>" \
     "https://ac94bb42.platform-gateway.pages.dev/api/auth/me"
```

### 3. 基本API呼び出し例

#### ダッシュボード統計取得
```bash
curl -H "X-Demo-Mode: true" \
     "https://ac94bb42.platform-gateway.pages.dev/api/dashboard/stats"
```

#### テナント一覧取得  
```bash
curl -H "X-Demo-Mode: true" \
     "https://ac94bb42.platform-gateway.pages.dev/api/tenants?limit=10"
```

#### 決済方法一覧
```bash
curl -H "X-Demo-Mode: true" \
     "https://ac94bb42.platform-gateway.pages.dev/api/payment/methods"
```

## 📚 APIエンドポイント一覧

### 🔐 認証 (`/api/auth`)
- `GET /login` - Keycloakログインリダイレクト
- `GET /callback` - 認証コールバック処理  
- `GET /me` - 現在のユーザー情報
- `POST /logout` - ログアウト
- `POST /refresh` - トークンリフレッシュ

### 🏢 テナント管理 (`/api/tenants`)
- `GET /` - テナント一覧取得
- `POST /` - 新規テナント作成 (super_admin)
- `GET /{id}` - 特定テナント取得
- `PUT /{id}` - テナント情報更新
- `DELETE /{id}` - テナント削除 (super_admin)

### 👥 ユーザー管理 (`/api/users`)
- `GET /` - ユーザー一覧取得
- `POST /` - ユーザー作成・招待
- `GET /{id}` - ユーザー詳細取得
- `PUT /{id}` - ユーザー情報更新
- `DELETE /{id}` - ユーザー削除

### 💳 決済処理 (`/api/payment`)
- `GET /billing-summary` - 請求概要・使用状況
- `GET /methods` - 決済方法一覧
- `POST /methods` - 決済方法追加
- `POST /methods/{id}/set-default` - デフォルト設定
- `DELETE /methods/{id}` - 決済方法削除
- `GET /invoices` - 請求書一覧
- `GET /invoices/{id}` - 個別請求書詳細
- `GET /invoices/{id}/download` - 請求書PDFダウンロード
- `POST /connect-account` - Stripe Connect作成
- `POST /connect-account/onboarding-link` - オンボーディング
- `GET /connect-account/status` - Connectステータス

### 📊 ダッシュボード (`/api/dashboard`)
- `GET /stats` - 基本統計情報
- `GET /metrics/api-calls` - API呼び出しメトリクス
- `GET /activities` - 最近のアクティビティログ

## 🛡️ 権限システム

### ロール階層
1. **super_admin** - プラットフォーム全体管理
2. **tenant_owner** - テナントオーナー
3. **admin** - テナント管理者  
4. **manager** - ユーザー・リソース管理
5. **developer** - API・開発者機能
6. **support** - カスタマーサポート
7. **user** - 基本ユーザー

### アクセス制御例
```javascript
// 支払い情報の閲覧権限
const canViewPayments = user.roles.some(role => 
  ['super_admin', 'tenant_owner', 'admin'].includes(role)
)

// ユーザー管理権限  
const canManageUsers = user.roles.some(role =>
  ['super_admin', 'tenant_owner', 'admin', 'manager'].includes(role)
)
```

## 📝 レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": { /* 実際のデータ */ },
  "message": "操作が成功しました" // オプション
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": { /* エラー詳細 */ } // オプション
}
```

### ページング対応レスポンス
```json
{
  "success": true,
  "data": [ /* データ配列 */ ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

## 🔧 開発・テスト

### 環境
- **本番**: https://ac94bb42.platform-gateway.pages.dev/api
- **開発**: http://localhost:3000/api (ローカル開発時)

### デモモード
開発・テスト用に認証なしでAPIを使用可能：
```bash
# ヘッダーに X-Demo-Mode を追加
curl -H "X-Demo-Mode: true" \
     "https://ac94bb42.platform-gateway.pages.dev/api/dashboard/stats"
```

### レート制限
- **一般API**: 100リクエスト/分
- **認証API**: 20リクエスト/分  
- **決済API**: 50リクエスト/分

## 🚨 注意事項

### セキュリティ
- 本番環境では必ずJWT Bearer認証を使用
- API キーやトークンをログに出力しない
- HTTPS通信必須

### エラーハンドリング
- HTTPステータスコードに加えて、レスポンス内の`success`フィールドを確認
- `error`フィールドには人間可読なエラーメッセージ
- `code`フィールドにはプログラム用エラーコード

### ベストプラクティス
```javascript
// 推奨するAPIクライアント実装例
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        // または開発時: 'X-Demo-Mode': 'true'
        ...options.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'API Error')
    }
    
    return data.data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

## 📞 サポート

- **GitHub Issues**: https://github.com/rixy-ynxy/rd-ai-agent-generator/issues
- **API仕様書**: [api-specification.yaml](./api-specification.yaml)  
- **本番URL**: https://ac94bb42.platform-gateway.pages.dev

---

**最終更新**: 2025年10月4日  
**APIバージョン**: 1.0.0  
**仕様書形式**: OpenAPI 3.0.3