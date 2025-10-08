// Platform Gateway UI - Help Guide Component
export class HelpGuide {
  private static isVisible: boolean = false;
  private static currentPage: string = '';

  static show(page: string): void {
    this.currentPage = page;
    this.isVisible = true;
    this.render();
  }

  static hide(): void {
    this.isVisible = false;
    const overlay = document.getElementById('help-guide-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  static toggle(page: string): void {
    if (this.isVisible && this.currentPage === page) {
      this.hide();
    } else {
      this.show(page);
    }
  }

  private static render(): void {
    // Remove existing overlay
    this.hide();

    const overlay = document.createElement('div');
    overlay.id = 'help-guide-overlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    overlay.onclick = (e) => {
      if (e.target === overlay) this.hide();
    };

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto';

    modal.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-question-circle text-primary-600 mr-3"></i>
            ${this.getPageTitle()} - 操作ガイド
          </h2>
          <button onclick="window.HelpGuide.hide()" class="text-gray-400 hover:text-gray-600 text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-6">
          ${this.getHelpContent()}
        </div>
        
        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
              <i class="fas fa-lightbulb mr-1"></i>
              ヒント: このガイドは画面右上の <i class="fas fa-question-circle mx-1"></i> ボタンでいつでも表示できます
            </div>
            <button onclick="window.HelpGuide.hide()" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Make HelpGuide globally accessible
    (window as any).HelpGuide = HelpGuide;
  }

  private static getPageTitle(): string {
    const titles: Record<string, string> = {
      'login': 'ログイン画面',
      'dashboard': 'ダッシュボード',
      'analytics': '分析画面',
      'reports': 'レポート',
      'tenants': 'テナント管理',
      'users': 'ユーザー管理',
      'api': 'API管理',
      'billing': '課金・支払い',
      'monitoring': '監視・モニタリング',
      'integrations': '統合設定',
      'settings': '設定',
      'admin': '管理者コンソール'
    };
    return titles[this.currentPage] || 'ページ';
  }

  private static getHelpContent(): string {
    switch (this.currentPage) {
      case 'login':
        return this.getLoginHelp();
      case 'dashboard':
        return this.getDashboardHelp();
      case 'users':
        return this.getUsersHelp();
      case 'tenants':
        return this.getTenantsHelp();
      case 'api':
        return this.getApiHelp();
      case 'billing':
        return this.getBillingHelp();
      case 'monitoring':
        return this.getMonitoringHelp();
      case 'settings':
        return this.getSettingsHelp();
      case 'admin':
        return this.getAdminHelp();
      default:
        return this.getGenericHelp();
    }
  }

  private static getLoginHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 class="font-semibold text-green-800 flex items-center mb-2">
            <i class="fas fa-magic mr-2"></i>
            デモモードについて
          </h3>
          <ul class="text-sm text-green-700 space-y-1">
            <li>• 本システムは完全なUIプロトタイプです</li>
            <li>• 実際のサーバー接続なしでフル機能を体験できます</li>
            <li>• モックデータを使用して全ての操作を安全にテストできます</li>
            <li>• データは一時的なもので、リロード時にリセットされます</li>
          </ul>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <h4 class="font-semibold text-blue-800 mb-2">🚀 開始方法</h4>
          <div class="text-sm text-blue-700">
            <p class="mb-2">「Skip Login & Enter Demo」ボタンをクリックして、すぐにダッシュボードにアクセスできます。</p>
            <p>自動的に管理者権限でログインし、全機能を使用できます。</p>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h4>
          <div class="text-sm text-yellow-700">
            <p>デモ環境のため、入力されたデータは保存されません。実際の本番環境では適切な認証が必要です。</p>
          </div>
        </div>
      </div>
    `;
  }

  private static getDashboardHelp(): string {
    return `
      <div class="space-y-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-3">
            <i class="fas fa-tachometer-alt mr-2"></i>
            ダッシュボード概要
          </h3>
          <p class="text-sm text-blue-700 mb-2">
            このダッシュボードは企業のマルチテナント管理プラットフォームの中央監視画面です。
            リアルタイムで重要な指標を確認し、システム全体の状況を把握できます。
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-4 border border-gray-200 rounded-lg">
            <h4 class="font-semibold text-gray-800 flex items-center mb-2">
              <i class="fas fa-chart-bar text-primary-600 mr-2"></i>
              統計カード
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• <strong>ユーザー数:</strong> 総ユーザー数とアクティブユーザー数</li>
              <li>• <strong>API呼び出し:</strong> 月間使用量と制限に対する割合</li>
              <li>• <strong>ストレージ:</strong> 使用容量と使用率</li>
              <li>• <strong>月額料金:</strong> 現在のプランと料金</li>
            </ul>
          </div>

