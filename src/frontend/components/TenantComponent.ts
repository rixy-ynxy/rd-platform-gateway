import type { User, Tenant } from '../types';
import { ApiService } from '../services/ApiService';

export class TenantComponent {
  private currentUser: User | null;
  private currentView: string;
  private tenant: Tenant | null = null;

  constructor(currentUser: User | null) {
    this.currentUser = currentUser;
    this.currentView = 'profile';
  }

  async render(container: HTMLElement, view: string = 'profile'): Promise<void> {
    if (!container) return;

    this.currentView = view;

    // Load tenant data
    await this.loadTenantData();

    switch (view) {
      case 'profile':
        this.renderTenantProfile(container);
        break;
      case 'settings':
        this.renderTenantSettings(container);
        break;
      case 'branding':
        this.renderTenantBranding(container);
        break;
      default:
        this.renderTenantProfile(container);
    }
  }

  private async loadTenantData(): Promise<void> {
    try {
      const response = await ApiService.prototype.call('GET', '/tenant/profile');
      if (response.success) {
        this.tenant = response.data;
      }
    } catch (error) {
      console.error('Failed to load tenant data:', error);
      // Use mock data for demo
      this.tenant = {
        id: 'tenant-abc-corp',
        name: 'ABC Corporation',
        domain: 'abc-corp.com',
        status: 'active',
        plan: 'Enterprise',
        description: '革新的なソリューションを提供するテクノロジー企業',
        industry: 'Technology',
        size: 'large',
        country: 'Japan',
        website: 'https://abc-corp.com',
        phone: '+81-3-1234-5678',
        address: '東京都千代田区丸の内1-1-1',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center&auto=format',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      };
    }
  }

  private renderTenantProfile(container: HTMLElement): void {
    if (!this.tenant) {
      container.innerHTML = '<div class="p-6 text-center">Loading...</div>';
      return;
    }

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-building mr-3 text-primary-600"></i>
            組織プロフィール
          </h1>
          <p class="mt-2 text-gray-600">
            あなたの組織情報を管理します
          </p>
        </div>

        <!-- Organization Logo and Basic Info -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-start space-x-6">
            <div class="shrink-0">
              <img class="h-24 w-24 rounded-lg object-cover bg-gray-200" 
                   src="${this.tenant.logoUrl || '/static/default-org-logo.svg'}" 
                   alt="Organization Logo" 
                   id="org-logo">
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900">${this.tenant.name}</h2>
                <div class="flex space-x-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    this.tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }">
                    ${this.tenant.status === 'active' ? 'アクティブ' : '非アクティブ'}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${this.tenant.plan} プラン
                  </span>
                </div>
              </div>
              <p class="text-gray-600 mb-4">${this.tenant.description || '説明がありません'}</p>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">ドメイン:</span>
                  <span class="ml-2 font-mono text-gray-900">${this.tenant.domain}</span>
                </div>
                <div>
                  <span class="text-gray-500">業界:</span>
                  <span class="ml-2 text-gray-900">${this.tenant.industry}</span>
                </div>
                <div>
                  <span class="text-gray-500">規模:</span>
                  <span class="ml-2 text-gray-900">${this.getTenantSizeLabel(this.tenant.size)}</span>
                </div>
                <div>
                  <span class="text-gray-500">作成日:</span>
                  <span class="ml-2 text-gray-900">${new Date(this.tenant.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Organization Details Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">組織詳細情報</h3>
          
          <form id="tenant-profile-form" class="space-y-6">
            <!-- Logo Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                組織ロゴ
              </label>
              <input type="file" 
                     id="logo-input" 
                     accept="image/*" 
                     class="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
              <p class="mt-1 text-xs text-gray-500">推奨サイズ: 200x200px、PNG/JPEG形式</p>
            </div>

            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="org-name" class="block text-sm font-medium text-gray-700 mb-2">
                  組織名 <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="org-name" 
                       value="${this.tenant.name}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="org-domain" class="block text-sm font-medium text-gray-700 mb-2">
                  ドメイン <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="org-domain" 
                       value="${this.tenant.domain}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="org-description" class="block text-sm font-medium text-gray-700 mb-2">
                組織説明
              </label>
              <textarea id="org-description" 
                        rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="組織について簡潔に説明してください...">${this.tenant.description || ''}</textarea>
            </div>

            <!-- Industry and Size -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="org-industry" class="block text-sm font-medium text-gray-700 mb-2">
                  業界
                </label>
                <select id="org-industry" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="Technology" ${this.tenant.industry === 'Technology' ? 'selected' : ''}>テクノロジー</option>
                  <option value="Finance" ${this.tenant.industry === 'Finance' ? 'selected' : ''}>金融</option>
                  <option value="Healthcare" ${this.tenant.industry === 'Healthcare' ? 'selected' : ''}>ヘルスケア</option>
                  <option value="Education" ${this.tenant.industry === 'Education' ? 'selected' : ''}>教育</option>
                  <option value="Retail" ${this.tenant.industry === 'Retail' ? 'selected' : ''}>小売</option>
                  <option value="Manufacturing" ${this.tenant.industry === 'Manufacturing' ? 'selected' : ''}>製造業</option>
                  <option value="Other" ${this.tenant.industry === 'Other' ? 'selected' : ''}>その他</option>
                </select>
              </div>

              <div>
                <label for="org-size" class="block text-sm font-medium text-gray-700 mb-2">
                  組織規模
                </label>
                <select id="org-size" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="small" ${this.tenant.size === 'small' ? 'selected' : ''}>小規模 (1-50人)</option>
                  <option value="medium" ${this.tenant.size === 'medium' ? 'selected' : ''}>中規模 (51-200人)</option>
                  <option value="large" ${this.tenant.size === 'large' ? 'selected' : ''}>大規模 (201-1000人)</option>
                  <option value="enterprise" ${this.tenant.size === 'enterprise' ? 'selected' : ''}>エンタープライズ (1000人以上)</option>
                </select>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="org-website" class="block text-sm font-medium text-gray-700 mb-2">
                  ウェブサイト
                </label>
                <input type="url" 
                       id="org-website" 
                       value="${this.tenant.website || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       placeholder="https://example.com">
              </div>

              <div>
                <label for="org-phone" class="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input type="tel" 
                       id="org-phone" 
                       value="${this.tenant.phone || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Address -->
            <div>
              <label for="org-address" class="block text-sm font-medium text-gray-700 mb-2">
                住所
              </label>
              <textarea id="org-address" 
                        rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="組織の所在地を入力してください">${this.tenant.address || ''}</textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" 
                      onclick="this.resetForm()" 
                      class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <i class="fas fa-undo mr-2"></i>
                リセット
              </button>
              <button type="submit" 
                      class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-save mr-2"></i>
                保存
              </button>
            </div>
          </form>
        </div>

        <!-- Subscription Information -->
        <div class="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">サブスクリプション情報</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">現在のプラン:</span>
              <span class="ml-2 font-medium text-gray-900">${this.tenant.plan}</span>
            </div>
            <div>
              <span class="text-gray-600">ステータス:</span>
              <span class="ml-2 font-medium ${this.tenant.status === 'active' ? 'text-green-600' : 'text-red-600'}">${this.tenant.status === 'active' ? 'アクティブ' : '非アクティブ'}</span>
            </div>
            <div>
              <span class="text-gray-600">最終更新:</span>
              <span class="ml-2 text-gray-900">${new Date(this.tenant.updatedAt).toLocaleString('ja-JP')}</span>
            </div>
            <div>
              <span class="text-gray-600">テナントID:</span>
              <span class="ml-2 font-mono text-gray-900">${this.tenant.id}</span>
            </div>
          </div>
          
          <div class="mt-4 flex space-x-3">
            <a href="#billing/overview" class="text-primary-600 hover:text-primary-800 font-medium text-sm">
              <i class="fas fa-credit-card mr-1"></i>
              請求情報を確認
            </a>
            <a href="#billing/subscription" class="text-primary-600 hover:text-primary-800 font-medium text-sm">
              <i class="fas fa-upgrade mr-1"></i>
              プランを変更
            </a>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderTenantSettings(container: HTMLElement): void {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-cog mr-3 text-primary-600"></i>
            組織設定
          </h1>
          <p class="mt-2 text-gray-600">
            組織の機能と権限を設定します
          </p>
        </div>

        <!-- API Configuration -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">API設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">API アクセス</p>
                <p class="text-sm text-gray-600">組織のAPIアクセスを有効/無効にします</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">Webhook通知</p>
                <p class="text-sm text-gray-600">イベント発生時にWebhookを送信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="pt-4 border-t">
              <label for="api-rate-limit" class="block text-sm font-medium text-gray-700 mb-2">
                API レート制限 (毎分)
              </label>
              <select id="api-rate-limit" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="100">100 リクエスト/分</option>
                <option value="500" selected>500 リクエスト/分</option>
                <option value="1000">1000 リクエスト/分</option>
                <option value="unlimited">無制限</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">セキュリティ設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">二段階認証を必須にする</p>
                <p class="text-sm text-gray-600">全メンバーに二段階認証を義務付けます</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">IPアドレス制限</p>
                <p class="text-sm text-gray-600">特定のIPアドレスからのみアクセスを許可</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="pt-4 border-t">
              <label for="session-timeout" class="block text-sm font-medium text-gray-700 mb-2">
                セッションタイムアウト
              </label>
              <select id="session-timeout" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="30">30分</option>
                <option value="60" selected>1時間</option>
                <option value="240">4時間</option>
                <option value="480">8時間</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Member Permissions -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">メンバー権限</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">新規メンバー招待</p>
                <p class="text-sm text-gray-600">すべてのメンバーが新規ユーザーを招待可能</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">プロフィール編集</p>
                <p class="text-sm text-gray-600">メンバーが自分のプロフィールを編集可能</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="pt-4 border-t">
              <label for="default-role" class="block text-sm font-medium text-gray-700 mb-2">
                新規メンバーのデフォルトロール
              </label>
              <select id="default-role" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="user" selected>利用者</option>
                <option value="manager">マネージャー</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t flex justify-end">
            <button class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              <i class="fas fa-save mr-2"></i>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderTenantBranding(container: HTMLElement): void {
    if (!this.tenant) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-palette mr-3 text-primary-600"></i>
            ブランディング
          </h1>
          <p class="mt-2 text-gray-600">
            組織のビジュアルブランドを設定します
          </p>
        </div>

        <!-- Brand Colors -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">ブランドカラー</h3>
          <form class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="primary-color" class="block text-sm font-medium text-gray-700 mb-2">
                  プライマリカラー
                </label>
                <div class="flex items-center space-x-3">
                  <input type="color" 
                         id="primary-color" 
                         value="${this.tenant.primaryColor || '#3b82f6'}" 
                         class="h-12 w-16 rounded-md border border-gray-300 cursor-pointer">
                  <input type="text" 
                         value="${this.tenant.primaryColor || '#3b82f6'}" 
                         class="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm">
                </div>
              </div>

              <div>
                <label for="secondary-color" class="block text-sm font-medium text-gray-700 mb-2">
                  セカンダリカラー
                </label>
                <div class="flex items-center space-x-3">
                  <input type="color" 
                         id="secondary-color" 
                         value="${this.tenant.secondaryColor || '#64748b'}" 
                         class="h-12 w-16 rounded-md border border-gray-300 cursor-pointer">
                  <input type="text" 
                         value="${this.tenant.secondaryColor || '#64748b'}" 
                         class="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm">
                </div>
              </div>
            </div>

            <!-- Color Preview -->
            <div class="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 class="text-sm font-medium text-gray-700 mb-3">プレビュー</h4>
              <div class="flex space-x-3">
                <button type="button" 
                        style="background-color: ${this.tenant.primaryColor || '#3b82f6'}" 
                        class="px-4 py-2 text-white rounded-md font-medium">
                  プライマリボタン
                </button>
                <button type="button" 
                        style="background-color: ${this.tenant.secondaryColor || '#64748b'}" 
                        class="px-4 py-2 text-white rounded-md font-medium">
                  セカンダリボタン
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Logo and Assets -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">ロゴとアセット</h3>
          <div class="space-y-6">
            <!-- Main Logo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                メインロゴ
              </label>
              <div class="flex items-center space-x-4">
                <div class="shrink-0">
                  <img class="h-16 w-16 rounded-lg object-cover bg-gray-200 border" 
                       src="${this.tenant.logoUrl}" 
                       alt="Current Logo">
                </div>
                <div class="flex-1">
                  <input type="file" 
                         accept="image/*" 
                         class="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
                  <p class="mt-1 text-xs text-gray-500">推奨: 200x200px、PNG形式、透明背景</p>
                </div>
              </div>
            </div>

            <!-- Favicon -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ファビコン
              </label>
              <div class="flex items-center space-x-4">
                <div class="shrink-0">
                  <div class="h-8 w-8 rounded bg-gray-200 border flex items-center justify-center">
                    <i class="fas fa-image text-gray-400"></i>
                  </div>
                </div>
                <div class="flex-1">
                  <input type="file" 
                         accept="image/x-icon,image/png" 
                         class="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
                  <p class="mt-1 text-xs text-gray-500">推奨: 32x32px、ICOまたはPNG形式</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom CSS -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">カスタムCSS</h3>
          <div class="space-y-4">
            <div>
              <label for="custom-css" class="block text-sm font-medium text-gray-700 mb-2">
                追加のカスタマイゼーション
              </label>
              <textarea id="custom-css" 
                        rows="8" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="/* カスタムCSSを入力 */
.custom-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.custom-button {
  border-radius: 8px;
  transition: all 0.3s ease;
}"></textarea>
              <p class="mt-2 text-xs text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>
                セレクターは .tenant-custom- プレフィックスが自動的に追加されます
              </p>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t flex justify-between">
            <button type="button" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              <i class="fas fa-eye mr-2"></i>
              プレビュー
            </button>
            <button class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              <i class="fas fa-save mr-2"></i>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachBrandingEventListeners();
  }

  private attachEventListeners(): void {
    // Tenant profile form submission
    const profileForm = document.getElementById('tenant-profile-form') as HTMLFormElement;
    if (profileForm) {
      profileForm.addEventListener('submit', this.handleTenantProfileSubmit.bind(this));
    }

    // Logo upload
    const logoInput = document.getElementById('logo-input') as HTMLInputElement;
    if (logoInput) {
      logoInput.addEventListener('change', this.handleLogoChange.bind(this));
    }
  }

  private attachBrandingEventListeners(): void {
    // Color change handlers
    const primaryColorInput = document.getElementById('primary-color') as HTMLInputElement;
    const secondaryColorInput = document.getElementById('secondary-color') as HTMLInputElement;
    
    if (primaryColorInput && secondaryColorInput) {
      primaryColorInput.addEventListener('change', this.updateColorPreview.bind(this));
      secondaryColorInput.addEventListener('change', this.updateColorPreview.bind(this));
    }
  }

  private async handleTenantProfileSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const formData = {
      name: (document.getElementById('org-name') as HTMLInputElement).value,
      domain: (document.getElementById('org-domain') as HTMLInputElement).value,
      description: (document.getElementById('org-description') as HTMLTextAreaElement).value,
      industry: (document.getElementById('org-industry') as HTMLSelectElement).value,
      size: (document.getElementById('org-size') as HTMLSelectElement).value,
      website: (document.getElementById('org-website') as HTMLInputElement).value,
      phone: (document.getElementById('org-phone') as HTMLInputElement).value,
      address: (document.getElementById('org-address') as HTMLTextAreaElement).value
    };

    try {
      const response = await ApiService.prototype.call('PUT', '/tenant/profile', formData);
      if (response.success) {
        this.showSuccessMessage('組織プロフィールが正常に更新されました');
      } else {
        this.showErrorMessage('組織プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('Tenant profile update error:', error);
      this.showErrorMessage('組織プロフィールの更新中にエラーが発生しました');
    }
  }

  private handleLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoImg = document.getElementById('org-logo') as HTMLImageElement;
        if (logoImg && e.target?.result) {
          logoImg.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private updateColorPreview(): void {
    const primaryColor = (document.getElementById('primary-color') as HTMLInputElement).value;
    const secondaryColor = (document.getElementById('secondary-color') as HTMLInputElement).value;
    
    // Update preview buttons
    const primaryBtn = document.querySelector('[style*="background-color"]') as HTMLElement;
    const secondaryBtn = document.querySelector('[style*="background-color"]:last-child') as HTMLElement;
    
    if (primaryBtn) primaryBtn.style.backgroundColor = primaryColor;
    if (secondaryBtn) secondaryBtn.style.backgroundColor = secondaryColor;
  }

  private getTenantSizeLabel(size: string): string {
    const labels: Record<string, string> = {
      'small': '小規模 (1-50人)',
      'medium': '中規模 (51-200人)',
      'large': '大規模 (201-1000人)',
      'enterprise': 'エンタープライズ (1000人以上)'
    };
    return labels[size] || size;
  }

  private showSuccessMessage(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private showErrorMessage(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}