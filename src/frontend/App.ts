import type { User, AppState } from './types';
import { ApiService } from './services/ApiService';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { BillingComponent } from './components/BillingComponent';
import { showToast } from './utils/helpers';

export class PlatformGatewayApp {
  private state: AppState;
  private apiService: ApiService;
  private navigation: Navigation | null = null;

  constructor() {
    this.state = {
      currentUser: null,
      currentTenant: null,
      currentPage: 'dashboard',
      apiBaseUrl: '/api'
    };
    
    this.apiService = new ApiService(this.state.apiBaseUrl);
    
    // Initialize Day.js plugins
    if (typeof (window as any).dayjs !== 'undefined' && typeof (window as any).dayjs_plugin_relativeTime !== 'undefined') {
      (window as any).dayjs.extend((window as any).dayjs_plugin_relativeTime);
    } else {
      console.warn('Day.js or relativeTime plugin not loaded');
    }
    
    // Make app methods available globally - will be extended by other components
    (window as any).app = {
      toggleNavSection: Navigation.toggleNavSection,
      showBillingView: this.showBillingView.bind(this),
      bypassLogin: this.bypassLogin.bind(this),
      logout: this.logout.bind(this),
      toggleUserMenu: this.toggleUserMenu.bind(this),
      hideDemoBanner: this.hideDemoBanner.bind(this),
      navigateTo: this.navigateTo.bind(this),
      loginWithRole: this.loginWithRole.bind(this)
    };
    
    this.init();
  }

  async init(): Promise<void> {
    console.log('🔄 Checking authentication status...');
    await this.checkAuth();
    
    console.log('🗺️ Initializing routing...');
    this.initRouting();
    
    console.log('🎨 Rendering initial page...');
    this.renderPage();
    
    console.log('⏰ Starting auto-refresh...');
    this.startAutoRefresh();
    
    // ✅ Make Navigation class globally available for role switching
    (window as any).Navigation = Navigation;
    
    console.log('✅ App initialization completed successfully');
  }