          <div class="bg-white p-4 border border-gray-200 rounded-lg">
            <h4 class="font-semibold text-gray-800 flex items-center mb-2">
              <i class="fas fa-chart-line text-green-600 mr-2"></i>
              使用状況チャート
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• 過去30日間のAPI呼び出し数の推移</li>
              <li>• トレンドの可視化で使用パターンを把握</li>
              <li>• データポイントにカーソルを合わせて詳細確認</li>
            </ul>
          </div>

          <div class="bg-white p-4 border border-gray-200 rounded-lg">
            <h4 class="font-semibold text-gray-800 flex items-center mb-2">
              <i class="fas fa-history text-warning-600 mr-2"></i>
              最近のアクティビティ
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• システム内の重要な操作履歴</li>
              <li>• ユーザーアクション、ログイン、設定変更など</li>
              <li>• タイムスタンプ付きで時系列表示</li>
            </ul>
          </div>

          <div class="bg-white p-4 border border-gray-200 rounded-lg">
            <h4 class="font-semibold text-gray-800 flex items-center mb-2">
              <i class="fas fa-cog text-gray-600 mr-2"></i>
              自動更新
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• 5分間隔で自動的にデータを更新</li>
              <li>• 手動更新は画面をリロード</li>
              <li>• リアルタイムな状況把握が可能</li>
            </ul>
          </div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">💡 使い方のコツ</h4>
          <div class="text-sm text-green-700 space-y-1">
            <p>• 左側のナビゲーションメニューで他の管理画面に移動できます</p>
            <p>• 各統計カードをクリックすると詳細情報を確認できます（実装予定）</p>
            <p>• 右上のベルアイコンで通知を確認できます（実装予定）</p>
            <p>• ユーザーメニューからログアウトや設定にアクセスできます</p>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🎭 デモモードの注意</h4>
          <p class="text-sm text-yellow-700">
            現在はデモモードで動作しているため、表示されているデータはサンプルです。
            実際の本番環境では、リアルタイムの実データが表示されます。
          </p>
        </div>
      </div>
    `;
  }

  private static getUsersHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-users mr-2"></i>
            ユーザー管理について
          </h3>
          <p class="text-sm text-blue-700">
            テナント内のユーザーアカウントの作成、編集、削除、権限管理を行う画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• ユーザー一覧の表示と検索</li>
            <li>• 新規ユーザーアカウントの作成</li>
            <li>• ユーザー情報の編集と無効化</li>
            <li>• 役割と権限の割り当て</li>
            <li>• 招待メールの送信</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getTenantsHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-building mr-2"></i>
            テナント管理について
          </h3>
          <p class="text-sm text-blue-700">
            マルチテナントプラットフォームの各組織（テナント）の管理を行う画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• テナント一覧の表示</li>
            <li>• 新規テナントの作成</li>
            <li>• テナント設定の編集</li>
            <li>• 利用制限とプランの設定</li>
            <li>• テナント別の使用統計確認</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getApiHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-code mr-2"></i>
            API管理について
          </h3>
          <p class="text-sm text-blue-700">
            APIキーの管理、エンドポイントの設定、API使用状況の監視を行う画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• APIキーの生成と管理</li>
            <li>• エンドポイントの設定と制限</li>
            <li>• APIドキュメントの表示</li>
            <li>• API使用統計とレスポンス時間</li>
            <li>• レート制限とセキュリティ設定</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getBillingHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-credit-card mr-2"></i>
            課金・支払いについて
          </h3>
          <p class="text-sm text-blue-700">
            サブスクリプション管理、請求書の確認、支払い方法の設定を行う画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• 請求書履歴の確認</li>
            <li>• 支払い方法の登録・変更</li>
            <li>• プランのアップグレード・ダウングレード</li>
            <li>• 使用量ベースの課金確認</li>
            <li>• Stripe Connect設定</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getMonitoringHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-heartbeat mr-2"></i>
            監視・モニタリングについて
          </h3>
          <p class="text-sm text-blue-700">
            システムパフォーマンス、使用状況メトリクス、ヘルスチェックを監視する画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• リアルタイム使用状況メトリクス</li>
            <li>• パフォーマンス監視ダッシュボード</li>
            <li>• アクティビティログの詳細表示</li>
            <li>• システムヘルスステータス</li>
            <li>• アラート設定と通知</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getSettingsHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-cog mr-2"></i>
            設定について
          </h3>
          <p class="text-sm text-blue-700">
            アプリケーションの各種設定、セキュリティ、通知、個人設定を管理する画面です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• 一般設定（タイムゾーン、言語など）</li>
            <li>• セキュリティ設定（2FA、パスワードポリシー）</li>
            <li>• 通知設定（メール、プッシュ通知）</li>
            <li>• 個人設定（プロフィール、表示設定）</li>
            <li>• ブランディング設定（ロゴ、色テーマ）</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getAdminHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-tools mr-2"></i>
            管理者コンソールについて
          </h3>
          <p class="text-sm text-blue-700">
            プラットフォーム全体の管理、システム設定、グローバル監視を行う管理者専用画面です。
          </p>
        </div>

        <div class="bg-red-50 p-4 rounded-lg">
          <h4 class="font-semibold text-red-800 mb-2">🔒 管理者限定</h4>
          <p class="text-sm text-red-700">
            この画面は超級管理者（Super Admin）権限が必要です。
          </p>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-800 mb-2">🚧 開発中</h4>
          <p class="text-sm text-yellow-700">
            この機能は現在開発中です。完成時には以下の操作が可能になります：
          </p>
          <ul class="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• プラットフォーム全体の統計確認</li>
            <li>• テナント全体の管理</li>
            <li>• グローバルユーザー管理</li>
            <li>• システム設定とメンテナンス</li>
            <li>• 監査ログとセキュリティ監視</li>
          </ul>
        </div>
      </div>
    `;
  }

  private static getGenericHelp(): string {
    return `
      <div class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-800 flex items-center mb-2">
            <i class="fas fa-info-circle mr-2"></i>
            このページについて
          </h3>
          <p class="text-sm text-blue-700">
            この機能は現在開発中です。まもなく利用可能になります。
          </p>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-800 mb-2">📚 利用可能な機能</h4>
          <ul class="text-sm text-green-700 space-y-1">
            <li>• <strong>ダッシュボード:</strong> 完全実装済み - 統計とメトリクスの確認</li>
            <li>• <strong>ナビゲーション:</strong> 左側メニューで各画面に移動</li>
            <li>• <strong>ヘルプガイド:</strong> 各画面でこのガイドを表示可能</li>
            <li>• <strong>デモモード:</strong> 安全な環境でのフル機能体験</li>
          </ul>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-800 mb-2">🔄 ナビゲーション</h4>
          <p class="text-sm text-gray-700">
            左側のサイドバーメニューから他の機能にアクセスできます。
            現在完全に実装されているのはダッシュボード機能です。
          </p>
        </div>
      </div>
    `;
  }
}