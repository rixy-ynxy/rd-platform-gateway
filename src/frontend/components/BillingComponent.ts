import type { User, ApiResponse, PaymentMethod, Invoice, BillingSummary } from '../types';
import { ApiService } from '../services/ApiService';
import { showToast } from '../utils/helpers';

export class BillingComponent {
  private apiService: ApiService;
  private currentUser: User;
  private billingSummary: BillingSummary | null = null;
  private paymentMethods: PaymentMethod[] = [];
  private invoices: Invoice[] = [];
  private currentView: 'overview' | 'payments' | 'invoices' | 'connect' = 'overview';

  constructor(apiService: ApiService, currentUser: User) {
    this.apiService = apiService;
    this.currentUser = currentUser;
  }

  async render(container: HTMLElement, view: string = 'billing/overview'): Promise<void> {
    const viewParts = view.split('/');
    this.currentView = (viewParts[1] as any) || 'overview';
    
    container.innerHTML = `
      <div class="billing-container">
        <div class="billing-tabs mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button class="billing-tab ${this.currentView === 'overview' ? 'active' : ''}" 
                    onclick="window.app.showBillingView('billing/overview')">
              <i class="fas fa-chart-pie mr-2"></i>
              請求概要
            </button>
            <button class="billing-tab ${this.currentView === 'payments' ? 'active' : ''}" 
                    onclick="window.app.showBillingView('billing/payments')">
              <i class="fas fa-credit-card mr-2"></i>
              支払い方法
            </button>
            <button class="billing-tab ${this.currentView === 'invoices' ? 'active' : ''}" 
                    onclick="window.app.showBillingView('billing/invoices')">
              <i class="fas fa-file-invoice mr-2"></i>
              請求書
            </button>
            <button class="billing-tab ${this.currentView === 'connect' ? 'active' : ''}" 
                    onclick="window.app.showBillingView('billing/connect')">
              <i class="fab fa-stripe mr-2"></i>
              Stripe Connect
            </button>
          </nav>
        </div>
        
        <div id="billing-content">
          <!-- Content will be loaded here -->
        </div>
      </div>
    `;

    // Expose methods globally (extend existing app object)
    (window as any).app = (window as any).app || {};
    Object.assign((window as any).app, {
      addPaymentMethod: this.addPaymentMethod.bind(this),
      setDefaultPaymentMethod: this.setDefaultPaymentMethod.bind(this),
      removePaymentMethod: this.removePaymentMethod.bind(this),
      downloadInvoice: this.downloadInvoice.bind(this),
      createConnectAccount: this.createConnectAccount.bind(this),
      continueOnboarding: this.continueOnboarding.bind(this),
      openStripeDashboard: this.openStripeDashboard.bind(this),
      updateAccountInfo: this.updateAccountInfo.bind(this)
    });

    // Show loading state and load data in background
    this.showLoadingState();
    
    try {
      await this.loadData();
      await this.renderContent();
    } catch (error) {
      this.showErrorState();
    }
  }