  private initRouting(): void {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      const page = window.location.hash.slice(1) || 'dashboard';
      console.log('🔙 Browser navigation:', page);
      this.navigateTo(page, false); // false = don't push to history
    });

    // Set initial page from URL hash
    const initialPage = window.location.hash.slice(1) || 'dashboard';
    this.state.currentPage = initialPage;
    console.log('🏠 Initial page:', initialPage);
  }

  public navigateTo(page: string, pushToHistory: boolean = true): void {
    console.log('🧭 Navigating to:', page);
    
    // Update application state
    this.state.currentPage = page;
    
    // Update URL hash if needed
    if (pushToHistory && window.location.hash.slice(1) !== page) {
      window.location.hash = page;
    }
    
    // Re-render navigation to update active states (preserve accordion state)
    this.renderNavigation();
    
    // Re-render page content
    this.renderPageContent();
  }

  private async checkAuth(): Promise<void> {
    try {
      let token = localStorage.getItem('auth_token');
      
      // Demo mode: Auto-login setup
      if (!token) {
        console.log('🎭 Demo Mode: Auto-login activated');
        token = 'demo_jwt_token_' + Date.now();
        localStorage.setItem('auth_token', token);
        localStorage.setItem('demo_mode', 'true');
        
        // Demo user info setup
        this.state.currentUser = {
          id: 'user-123',
          email: 'admin@example.com',
          name: 'John Doe (Demo User)',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
          roles: ['admin', 'tenant_owner'],
          tenantId: 'tenant-abc-corp',
          tenantName: 'ABC Corporation',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: '2025-09-01T09:00:00Z',
          updatedAt: new Date().toISOString()
        };
        
        console.log('🎭 Demo user logged in automatically:', this.state.currentUser);
        return;
      }

      // Validate existing token
      const response = await this.apiService.call('GET', '/auth/me', null, token);
      if (response.success) {
        this.state.currentUser = response.data;
        console.log('Authenticated user:', this.state.currentUser);
      } else {
        console.log('🎭 Invalid token, switching to demo mode');
        localStorage.removeItem('auth_token');
        await this.checkAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      console.log('🎭 Error occurred, switching to demo mode');
      localStorage.removeItem('auth_token');
      await this.checkAuth();
    }
  }

  private renderPage(): void {
    console.log('🎨 renderPage called');
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('❌ App container not found');
      return;
    }

    if (!this.state.currentUser) {
      console.log('🔐 User not authenticated, showing login page');
      this.showLoginPage();
      return;
    }
    
    console.log('👤 User authenticated, rendering main layout');

    // Render layout with navigation
    appContainer.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex">
        <!-- Sidebar - Always visible for PC testing -->
        <div class="flex w-64 flex-col">
          <div class="flex-1 flex flex-col min-h-0 bg-white shadow">
            <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div class="flex items-center flex-shrink-0 px-4">
                <h1 class="text-xl font-bold text-gray-900">
                  <i class="fas fa-layer-group mr-2 text-primary-600"></i>
                  Platform Gateway
                </h1>
              </div>
              <nav class="mt-8 flex-1 px-2 space-y-1" id="sidebar-nav">
                <!-- Navigation items will be inserted here -->
              </nav>
            </div>
            <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div class="flex items-center">
                <img class="inline-block h-9 w-9 rounded-full" 
                     src="${this.state.currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format'}" 
                     alt="${this.state.currentUser.name}">
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-700">
                    ${this.state.currentUser.name}
                    ${localStorage.getItem('demo_mode') === 'true' ? '<span class="text-green-600 text-xs ml-1">🎭</span>' : ''}
                  </p>
                  <div class="relative">
                    <button class="text-xs text-gray-500 hover:text-gray-700" onclick="window.app.toggleUserMenu()" id="user-menu-button">
                      ${this.state.currentUser.tenantName || 'Platform Admin'} <i class="fas fa-chevron-down ml-1"></i>
                    </button>
                    <div class="hidden absolute bottom-full mb-2 left-0 dropdown-menu" id="user-menu">
                      <a href="#profile" class="dropdown-item"><i class="fas fa-user mr-2"></i> Profile</a>
                      <a href="#settings" class="dropdown-item"><i class="fas fa-cog mr-2"></i> Settings</a>
                      <hr class="my-1">
                      <button class="dropdown-item text-danger-600" onclick="window.app.logout()">
                        <i class="fas fa-sign-out-alt mr-2"></i> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Demo Mode Banner -->
        ${localStorage.getItem('demo_mode') === 'true' && localStorage.getItem('demo_banner_hidden') !== 'true' ? `
        <div class="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 text-center text-sm">
          <i class="fas fa-magic mr-2"></i>
          <strong>🎭 DEMO MODE</strong> - This is a fully functional UI prototype with mock data
          <button onclick="window.app.hideDemoBanner()" class="ml-4 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ` : ''}

        <!-- Main content -->
        <div class="flex-1 overflow-hidden">
          <div class="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <div class="flex-1 px-4 flex justify-between items-center">
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-900" id="page-title">Dashboard</h2>
              </div>
              <div class="ml-4 flex items-center md:ml-6">
                ${localStorage.getItem('demo_mode') === 'true' ? `
                <div class="mr-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <i class="fas fa-magic mr-1"></i>
                  Demo Mode
                </div>
                ` : ''}
                
                <!-- Help Guide Button -->
                <button onclick="window.HelpGuide.toggle('${this.state.currentPage}')" 
                        class="mr-3 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                        title="操作ガイドを表示">
                  <i class="fas fa-question-circle"></i>
                </button>
                
                <!-- Notification Button -->
                <button class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500">
                  <i class="fas fa-bell"></i>
                  <span class="sr-only">View notifications</span>
                </button>
              </div>
            </div>
          </div>

          <main class="flex-1 relative overflow-y-auto focus:outline-none">
            <div class="py-6">
              <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div id="page-content">
                  <!-- Page content will be inserted here -->
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;

    console.log('📋 Rendering navigation...');
    this.renderNavigation();
    
    console.log('📄 Rendering page content...');
    this.renderPageContent();
    
    console.log('✅ Page render completed');
  }

  private renderNavigation(): void {
    const navContainer = document.getElementById('sidebar-nav');
    if (!navContainer || !this.state.currentUser) return;

    this.navigation = new Navigation(this.state.currentPage, this.state.currentUser);
    this.navigation.render(navContainer);
  }

  private async renderPageContent(): Promise<void> {
    const contentContainer = document.getElementById('page-content');
    const titleContainer = document.getElementById('page-title');
    
    if (!contentContainer || !titleContainer || !this.state.currentUser) return;

    // Dashboard page
    if (this.state.currentPage === 'dashboard' || this.state.currentPage === '') {
      titleContainer.textContent = 'Dashboard';
      const dashboard = new Dashboard(this.apiService, this.state.currentUser);
      await dashboard.render(contentContainer);
    } 
    // Billing pages - handle both billing/ prefixed and standalone billing page
    else if (this.state.currentPage.startsWith('billing/') || this.state.currentPage === 'billing') {
      const billingView = this.state.currentPage === 'billing' ? 'billing/overview' : this.state.currentPage;
      titleContainer.textContent = this.getPageTitle(billingView);
      const billingComponent = new BillingComponent(this.apiService, this.state.currentUser);
      await billingComponent.render(contentContainer, billingView);
    }
    // Profile pages
    else if (this.state.currentPage.startsWith('profile/')) {
      const profileView = this.state.currentPage.split('/')[1] || 'personal';
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const { ProfileComponent } = await import('./components/ProfileComponent');
      const profileComponent = new ProfileComponent(this.state.currentUser);
      profileComponent.render(contentContainer, profileView);
    }
    // Tenant management pages
    else if (this.state.currentPage.startsWith('tenant/')) {
      const tenantView = this.state.currentPage.split('/')[1] || 'profile';
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const { TenantComponent } = await import('./components/TenantComponent');
      const tenantComponent = new TenantComponent(this.state.currentUser);
      await tenantComponent.render(contentContainer, tenantView);
    }
    // Admin payment management pages
    else if (this.state.currentPage.startsWith('admin-payment/')) {
      const adminPaymentView = this.state.currentPage.split('/')[1] || 'schedule';
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const { AdminPaymentComponent } = await import('./components/AdminPaymentComponent');
      const adminPaymentComponent = new AdminPaymentComponent(this.apiService, this.state.currentUser);
      await adminPaymentComponent.render(contentContainer, adminPaymentView);
    }
    // Tenant finance management pages
    else if (this.state.currentPage.startsWith('tenant-finance/')) {
      const tenantFinanceView = this.state.currentPage.split('/')[1] || 'overview';
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const { TenantFinanceComponent } = await import('./components/TenantFinanceComponent');
      const tenantFinanceComponent = new TenantFinanceComponent(this.apiService, this.state.currentUser);
      await tenantFinanceComponent.render(contentContainer, tenantFinanceView);
    }
    // User payment management pages
    else if (this.state.currentPage.startsWith('user-payment/')) {
      const userPaymentView = this.state.currentPage.split('/')[1] || 'overview';
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const { UserPaymentComponent } = await import('./components/UserPaymentComponent');
      const userPaymentComponent = new UserPaymentComponent(this.apiService, this.state.currentUser);
      await userPaymentComponent.render(contentContainer, userPaymentView);
    }
    // Analytics and Reports
    else if (this.state.currentPage === 'analytics' || this.state.currentPage === 'reports') {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      const dashboard = new Dashboard(this.apiService, this.state.currentUser);
      await dashboard.render(contentContainer);
    }
    // User Management pages
    else if (this.state.currentPage.startsWith('users/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'users');
    }
    // API Management pages
    else if (this.state.currentPage.startsWith('api/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'api');
    }
    // Monitoring pages
    else if (this.state.currentPage.startsWith('monitoring/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'monitoring');
    }
    // Integration pages
    else if (this.state.currentPage.startsWith('integrations/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'integrations');
    }
    // Settings pages
    else if (this.state.currentPage.startsWith('settings/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'settings');
    }
    // Admin Console pages
    else if (this.state.currentPage.startsWith('admin/')) {
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'admin');
    }
    else {
      // Default placeholder for other pages
      titleContainer.textContent = this.getPageTitle(this.state.currentPage);
      contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, 'default');
    }
  }

  private renderPlaceholderPage(page: string, category: string): string {
    const pageTitle = this.getPageTitle(page);
    const categoryIcons: Record<string, string> = {
      'users': 'fas fa-users',
      'api': 'fas fa-code',
      'monitoring': 'fas fa-chart-bar',
      'integrations': 'fas fa-puzzle-piece',
      'settings': 'fas fa-cog',
      'admin': 'fas fa-tools',
      'default': 'fas fa-cog'
    };

    const categoryDescriptions: Record<string, string> = {
      'users': 'ユーザー管理機能',
      'api': 'API管理機能',
      'monitoring': 'モニタリング機能',
      'integrations': '連携管理機能',
      'settings': '設定機能',
      'admin': '管理者機能',
      'default': 'システム機能'
    };

    return `
      <div class="text-center py-12">
        <i class="${categoryIcons[category]} text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">${pageTitle}</h3>
        <p class="text-gray-500 mb-6">この${categoryDescriptions[category]}は現在開発中です。</p>
        
        <div class="bg-blue-50 p-6 rounded-lg max-w-md mx-auto">
          <h4 class="text-blue-800 font-semibold mb-3 flex items-center justify-center">
            <i class="fas fa-info-circle mr-2"></i>
            機能について
          </h4>
          <div class="text-blue-700 text-sm space-y-2">
            <p><i class="fas fa-check mr-2"></i>UI設計・デザインは完成済み</p>
            <p><i class="fas fa-check mr-2"></i>ナビゲーション構造は実装済み</p>
            <p><i class="fas fa-clock mr-2"></i>詳細機能は開発予定</p>
          </div>
          <div class="mt-4 pt-3 border-t border-blue-200">
            <button onclick="window.app.navigateTo('dashboard')" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              <i class="fas fa-home mr-2"></i>
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private getPageTitle(page: string): string {
    const titles: Record<string, string> = {
      // Dashboard & Analytics
      'dashboard': 'Dashboard',
      'analytics': 'Analytics',
      'reports': 'Reports',
      
      // User Management
      'tenants': 'テナント管理',
      'users': 'ユーザー管理',
      'users/list': 'ユーザー一覧',
      'users/create': 'ユーザー追加',
      'users/roles': 'ロール・権限管理',
      'users/invitations': '招待管理',
      
      // API Management
      'api': 'API管理',
      'api/keys': 'APIキー管理',
      'api/endpoints': 'エンドポイント管理',
      'api/documentation': 'API ドキュメント',
      'api/testing': 'APIテスト',
      
      // Billing & Payments
      'billing': '請求管理',
      'billing/overview': '請求概要',
      'billing/payments': '支払い方法',
      'billing/invoices': '請求書',
      'billing/subscription': 'サブスクリプション',
      'billing/connect': 'Stripe Connect',
      
      // Profile Management
      'profile/personal': '個人情報',
      'profile/security': 'セキュリティ設定',
      'profile/preferences': '設定',
      
      // Tenant Management
      'tenant/profile': '組織プロフィール',
      'tenant/settings': '組織設定',
      'tenant/branding': 'ブランディング',
      
      // Admin Payment Management
      'admin-payment/schedule': '支払いスケジュール管理',
      'admin-payment/fees': '手数料管理',
      'admin-payment/transactions': 'プラットフォーム取引履歴',
      'admin-payment/analytics': '決済分析',
      
      // Tenant Finance Management
      'tenant-finance/overview': '財務概要',
      'tenant-finance/transactions': '取引履歴',
      'tenant-finance/payouts': '出金管理',
      'tenant-finance/settings': '決済設定',
      
      // User Payment Management
      'user-payment/overview': '決済管理',
      'user-payment/methods': '決済方法管理',
      'user-payment/services': 'サービス連携',
      'user-payment/history': '支払い履歴',
      
      // Monitoring & Performance
      'monitoring': 'モニタリング',
      'monitoring/usage': '使用量メトリクス',
      'monitoring/performance': 'パフォーマンス',
      'monitoring/logs': 'アクティビティログ',
      'monitoring/health': 'システムヘルス',
      'monitoring/alerts': 'アラート',
      
      // Integrations
      'integrations': '連携管理',
      'integrations/webhooks': 'Webhook管理',
      'integrations/sso': 'SSO設定',
      'integrations/third-party': 'サードパーティサービス',
      'integrations/marketplace': 'アプリマーケットプレイス',
      
      // Settings
      'settings': '設定',
      'settings/general': '一般設定',
      'settings/security': 'セキュリティ設定',
      'settings/notifications': '通知設定',
      'settings/preferences': '個人設定',
      'settings/branding': 'ブランディング',
      
      // Admin Console
      'admin': '管理コンソール',
      'admin/platform': 'プラットフォーム概要',
      'admin/tenants': 'テナント管理',
      'admin/users': 'グローバルユーザー管理',
      'admin/system': 'システム設定',
      'admin/maintenance': 'メンテナンス'
    };
    return titles[page] || 'ページ';
  }

  private getPageType(page: string): string {
    // Map specific pages to help categories
    const pageMap: Record<string, string> = {
      'analytics': 'dashboard',
      'reports': 'dashboard', 
      'tenants': 'tenants',
      'users': 'users',
      'users/list': 'users',
      'users/create': 'users',
      'users/roles': 'users',
      'users/invitations': 'users',
      'api/keys': 'api',
      'api/endpoints': 'api',
      'api/documentation': 'api',
      'api/testing': 'api',
      'billing/overview': 'billing',
      'billing/invoices': 'billing',
      'billing/payments': 'billing',
      'billing/subscription': 'billing',
      'billing/connect': 'billing',
      'monitoring/usage': 'monitoring',
      'monitoring/performance': 'monitoring',
      'monitoring/logs': 'monitoring',
      'monitoring/health': 'monitoring',
      'monitoring/alerts': 'monitoring',
      'integrations/webhooks': 'integrations',
      'integrations/sso': 'integrations',
      'integrations/third-party': 'integrations',
      'integrations/marketplace': 'integrations',
      'settings/general': 'settings',
      'settings/security': 'settings',
      'settings/notifications': 'settings',
      'settings/preferences': 'settings',
      'settings/branding': 'settings',
      'admin/platform': 'admin',
      'admin/tenants': 'admin',
      'admin/users': 'admin',
      'admin/system': 'admin',
      'admin/maintenance': 'admin'
    };
    return pageMap[page] || page;
  }

  private showLoginPage(): void {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="text-center">
            <div class="flex justify-center items-center mb-4">
              <h1 class="text-3xl font-bold text-gray-900">
                <i class="fas fa-layer-group mr-3 text-primary-600"></i>
                Platform Gateway
              </h1>
              <button onclick="window.HelpGuide.toggle('login')" 
                      class="ml-4 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                      title="ログイン画面の操作ガイド">
                <i class="fas fa-question-circle"></i>
              </button>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              🎭 Demo Access
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Enterprise Multi-Tenant Management Platform
            </p>
          </div>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            
            <!-- Role Selection -->
            <div class="mb-6">
              <label for="demo-role-select" class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-user-circle mr-2 text-primary-600"></i>
                デモアカウントを選択
              </label>
              <select id="demo-role-select" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="super_admin">👑 管理者 - 全ての機能にアクセス可能</option>
                <option value="tenant_owner">🏢 テナント運営者 - 組織管理ができる</option>
                <option value="user">👤 利用者 - 個人情報と支払い管理のみ</option>
              </select>
            </div>

            <div class="mt-6">
              <div class="mt-4 text-sm text-gray-600 bg-green-50 p-4 rounded-md border border-green-200">
                <div class="flex items-center mb-2">
                  <i class="fas fa-magic text-green-600 mr-2"></i>
                  <span class="font-semibold text-green-800">🎭 Demo Mode Activated</span>
                </div>
                <p class="text-xs mt-2 text-green-600">
                  <i class="fas fa-info-circle mr-1"></i>
                  This is a full-featured UI prototype with automatic login and mock data.
                </p>
                <div class="mt-3 pt-2 border-t border-green-200">
                  <button type="button" onclick="window.app.loginWithRole()" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    <i class="fas fa-rocket mr-2"></i>
                    選択したロールでログイン
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private startAutoRefresh(): void {
    setInterval(() => {
      if (this.state.currentPage === 'dashboard' && this.state.currentUser) {
        this.renderPageContent();
      }
    }, 5 * 60 * 1000);
  }

  // Public methods (exposed to window.app)
  public loginWithRole(): void {
    const roleSelect = document.getElementById('demo-role-select') as HTMLSelectElement;
    const selectedRole = roleSelect ? roleSelect.value : 'super_admin';
    
    console.log(`🎭 Demo: Logging in with role: ${selectedRole}`);
    
    // Store selected role for ApiService
    localStorage.setItem('demo_user_role', selectedRole);
    
    const demoToken = 'demo_jwt_token_' + Date.now();
    localStorage.setItem('auth_token', demoToken);
    localStorage.setItem('demo_mode', 'true');
    
    // Set user based on selected role
    const roleConfig: Record<string, any> = {
      'super_admin': {
        roles: ['super_admin'],
        name: 'Admin User (管理者)',
        email: 'admin@example.com'
      },
      'tenant_owner': {
        roles: ['tenant_owner'],
        name: 'Tenant Owner (テナント運営者)',
        email: 'owner@abc-corp.com'
      },
      'user': {
        roles: ['user'],
        name: 'Regular User (利用者)',
        email: 'user@abc-corp.com'
      }
    };
    
    const userConfig = roleConfig[selectedRole] || roleConfig['super_admin'];
    
    this.state.currentUser = {
      id: 'user-123',
      email: userConfig.email,
      name: userConfig.name,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
      roles: userConfig.roles,
      tenantId: 'tenant-abc-corp',
      tenantName: 'ABC Corporation',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
      createdAt: '2024-09-01T09:00:00Z',
      updatedAt: new Date().toISOString()
    };
    
    console.log(`✅ Logged in as ${userConfig.name}:`, this.state.currentUser);
    
    this.renderPage();
  }

  public bypassLogin(): void {
    // Default to super_admin for backward compatibility
    localStorage.setItem('demo_user_role', 'super_admin');
    this.loginWithRole();
    
    window.location.hash = 'dashboard';
    this.renderPage();
    
    setTimeout(() => {
      showToast('success', '🎭 Demo mode activated! Welcome to Platform Gateway');
    }, 500);
  }

  public logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo_mode');
    this.state.currentUser = null;
    window.location.hash = '';
    this.showLoginPage();
  }

  public toggleUserMenu(): void {
    const menu = document.getElementById('user-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  public hideDemoBanner(): void {
    localStorage.setItem('demo_banner_hidden', 'true');
    this.renderPage();
  }

  public showBillingView(view: string): void {
    window.location.hash = view;
    // This will trigger the route change and re-render
  }
}