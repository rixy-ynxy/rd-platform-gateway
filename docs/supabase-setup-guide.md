# Supabase統合セットアップガイド

## 🎯 必要な情報取得手順

### Step 1: Supabaseアカウント作成・プロジェクト設定

#### 1.1 Supabaseアカウント作成
```bash
# 1. ブラウザでアクセス
https://supabase.com

# 2. 「Start your project」をクリック
# 3. GitHubアカウントでサインアップ（推奨）
```

#### 1.2 新規プロジェクト作成
```bash
# Supabaseダッシュボードで「New Project」
プロジェクト名: platform-gateway
組織: あなたのGitHub組織 (rixy-ynxy)
データベースパスワード: 強力なパスワード（必ず記録！）
リージョン: Northeast Asia (Tokyo) - ap-northeast-1
プラン: Free Plan（開発用）または Pro Plan（本番用）
```

#### 1.3 プロジェクト情報の取得
プロジェクト作成後、以下の情報をコピーしてください：

```bash
# プロジェクト設定 > API から取得
Project URL: https://xxxxxxxxxxxxx.supabase.co
API Keys:
  - anon (public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  - service_role (secret): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# プロジェクト設定 > Database から取得  
Database Password: あなたが設定したパスワード
Connection String: postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Step 2: 環境変数設定

#### 2.1 開発環境設定（.dev.vars）
```bash
# プロジェクトルートで .dev.vars ファイル作成
cd /home/user/webapp
cp .env.sample .dev.vars

# .dev.vars を編集して以下を設定:
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

#### 2.2 本番環境設定（Cloudflare Secrets）
```bash
# 本番デプロイ時に実行
wrangler secret put SUPABASE_URL --project-name platform-gateway
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --project-name platform-gateway
wrangler secret put DATABASE_URL --project-name platform-gateway
```

### Step 3: 必要な依存関係インストール

```bash
# Supabaseクライアントライブラリ
npm install @supabase/supabase-js

# PostgreSQL用ドライバー (オプション)
npm install pg @types/pg

# データベースマイグレーション用（推奨）
npm install -D @supabase/cli
```

### Step 4: 情報確認チェックリスト

取得した情報をチェックしてください：

#### ✅ 必須情報
- [ ] **Project URL**: `https://xxxxxxxx.supabase.co`
- [ ] **Anon Key**: `eyJhbGciOiJIUzI1NiIs...` (公開キー)
- [ ] **Service Role Key**: `eyJhbGciOiJIUzI1NiIs...` (秘密キー)
- [ ] **Database Password**: プロジェクト作成時に設定したパスワード
- [ ] **Connection String**: PostgreSQL接続文字列

#### ✅ プロジェクト設定確認
- [ ] リージョンが Tokyo (ap-northeast-1) に設定済み
- [ ] GitHubアカウントでログイン済み
- [ ] プロジェクトが正常に作成済み
- [ ] ダッシュボードにアクセス可能

### Step 5: 設定テスト

#### 5.1 接続テスト
```javascript
// 簡単な接続テスト用コード
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://xxxxxxxxxxxxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIs...' // service_role key
)

// 接続テスト
async function testConnection() {
  const { data, error } = await supabase
    .from('_test')
    .select('*')
  
  if (error && error.code === '42P01') {
    console.log('✅ Supabase接続成功！（テーブルが存在しないのは正常）')
  } else if (data) {
    console.log('✅ Supabase接続成功！')
  } else {
    console.error('❌ 接続エラー:', error)
  }
}

testConnection()
```

## 📋 実際の取得手順

### 1. 今すぐ実行してください

```bash
# 1. Supabaseダッシュボードにアクセス
open https://supabase.com

# 2. GitHubでサインアップ/ログイン

# 3. 「New Project」ボタンをクリック

# 4. プロジェクト情報を入力:
名前: platform-gateway
パスワード: [強力なパスワードを設定して記録]
リージョン: Northeast Asia (Tokyo)

# 5. 作成完了まで待機（2-3分）
```

### 2. 設定画面で情報をコピー

```bash
# 左サイドバー「Settings」→「API」
Project URL をコピー: https://xxxxx.supabase.co
anon key をコピー: eyJ... (public key)
service_role key をコピー: eyJ... (secret key)

# 左サイドバー「Settings」→「Database」  
Database password を確認
Connection string をコピー
```

### 3. Slackまたはコメントで共有

取得した情報（**秘密キーは除く**）を以下の形式で共有してください：

```
✅ Supabase セットアップ完了
Project URL: https://xxxxxxxxxxxxx.supabase.co  
Project ID: xxxxxxxxxxxxx
リージョン: ap-northeast-1
ダッシュボードアクセス: 正常

次のステップ準備完了 🚀
```

## 🚨 セキュリティ注意事項

### ❌ 絶対にしないこと
- Service Role Key をGitにコミット
- パスワードを平文で保存
- 公開チャンネルで秘密情報を共有

### ✅ 安全な管理方法
- パスワードマネージャーでパスワード管理
- 環境変数で秘密キーを管理
- .dev.vars は .gitignore に含まれていることを確認

## 📞 サポート

### 問題が発生した場合

1. **接続エラー**: リージョン設定とネットワークを確認
2. **認証エラー**: APIキーの形式とコピー漏れを確認
3. **権限エラー**: Service Role Keyが正しく設定されているか確認

### 参考リンク
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**次のステップ**: 上記情報を取得後、データベーススキーマの作成とAPI統合実装に進みます！ 🚀