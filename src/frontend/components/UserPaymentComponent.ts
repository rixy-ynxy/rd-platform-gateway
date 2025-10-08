import type { User, UserPaymentProfile, PaymentMethod, ConnectedService } from '../types';
import { ApiService } from '../services/ApiService';

export class UserPaymentComponent {
  private currentUser: User | null;
  private currentView: string;
  private apiService: ApiService;
  private paymentProfile: UserPaymentProfile | null = null;

  constructor(apiService: ApiService, currentUser: User | null) {
    this.apiService = apiService;
    this.currentUser = currentUser;
    this.currentView = 'overview';
  }

  async render(container: HTMLElement, view: string = 'overview'): Promise<void> {
    if (!container) return;

    this.currentView = view;

    switch (view) {
      case 'overview':
        await this.renderPaymentOverview(container);
        break;
      case 'methods':
        await this.renderPaymentMethods(container);
        break;
      case 'services':
        await this.renderConnectedServices(container);
        break;
      case 'history':
        await this.renderPaymentHistory(container);
        break;
      default:
        await this.renderPaymentOverview(container);
    }
  }

  private async renderPaymentOverview(container: HTMLElement): Promise<void> {
    await this.loadPaymentProfile();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-credit-card mr-3 text-primary-600"></i>
            決済管理
          </h1>
          <p class="mt-2 text-gray-600">
            決済情報と連携サービスを管理します
          </p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-credit-card text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">登録済み決済方法</p>
                <p class="text-2xl font-bold text-gray-900">${this.paymentProfile?.paymentMethods.length || 0}件</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-link text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">連携サービス</p>
                <p class="text-2xl font-bold text-gray-900">${this.paymentProfile?.connectedServices.length || 0}件</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-yen-sign text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月の支払い</p>
                <p class="text-2xl font-bold text-gray-900">¥12,500</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods Section -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">決済方法</h3>
            <button onclick="this.showAddPaymentMethodModal()" 
                    class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm">
              <i class="fas fa-plus mr-2"></i>
              追加
            </button>
          </div>
          <div class="p-6">
            ${this.paymentProfile?.paymentMethods.length 
              ? this.renderPaymentMethodList(this.paymentProfile.paymentMethods)
              : this.renderEmptyPaymentMethods()
            }
          </div>
        </div>

        <!-- Connected Services Section -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">連携サービス</h3>
            <button onclick="this.showServiceMarketplace()" 
                    class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
              <i class="fas fa-store mr-2"></i>
              サービスを探す
            </button>
          </div>
          <div class="p-6">
            ${this.paymentProfile?.connectedServices.length
              ? this.renderConnectedServiceList(this.paymentProfile.connectedServices)
              : this.renderEmptyServices()
            }
          </div>
        </div>

        <!-- Billing Information -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">請求先情報</h3>
          </div>
          <div class="p-6">
            <form class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">請求先住所</label>
                <input type="text" 
                       value="${this.paymentProfile?.billingAddress?.street || ''}"
                       placeholder="住所を入力してください"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                <input type="text" 
                       value="${this.paymentProfile?.billingAddress?.city || ''}"
                       placeholder="市区町村"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
                <input type="text" 
                       value="${this.paymentProfile?.billingAddress?.postalCode || ''}"
                       placeholder="123-4567"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>東京都</option>
                  <option>大阪府</option>
                  <option>愛知県</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">国</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>日本</option>
                  <option>アメリカ</option>
                  <option>その他</option>
                </select>
              </div>
            </form>
            
            <div class="mt-6 pt-6 border-t">
              <button class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-save mr-2"></i>
                請求先情報を保存
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachOverviewEventListeners();
  }

  private renderPaymentMethodList(methods: PaymentMethod[]): string {
    return `
      <div class="space-y-4">
        ${methods.map(method => `
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center">
              <div class="p-2 bg-gray-100 rounded-lg">
                <i class="fas fa-credit-card text-gray-600"></i>
              </div>
              <div class="ml-4">
                <p class="font-medium text-gray-900">
                  ${method.brand.toUpperCase()} •••• ${method.last4}
                </p>
                <p class="text-sm text-gray-500">
                  有効期限: ${method.expiryMonth}/${method.expiryYear}
                  ${method.isDefault ? ' • デフォルト' : ''}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              ${!method.isDefault ? `
                <button class="text-primary-600 text-sm hover:text-primary-800">
                  デフォルト設定
                </button>
              ` : ''}
              <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-edit"></i>
              </button>
              <button class="text-red-400 hover:text-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderEmptyPaymentMethods(): string {
    return `
      <div class="text-center py-8">
        <i class="fas fa-credit-card text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">決済方法が登録されていません</h3>
        <p class="text-gray-500 mb-4">サービスの利用料金を支払うための決済方法を追加してください</p>
        <button onclick="this.showAddPaymentMethodModal()" 
                class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
          <i class="fas fa-plus mr-2"></i>
          決済方法を追加
        </button>
      </div>
    `;
  }