  private async loadData(): Promise<void> {
    try {
      // Load only necessary data based on current view for faster initial load
      switch (this.currentView) {
        case 'overview':
          await this.loadOverviewData();
          break;
        case 'payments':
          await this.loadPaymentMethodsData();
          break;
        case 'invoices':
          await this.loadInvoicesData();
          break;
        case 'connect':
          // Connect status is loaded separately in renderContent
          break;
        default:
          await this.loadOverviewData();
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
      showToast('error', '請求データの読み込みに失敗しました');
    }
  }

  private async loadOverviewData(): Promise<void> {
    const [summaryResponse, methodsResponse] = await Promise.all([
      this.apiService.call<BillingSummary>('GET', '/payment/billing-summary'),
      this.apiService.call<PaymentMethod[]>('GET', '/payment/methods')
    ]);

    if (summaryResponse.success) {
      this.billingSummary = summaryResponse.data!;
    }

    if (methodsResponse.success) {
      this.paymentMethods = methodsResponse.data!;
    }
  }

  private async loadPaymentMethodsData(): Promise<void> {
    const methodsResponse = await this.apiService.call<PaymentMethod[]>('GET', '/payment/methods');
    if (methodsResponse.success) {
      this.paymentMethods = methodsResponse.data!;
    }
  }

  private async loadInvoicesData(): Promise<void> {
    const invoicesResponse = await this.apiService.call<{ data: Invoice[]; meta: any }>('GET', '/payment/invoices', { page: 1, limit: 10 });
    if (invoicesResponse.success) {
      this.invoices = invoicesResponse.data!.data;
    }
  }

  private showLoadingState(): void {
    const contentContainer = document.getElementById('billing-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div class="text-sm text-gray-600">データを読み込み中...</div>
        </div>
      </div>
    `;
  }

  private showErrorState(): void {
    const contentContainer = document.getElementById('billing-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">データの読み込みに失敗しました</h3>
          <p class="text-gray-500 mb-4">しばらく時間をおいて再度お試しください。</p>
          <button onclick="window.location.reload()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
            再読み込み
          </button>
        </div>
      </div>
    `;
  }

  private async renderContent(): Promise<void> {
    const contentContainer = document.getElementById('billing-content');
    if (!contentContainer) return;

    switch (this.currentView) {
      case 'overview':
        contentContainer.innerHTML = this.renderOverview();
        break;
      case 'payments':
        contentContainer.innerHTML = this.renderPaymentMethods();
        break;
      case 'invoices':
        contentContainer.innerHTML = this.renderInvoices();
        break;
      case 'connect':
        contentContainer.innerHTML = this.renderStripeConnect();
        await this.loadConnectStatus();
        break;
      default:
        contentContainer.innerHTML = this.renderOverview();
    }
  }

  private renderOverview(): string {
    if (!this.billingSummary) {
      return '<div class="text-center py-8 text-gray-500">データがありません</div>';
    }

    const { currentPeriod, nextBillingDate, paymentMethod, usageThisMonth, tenant } = this.billingSummary;

    return `
      <div class="billing-overview">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Current Plan Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">現在のプラン</h3>
              <span class="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">
                ${tenant.plan}
              </span>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">月額料金:</span>
                <span class="font-semibold">$${currentPeriod.amount.toFixed(2)} ${currentPeriod.currency.toUpperCase()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">次回請求日:</span>
                <span class="font-semibold">${nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('ja-JP') : '未設定'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">請求期間:</span>
                <span class="text-sm text-gray-500">
                  ${new Date(currentPeriod.start).toLocaleDateString('ja-JP')} - 
                  ${new Date(currentPeriod.end).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          </div>

          <!-- Payment Method Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">支払い方法</h3>
              <button onclick="window.app.showBillingView('billing/payments')" 
                      class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                管理
              </button>
            </div>
            ${paymentMethod ? `
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <i class="fab fa-cc-${paymentMethod.brand} text-2xl text-gray-400"></i>
                </div>
                <div>
                  <div class="font-medium text-gray-900">
                    **** **** **** ${paymentMethod.last4}
                  </div>
                  <div class="text-sm text-gray-500">
                    ${paymentMethod.expiryMonth}/${paymentMethod.expiryYear}
                  </div>
                </div>
                <div class="flex-1"></div>
                <span class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  デフォルト
                </span>
              </div>
            ` : `
              <div class="text-center py-4">
                <i class="fas fa-credit-card text-3xl text-gray-300 mb-2"></i>
                <p class="text-gray-500 text-sm">支払い方法が登録されていません</p>
                <button onclick="window.app.showBillingView('billing/payments')" 
                        class="mt-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700">
                  追加する
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Usage Statistics -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">今月の使用状況</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-1">
                ${usageThisMonth.apiCalls.toLocaleString()}
              </div>
              <div class="text-sm text-gray-500">API呼び出し</div>
              ${tenant.limits?.apiCalls ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min((usageThisMonth.apiCalls / tenant.limits.apiCalls) * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.apiCalls.toLocaleString()}まで
                </div>
              ` : ''}
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-1">
                ${usageThisMonth.users}
              </div>
              <div class="text-sm text-gray-500">ユーザー数</div>
              ${tenant.limits?.users ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min((usageThisMonth.users / tenant.limits.users) * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.users.toLocaleString()}まで
                </div>
              ` : ''}
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-1">
                ${usageThisMonth.storage.toFixed(1)} GB
              </div>
              <div class="text-sm text-gray-500">ストレージ</div>
              ${tenant.limits?.storage ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min((usageThisMonth.storage / tenant.limits.storage) * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.storage} GBまで
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">最近の請求書</h3>
            <button onclick="window.app.showBillingView('billing/invoices')" 
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              すべて表示
            </button>
          </div>
          ${this.invoices.length > 0 ? `
            <div class="space-y-3">
              ${this.invoices.slice(0, 3).map(invoice => `
                <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-file-invoice text-gray-400"></i>
                    <div>
                      <div class="font-medium text-gray-900">${invoice.number}</div>
                      <div class="text-sm text-gray-500">${new Date(invoice.createdAt).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="font-semibold">$${(invoice.amount / 100).toFixed(2)}</span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      ${invoice.status === 'paid' ? '支払済' : 
                        invoice.status === 'open' ? '未払い' : 
                        invoice.status}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-file-invoice text-3xl text-gray-300 mb-2"></i>
              <p>請求書がありません</p>
            </div>
          `}
        </div>
      </div>
    `;
  }

  private renderPaymentMethods(): string {
    return `
      <div class="payment-methods">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">支払い方法</h2>
          <button onclick="window.app.addPaymentMethod()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
            <i class="fas fa-plus mr-2"></i>
            追加
          </button>
        </div>

        ${this.paymentMethods.length > 0 ? `
          <div class="space-y-4">
            ${this.paymentMethods.map(method => `
              <div class="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <i class="fab fa-cc-${method.brand} text-3xl text-gray-400"></i>
                  </div>
                  <div>
                    <div class="font-medium text-gray-900">
                      ${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} **** ${method.last4}
                    </div>
                    <div class="text-sm text-gray-500">
                      有効期限: ${method.expiryMonth}/${method.expiryYear}
                    </div>
                    <div class="text-sm text-gray-500">
                      追加日: ${new Date(method.createdAt).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center space-x-3">
                  ${method.isDefault ? `
                    <span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                      <i class="fas fa-check mr-1"></i>
                      デフォルト
                    </span>
                  ` : `
                    <button onclick="window.app.setDefaultPaymentMethod('${method.id}')" 
                            class="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      デフォルトに設定
                    </button>
                  `}
                  
                  <div class="relative">
                    <button onclick="this.nextElementSibling.classList.toggle('hidden')" 
                            class="text-gray-400 hover:text-gray-600">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      ${!method.isDefault ? `
                        <button onclick="window.app.removePaymentMethod('${method.id}')" 
                                class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <i class="fas fa-trash mr-2"></i>
                          削除
                        </button>
                      ` : `
                        <div class="px-4 py-2 text-sm text-gray-500">
                          デフォルトの支払い方法は削除できません
                        </div>
                      `}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="bg-white rounded-lg shadow p-12 text-center">
            <i class="fas fa-credit-card text-5xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">支払い方法がありません</h3>
            <p class="text-gray-500 mb-6">請求を自動化するために支払い方法を追加してください。</p>
            <button onclick="window.app.addPaymentMethod()" 
                    class="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700">
              <i class="fas fa-plus mr-2"></i>
              最初の支払い方法を追加
            </button>
          </div>
        `}
      </div>
    `;
  }

  private renderInvoices(): string {
    return `
      <div class="invoices">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">請求書</h2>
          <div class="flex space-x-2">
            <select class="border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="all">すべて</option>
              <option value="paid">支払済</option>
              <option value="open">未払い</option>
              <option value="draft">下書き</option>
            </select>
          </div>
        </div>

        ${this.invoices.length > 0 ? `
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    請求書番号
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期限
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th class="relative px-6 py-3">
                    <span class="sr-only">アクション</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${this.invoices.map(invoice => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <i class="fas fa-file-invoice text-gray-400 mr-3"></i>
                        <div>
                          <div class="font-medium text-gray-900">${invoice.number}</div>
                          <div class="text-sm text-gray-500">${invoice.description || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-gray-900">
                        $${(invoice.amount / 100).toFixed(2)} ${invoice.currency.toUpperCase()}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${invoice.status === 'paid' ? '支払済' : 
                          invoice.status === 'open' ? '未払い' : 
                          invoice.status === 'draft' ? '下書き' :
                          invoice.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(invoice.dueDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(invoice.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onclick="window.app.downloadInvoice('${invoice.id}')" 
                              class="text-primary-600 hover:text-primary-700">
                        <i class="fas fa-download mr-1"></i>
                        ダウンロード
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="bg-white rounded-lg shadow p-12 text-center">
            <i class="fas fa-file-invoice text-5xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">請求書がありません</h3>
            <p class="text-gray-500">請求書が作成されるとここに表示されます。</p>
          </div>
        `}
      </div>
    `;
  }

  private renderStripeConnect(): string {
    return `
      <div class="stripe-connect">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 flex items-center">
            <i class="fab fa-stripe text-2xl text-blue-600 mr-3"></i>
            Stripe Connect
          </h2>
        </div>

        <div id="connect-status-container">
          <div class="flex items-center justify-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="ml-2 text-gray-600">Stripe Connect ステータスを確認中...</span>
          </div>
        </div>
      </div>
    `;
  }

  private async loadConnectStatus(): Promise<void> {
    try {
      const response = await this.apiService.call('GET', '/payment/connect-account/status');
      const container = document.getElementById('connect-status-container');
      if (!container) return;

      if (response.success) {
        const account = response.data as StripeConnectAccount;
        container.innerHTML = this.renderConnectStatus(account);
      } else {
        container.innerHTML = `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
              <span class="text-red-800">ステータスの取得に失敗しました</span>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to load connect status:', error);
    }
  }

  private renderConnectStatus(account: StripeConnectAccount): string {
    if (!account.hasAccount) {
      return `
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <div class="mb-6">
            <i class="fab fa-stripe text-6xl text-blue-600 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Stripe Connect アカウント</h3>
            <p class="text-gray-600 mb-6">
              支払いを受け取るためにStripe Connectアカウントを設定してください。
            </p>
          </div>
          
          <div class="bg-blue-50 rounded-lg p-6 mb-6">
            <h4 class="font-semibold text-blue-900 mb-3">Stripe Connect の利点</h4>
            <ul class="text-left text-blue-800 space-y-2">
              <li><i class="fas fa-check text-blue-600 mr-2"></i>直接支払いを受け取り</li>
              <li><i class="fas fa-check text-blue-600 mr-2"></i>自動的な税務処理</li>
              <li><i class="fas fa-check text-blue-600 mr-2"></i>詳細な売上分析</li>
              <li><i class="fas fa-check text-blue-600 mr-2"></i>複数通貨対応</li>
            </ul>
          </div>
          
          <button onclick="window.app.createConnectAccount()" 
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center mx-auto">
            <i class="fab fa-stripe mr-2"></i>
            Stripe Connect アカウントを作成
          </button>
        </div>
      `;
    }

    const statusColor = account.status === 'enabled' ? 'green' : 
                       account.status === 'restricted' ? 'yellow' : 'red';
    const statusText = account.status === 'enabled' ? '有効' : 
                      account.status === 'restricted' ? '制限中' : 
                      account.status === 'pending' ? '設定中' : '無効';

    return `
      <div class="space-y-6">
        <!-- Account Status -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">アカウントステータス</h3>
            <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-800">
              ${statusText}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold ${account.chargesEnabled ? 'text-green-600' : 'text-red-600'} mb-1">
                <i class="fas fa-${account.chargesEnabled ? 'check-circle' : 'times-circle'}"></i>
              </div>
              <div class="text-sm text-gray-600">支払い受取</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.chargesEnabled ? '有効' : '無効'}
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold ${account.payoutsEnabled ? 'text-green-600' : 'text-red-600'} mb-1">
                <i class="fas fa-${account.payoutsEnabled ? 'check-circle' : 'times-circle'}"></i>
              </div>
              <div class="text-sm text-gray-600">出金</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.payoutsEnabled ? '有効' : '無効'}
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold ${account.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'} mb-1">
                <i class="fas fa-${account.detailsSubmitted ? 'check-circle' : 'clock'}"></i>
              </div>
              <div class="text-sm text-gray-600">詳細情報</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.detailsSubmitted ? '提出済' : '未提出'}
              </div>
            </div>
          </div>
        </div>

        ${account.requirements && (account.requirements.currently_due.length > 0 || account.requirements.past_due.length > 0) ? `
          <!-- Requirements -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div class="flex items-center mb-4">
              <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
              <h3 class="text-lg font-semibold text-yellow-800">必要な対応</h3>
            </div>
            
            ${account.requirements.past_due.length > 0 ? `
              <div class="mb-4">
                <h4 class="font-medium text-red-800 mb-2">期限切れの項目:</h4>
                <ul class="list-disc list-inside text-red-700 space-y-1">
                  ${account.requirements.past_due.map(req => `<li>${req}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${account.requirements.currently_due.length > 0 ? `
              <div class="mb-4">
                <h4 class="font-medium text-yellow-800 mb-2">対応が必要な項目:</h4>
                <ul class="list-disc list-inside text-yellow-700 space-y-1">
                  ${account.requirements.currently_due.map(req => `<li>${req}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <button onclick="window.app.continueOnboarding()" 
                    class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 font-medium">
              <i class="fas fa-arrow-right mr-2"></i>
              設定を続ける
            </button>
          </div>
        ` : ''}

        <!-- Account Management -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">アカウント管理</h3>
          <div class="space-y-3">
            <button onclick="window.app.openStripeDashboard()" 
                    class="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50">
              <div class="flex items-center">
                <i class="fas fa-external-link-alt text-gray-400 mr-3"></i>
                <div class="text-left">
                  <div class="font-medium text-gray-900">Stripe ダッシュボード</div>
                  <div class="text-sm text-gray-500">詳細な売上データとアカウント管理</div>
                </div>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
            
            <button onclick="window.app.updateAccountInfo()" 
                    class="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50">
              <div class="flex items-center">
                <i class="fas fa-edit text-gray-400 mr-3"></i>
                <div class="text-left">
                  <div class="font-medium text-gray-900">アカウント情報の更新</div>
                  <div class="text-sm text-gray-500">銀行口座や事業情報を更新</div>
                </div>
              </div>
              <i class="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Event Handlers
  private showView(view: string): void {
    window.location.hash = view;
    // This will trigger the route change and re-render
  }

  private addPaymentMethod(): void {
    showToast('info', 'デモモード: 支払い方法の追加機能');
    // In real implementation, this would open Stripe Elements
  }

  private async setDefaultPaymentMethod(methodId: string): Promise<void> {
    try {
      const response = await this.apiService.call('POST', `/payment/methods/${methodId}/set-default`);
      if (response.success) {
        showToast('success', 'デフォルト支払い方法を更新しました');
        await this.loadData();
        await this.renderContent();
      } else {
        showToast('error', response.error || 'デフォルト支払い方法の設定に失敗しました');
      }
    } catch (error) {
      showToast('error', 'エラーが発生しました');
    }
  }

  private async removePaymentMethod(methodId: string): Promise<void> {
    if (!confirm('この支払い方法を削除しますか？')) {
      return;
    }

    try {
      const response = await this.apiService.call('DELETE', `/payment/methods/${methodId}`);
      if (response.success) {
        showToast('success', '支払い方法を削除しました');
        await this.loadData();
        await this.renderContent();
      } else {
        showToast('error', response.error || '支払い方法の削除に失敗しました');
      }
    } catch (error) {
      showToast('error', 'エラーが発生しました');
    }
  }

  private async downloadInvoice(invoiceId: string): Promise<void> {
    try {
      const response = await this.apiService.call('GET', `/payment/invoices/${invoiceId}/download`);
      if (response.success && response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        showToast('success', '請求書のダウンロードを開始しました');
      } else {
        showToast('error', '請求書のダウンロードに失敗しました');
      }
    } catch (error) {
      showToast('error', 'エラーが発生しました');
    }
  }

  private async createConnectAccount(): Promise<void> {
    try {
      showToast('info', 'Stripe Connectアカウントを作成中...');
      const response = await this.apiService.call('POST', '/payment/connect-account', {
        country: 'US',
        type: 'express'
      });
      
      if (response.success) {
        showToast('success', 'Stripe Connectアカウントを作成しました');
        await this.loadConnectStatus();
      } else {
        showToast('error', response.error || 'アカウント作成に失敗しました');
      }
    } catch (error) {
      showToast('error', 'エラーが発生しました');
    }
  }

  private continueOnboarding(): void {
    showToast('info', 'デモモード: Stripeオンボーディング');
    // In real implementation, this would create onboarding link and redirect
  }

  private openStripeDashboard(): void {
    showToast('info', 'デモモード: Stripeダッシュボードを開く');
    // In real implementation, this would open Stripe dashboard
  }

  private updateAccountInfo(): void {
    showToast('info', 'デモモード: アカウント情報を更新');
    // In real implementation, this would open account update form
  }
}