  private renderConnectedServiceList(services: ConnectedService[]): string {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${services.map(service => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <i class="fas ${this.getServiceIcon(service.serviceType)} text-blue-600"></i>
                </div>
                <div class="ml-3">
                  <h4 class="font-medium text-gray-900">${service.serviceName}</h4>
                  <p class="text-sm text-gray-500">${this.getServiceTypeLabel(service.serviceType)}</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }">
                  ${service.isActive ? 'アクティブ' : '停止中'}
                </span>
                <button class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-cog"></i>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              ${service.monthlyFee 
                ? `月額: ¥${service.monthlyFee.toLocaleString()}`
                : service.usageBasedPricing 
                  ? `従量課金: ¥${service.usageBasedPricing.pricePerUnit}/${service.usageBasedPricing.unit}`
                  : '無料プラン'
              }
            </div>
            <div class="text-xs text-gray-500 mt-1">
              接続日: ${new Date(service.connectedAt).toLocaleDateString('ja-JP')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderEmptyServices(): string {
    return `
      <div class="text-center py-8">
        <i class="fas fa-plug text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">連携サービスがありません</h3>
        <p class="text-gray-500 mb-4">プラットフォーム上のサービスと連携して機能を拡張しましょう</p>
        <button onclick="this.showServiceMarketplace()" 
                class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
          <i class="fas fa-store mr-2"></i>
          サービスマーケットプレイスを見る
        </button>
      </div>
    `;
  }

  private async renderPaymentMethods(container: HTMLElement): Promise<void> {
    await this.loadPaymentProfile();

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-credit-card mr-3 text-primary-600"></i>
              決済方法管理
            </h1>
            <p class="mt-2 text-gray-600">
              登録された決済方法を管理します
            </p>
          </div>
          <button onclick="this.showAddPaymentMethodModal()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            新しい決済方法を追加
          </button>
        </div>

        <!-- Payment Methods List -->
        <div class="space-y-6">
          ${this.paymentProfile?.paymentMethods.map(method => `
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="p-3 bg-gray-100 rounded-lg">
                    <i class="fas fa-credit-card text-2xl text-gray-600"></i>
                  </div>
                  <div class="ml-4">
                    <h3 class="text-lg font-medium text-gray-900">
                      ${method.brand.toUpperCase()} •••• ${method.last4}
                    </h3>
                    <p class="text-sm text-gray-500">
                      有効期限: ${method.expiryMonth}/${method.expiryYear}
                    </p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  ${method.isDefault ? `
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <i class="fas fa-check-circle mr-1"></i>
                      デフォルト
                    </span>
                  ` : `
                    <button class="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      デフォルトに設定
                    </button>
                  `}
                  <button class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">カード種別</p>
                  <p class="font-medium">${method.type === 'card' ? 'クレジットカード' : method.type}</p>
                </div>
                <div>
                  <p class="text-gray-500">登録日</p>
                  <p class="font-medium">${new Date(method.createdAt).toLocaleDateString('ja-JP')}</p>
                </div>
                <div>
                  <p class="text-gray-500">最終使用</p>
                  <p class="font-medium">${new Date(method.updatedAt).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
            </div>
          `).join('') || '<p class="text-gray-500 text-center py-8">決済方法が登録されていません</p>'}
        </div>

        <!-- Add Payment Method Form -->
        <div class="mt-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">新しい決済方法を追加</h3>
          <form class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">カード番号</label>
                <input type="text" placeholder="1234 5678 9012 3456" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">カード名義</label>
                <input type="text" placeholder="TARO YAMADA" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">有効期限（月）</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  ${Array.from({length: 12}, (_, i) => i + 1).map(month => 
                    `<option value="${month}">${month.toString().padStart(2, '0')}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">有効期限（年）</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  ${Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => 
                    `<option value="${year}">${year}</option>`
                  ).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">セキュリティコード</label>
                <input type="text" placeholder="123" maxlength="4"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
            </div>
            <div class="flex items-center">
              <input type="checkbox" id="set-default" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500">
              <label for="set-default" class="ml-2 text-sm text-gray-700">この決済方法をデフォルトに設定</label>
            </div>
            <div class="pt-4">
              <button type="submit" class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-plus mr-2"></i>
                決済方法を追加
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachPaymentMethodEventListeners();
  }

  private async renderConnectedServices(container: HTMLElement): Promise<void> {
    await this.loadPaymentProfile();
    const availableServices = await this.loadAvailableServices();

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-plug mr-3 text-primary-600"></i>
            サービス連携
          </h1>
          <p class="mt-2 text-gray-600">
            プラットフォーム上のサービスと連携して機能を拡張できます
          </p>
        </div>

        <!-- Connected Services -->
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">連携中のサービス</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.paymentProfile?.connectedServices.map(service => `
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center">
                    <div class="p-2 bg-blue-100 rounded-lg">
                      <i class="fas ${this.getServiceIcon(service.serviceType)} text-blue-600"></i>
                    </div>
                    <div class="ml-3">
                      <h3 class="font-medium text-gray-900">${service.serviceName}</h3>
                      <p class="text-sm text-gray-500">${this.getServiceTypeLabel(service.serviceType)}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                      ${service.isActive ? 'アクティブ' : '停止中'}
                    </span>
                  </div>
                </div>
                
                <div class="space-y-2 text-sm">
                  ${service.monthlyFee ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">月額料金:</span>
                      <span class="font-medium">¥${service.monthlyFee.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  
                  ${service.usageBasedPricing ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">従量課金:</span>
                      <span class="font-medium">¥${service.usageBasedPricing.pricePerUnit}/${service.usageBasedPricing.unit}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">無料枠:</span>
                      <span class="font-medium">${service.usageBasedPricing.includedUnits} ${service.usageBasedPricing.unit}</span>
                    </div>
                  ` : ''}
                  
                  <div class="flex justify-between">
                    <span class="text-gray-600">接続日:</span>
                    <span class="font-medium">${new Date(service.connectedAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                  
                  ${service.lastBilledAt ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">最終請求:</span>
                      <span class="font-medium">${new Date(service.lastBilledAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                  ` : ''}
                </div>
                
                <div class="mt-4 flex space-x-2">
                  <button class="flex-1 text-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    <i class="fas fa-cog mr-1"></i>
                    設定
                  </button>
                  <button class="px-3 py-2 text-sm ${service.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded-md">
                    ${service.isActive ? '停止' : '再開'}
                  </button>
                </div>
              </div>
            `).join('') || '<p class="text-gray-500 col-span-3 text-center py-8">連携中のサービスはありません</p>'}
          </div>
        </div>

        <!-- Available Services -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">利用可能なサービス</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${availableServices.map(service => `
              <div class="bg-white rounded-lg shadow p-6 border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors">
                <div class="text-center">
                  <div class="p-3 bg-primary-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <i class="fas ${this.getServiceIcon(service.type)} text-2xl text-primary-600"></i>
                  </div>
                  <h3 class="font-medium text-gray-900 mb-2">${service.name}</h3>
                  <p class="text-sm text-gray-600 mb-4">${service.description}</p>
                  
                  <div class="space-y-2 text-sm mb-4">
                    ${service.pricing.free ? `
                      <div class="text-green-600 font-medium">無料プランあり</div>
                    ` : ''}
                    ${service.pricing.monthly ? `
                      <div>月額: ¥${service.pricing.monthly.toLocaleString()}〜</div>
                    ` : ''}
                    ${service.pricing.perUnit ? `
                      <div>従量課金: ¥${service.pricing.perUnit}/${service.pricing.unit}</div>
                    ` : ''}
                  </div>
                  
                  <button onclick="this.connectService('${service.id}')" 
                          class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    連携する
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachServicesEventListeners();
  }

  private async renderPaymentHistory(container: HTMLElement): Promise<void> {
    const paymentHistory = await this.loadPaymentHistory();

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-history mr-3 text-primary-600"></i>
            支払い履歴
          </h1>
          <p class="mt-2 text-gray-600">
            あなたの支払い履歴を確認できます
          </p>
        </div>

        <!-- Payment Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-yen-sign text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月の支払い</p>
                <p class="text-2xl font-bold text-gray-900">¥${paymentHistory.stats.thisMonth.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-calendar-alt text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">年間支払い</p>
                <p class="text-2xl font-bold text-gray-900">¥${paymentHistory.stats.thisYear.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-hashtag text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">取引回数</p>
                <p class="text-2xl font-bold text-gray-900">${paymentHistory.stats.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-calculator text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">平均支払額</p>
                <p class="text-2xl font-bold text-gray-900">¥${paymentHistory.stats.averageAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">期間（開始）</label>
              <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">期間（終了）</label>
              <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">サービス</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">全てのサービス</option>
                <option value="analytics">Analytics Pro</option>
                <option value="storage">Cloud Storage</option>
                <option value="api">API Gateway</option>
              </select>
            </div>
            <div class="flex items-end">
              <button class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-search mr-2"></i>
                検索
              </button>
            </div>
          </div>
        </div>

        <!-- Payment History Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支払い日</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サービス</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">決済方法</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">レシート</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${paymentHistory.payments.map(payment => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(payment.date).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="p-1 bg-gray-100 rounded">
                          <i class="fas ${this.getServiceIcon(payment.serviceType)} text-gray-600"></i>
                        </div>
                        <div class="ml-3">
                          <div class="text-sm font-medium text-gray-900">${payment.serviceName}</div>
                          <div class="text-sm text-gray-500">${payment.description}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${payment.amount.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payment.paymentMethod}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }">
                        ${payment.status === 'completed' ? '完了' : '失敗'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-download mr-1"></i>
                        ダウンロード
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachHistoryEventListeners();
  }

  // Data loading methods
  private async loadPaymentProfile(): Promise<void> {
    try {
      const response = await this.apiService.call('GET', '/user/payment-profile');
      this.paymentProfile = response.data;
    } catch (error) {
      console.error('Failed to load payment profile:', error);
      // Use mock data
      this.paymentProfile = {
        userId: this.currentUser?.id || '',
        paymentMethods: [
          {
            id: 'pm_demo_visa',
            tenantId: '',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          }
        ],
        connectedServices: [
          {
            id: 'cs_analytics_pro',
            serviceName: 'Analytics Pro',
            serviceType: 'subscription',
            isActive: true,
            monthlyFee: 2980,
            connectedAt: '2024-01-01T00:00:00Z',
            lastBilledAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'cs_cloud_storage',
            serviceName: 'Cloud Storage',
            serviceType: 'subscription',
            isActive: true,
            usageBasedPricing: {
              unit: 'GB',
              pricePerUnit: 10,
              includedUnits: 100
            },
            connectedAt: '2024-01-10T00:00:00Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      };
    }
  }

  private async loadAvailableServices(): Promise<any[]> {
    const response = await this.apiService.call('GET', '/marketplace/services');
    return response.data || [
      {
        id: 'svc_api_gateway',
        name: 'API Gateway',
        description: '高性能なAPIゲートウェイサービス',
        type: 'api',
        pricing: {
          free: true,
          monthly: 1980,
          perUnit: 0.1,
          unit: 'リクエスト'
        }
      },
      {
        id: 'svc_monitoring',
        name: 'Advanced Monitoring',
        description: 'リアルタイム監視とアラート機能',
        type: 'monitoring',
        pricing: {
          monthly: 4980
        }
      },
      {
        id: 'svc_backup',
        name: 'Automated Backup',
        description: '自動バックアップとリストア機能',
        type: 'backup',
        pricing: {
          free: true,
          monthly: 980
        }
      }
    ];
  }

  private async loadPaymentHistory(): Promise<any> {
    const response = await this.apiService.call('GET', '/user/payment-history');
    return response.data || {
      stats: {
        thisMonth: 12500,
        thisYear: 89600,
        totalTransactions: 24,
        averageAmount: 3733
      },
      payments: [
        {
          id: 'pay_001',
          date: '2024-01-15T00:00:00Z',
          serviceName: 'Analytics Pro',
          serviceType: 'subscription',
          description: '月額サブスクリプション',
          amount: 2980,
          paymentMethod: 'VISA •••• 4242',
          status: 'completed'
        },
        {
          id: 'pay_002',
          date: '2024-01-10T00:00:00Z',
          serviceName: 'Cloud Storage',
          serviceType: 'subscription',
          description: 'ストレージ使用料',
          amount: 1200,
          paymentMethod: 'VISA •••• 4242',
          status: 'completed'
        }
      ]
    };
  }

  // Helper methods
  private getServiceIcon(type: string): string {
    const icons: Record<string, string> = {
      'subscription': 'fa-calendar-alt',
      'marketplace': 'fa-store',
      'api': 'fa-code',
      'integration': 'fa-plug',
      'monitoring': 'fa-chart-line',
      'backup': 'fa-shield-alt'
    };
    return icons[type] || 'fa-cog';
  }

  private getServiceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'subscription': 'サブスクリプション',
      'marketplace': 'マーケットプレイス',
      'api': 'API サービス',
      'integration': '統合サービス',
      'monitoring': 'モニタリング',
      'backup': 'バックアップ'
    };
    return labels[type] || type;
  }

  // Event listeners
  private attachOverviewEventListeners(): void {
    // Add event listeners for overview interactions
  }

  private attachPaymentMethodEventListeners(): void {
    // Add event listeners for payment method management
  }

  private attachServicesEventListeners(): void {
    // Add event listeners for service management
  }

  private attachHistoryEventListeners(): void {
    // Add event listeners for history interactions
  }
}