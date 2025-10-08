import type { User, PaymentSchedule, FeeStructure, PlatformTransaction } from '../types';
import { ApiService } from '../services/ApiService';

export class AdminPaymentComponent {
  private currentUser: User | null;
  private currentView: string;
  private apiService: ApiService;

  constructor(apiService: ApiService, currentUser: User | null) {
    this.apiService = apiService;
    this.currentUser = currentUser;
    this.currentView = 'schedule';
  }

  async render(container: HTMLElement, view: string = 'schedule'): Promise<void> {
    if (!container) return;

    this.currentView = view;

    switch (view) {
      case 'schedule':
        await this.renderPaymentSchedule(container);
        break;
      case 'fees':
        await this.renderFeeManagement(container);
        break;
      case 'transactions':
        await this.renderPlatformTransactions(container);
        break;
      case 'analytics':
        await this.renderPaymentAnalytics(container);
        break;
      default:
        await this.renderPaymentSchedule(container);
    }
  }

  private async renderPaymentSchedule(container: HTMLElement): Promise<void> {
    const schedules = await this.loadPaymentSchedules();
    
    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-calendar-alt mr-3 text-primary-600"></i>
              支払いスケジュール管理
            </h1>
            <p class="mt-2 text-gray-600">
              プラットフォーム全体の支払いスケジュールを管理します
            </p>
          </div>
          <button onclick="this.showCreateScheduleModal()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            新規スケジュール作成
          </button>
        </div>

        <!-- Schedule Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-clock text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">予定支払い</p>
                <p class="text-2xl font-bold text-gray-900">¥${(schedules.stats.pendingAmount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-calendar-check text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月処理済み</p>
                <p class="text-2xl font-bold text-gray-900">${schedules.stats.processedCount || 0}件</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">要確認</p>
                <p class="text-2xl font-bold text-gray-900">${schedules.stats.pendingReviewCount || 0}件</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-red-100 rounded-lg">
                <i class="fas fa-times-circle text-red-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">失敗</p>
                <p class="text-2xl font-bold text-gray-900">${schedules.stats.failedCount || 0}件</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">全て</option>
                <option value="pending">予定</option>
                <option value="processed">処理済み</option>
                <option value="failed">失敗</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">テナント</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">全テナント</option>
                <option value="abc-corp">ABC Corporation</option>
                <option value="xyz-inc">XYZ Inc</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">支払い方法</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">全て</option>
                <option value="bank_transfer">銀行振込</option>
                <option value="credit_card">クレジットカード</option>
                <option value="auto_debit">自動引き落とし</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">期間</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="week">今週</option>
                <option value="month">今月</option>
                <option value="quarter">今四半期</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Payment Schedule Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">支払いスケジュール</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払い予定日
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    テナント
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払い方法
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${schedules.data.map(schedule => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(schedule.scheduledDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span class="text-primary-600 text-sm font-medium">${schedule.tenantName.charAt(0)}</span>
                        </div>
                        <div class="ml-3">
                          <div class="text-sm font-medium text-gray-900">${schedule.tenantName}</div>
                          <div class="text-sm text-gray-500">${schedule.tenantId}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${schedule.amount.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${this.getPaymentMethodLabel(schedule.paymentMethod)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusStyle(schedule.status)}">
                        ${this.getStatusLabel(schedule.status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-indigo-600 hover:text-indigo-900 mr-3">編集</button>
                      <button class="text-red-600 hover:text-red-900">削除</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachScheduleEventListeners();
  }

  private async renderFeeManagement(container: HTMLElement): Promise<void> {
    const feeStructure = await this.loadFeeStructure();

    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-percentage mr-3 text-primary-600"></i>
              手数料管理
            </h1>
            <p class="mt-2 text-gray-600">
              プラットフォームの手数料体系を管理します
            </p>
          </div>
          <button onclick="this.showCreateFeeModal()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            新規手数料設定
          </button>
        </div>

        <!-- Fee Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-yen-sign text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月の手数料収益</p>
                <p class="text-2xl font-bold text-gray-900">¥${(feeStructure.monthlyRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-chart-line text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">平均手数料率</p>
                <p class="text-2xl font-bold text-gray-900">${feeStructure.averageFeeRate || 0}%</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-building text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">アクティブテナント</p>
                <p class="text-2xl font-bold text-gray-900">${feeStructure.activeTenants || 0}社</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fee Structure Settings -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Transaction Fees -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">取引手数料</h3>
            <div class="space-y-4">
              ${feeStructure.transactionFees.map(fee => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">${fee.name}</p>
                    <p class="text-sm text-gray-500">${fee.description}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-lg text-gray-900">${fee.rate}%</p>
                    <button class="text-primary-600 text-sm hover:text-primary-800">編集</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Subscription Fees -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">月額手数料</h3>
            <div class="space-y-4">
              ${feeStructure.subscriptionFees.map(fee => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">${fee.planName}</p>
                    <p class="text-sm text-gray-500">${fee.description}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-lg text-gray-900">¥${fee.monthlyFee.toLocaleString()}</p>
                    <button class="text-primary-600 text-sm hover:text-primary-800">編集</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Fee History -->
        <div class="mt-8 bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">手数料変更履歴</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">変更日</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手数料種別</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">変更前</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">変更後</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">変更者</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${feeStructure.history.map(item => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(item.changedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.feeType}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.previousValue}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.newValue}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.changedBy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachFeeEventListeners();
  }

  private async renderPlatformTransactions(container: HTMLElement): Promise<void> {
    const transactions = await this.loadPlatformTransactions();

    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-exchange-alt mr-3 text-primary-600"></i>
            プラットフォーム取引履歴
          </h1>
          <p class="mt-2 text-gray-600">
            プラットフォーム全体の取引履歴と手数料収益を管理します
          </p>
        </div>

        <!-- Transaction Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-coins text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今日の取引額</p>
                <p class="text-2xl font-bold text-gray-900">¥${(transactions.stats.todayVolume || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-chart-bar text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今日の取引件数</p>
                <p class="text-2xl font-bold text-gray-900">${transactions.stats.todayCount || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-percentage text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">手数料収益</p>
                <p class="text-2xl font-bold text-gray-900">¥${(transactions.stats.feeRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-red-100 rounded-lg">
                <i class="fas fa-exclamation-circle text-red-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">失敗取引</p>
                <p class="text-2xl font-bold text-gray-900">${transactions.stats.failedCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters and Export -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex justify-between items-end">
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">期間</label>
                <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">〜</label>
                <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">テナント</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">全テナント</option>
                  <option value="abc-corp">ABC Corporation</option>
                  <option value="xyz-inc">XYZ Inc</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">全て</option>
                  <option value="completed">完了</option>
                  <option value="pending">処理中</option>
                  <option value="failed">失敗</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">金額</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">全て</option>
                  <option value="small">1万円未満</option>
                  <option value="medium">1万円〜10万円</option>
                  <option value="large">10万円以上</option>
                </select>
              </div>
            </div>
            <div class="ml-4">
              <button class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                <i class="fas fa-download mr-2"></i>
                CSV出力
              </button>
            </div>
          </div>
        </div>

        <!-- Transaction Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取引日時</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取引ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">テナント</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手数料</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${transactions.data.map(tx => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(tx.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      ${tx.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${tx.tenantName}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${tx.amount.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${tx.platformFee.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getTransactionStatusStyle(tx.status)}">
                        ${this.getTransactionStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-indigo-600 hover:text-indigo-900">詳細</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachTransactionEventListeners();
  }

  private async renderPaymentAnalytics(container: HTMLElement): Promise<void> {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-chart-pie mr-3 text-primary-600"></i>
            決済分析
          </h1>
          <p class="mt-2 text-gray-600">
            プラットフォームの決済状況を分析します
          </p>
        </div>

        <!-- Analytics Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Revenue Chart -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">月次収益推移</h3>
            <div class="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div class="text-center">
                <i class="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">Chart.js グラフ表示予定</p>
              </div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">決済手段別利用状況</h3>
            <div class="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div class="text-center">
                <i class="fas fa-chart-pie text-4xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">Chart.js 円グラフ表示予定</p>
              </div>
            </div>
          </div>

          <!-- Tenant Performance -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">テナント別売上ランキング</h3>
            <div class="h-64 overflow-y-auto">
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-gold-50 rounded-lg border border-gold-200">
                  <div class="flex items-center">
                    <span class="w-6 h-6 bg-gold-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                    <span class="font-medium">ABC Corporation</span>
                  </div>
                  <span class="font-bold text-gray-900">¥15,500,000</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <span class="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</span>
                    <span class="font-medium">XYZ Inc</span>
                  </div>
                  <span class="font-bold text-gray-900">¥12,300,000</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <span class="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</span>
                    <span class="font-medium">Demo Company</span>
                  </div>
                  <span class="font-bold text-gray-900">¥8,900,000</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Metrics -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">主要指標</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">平均取引額</span>
                <span class="text-lg font-bold text-blue-600">¥125,400</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">成功率</span>
                <span class="text-lg font-bold text-green-600">98.7%</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">月次成長率</span>
                <span class="text-lg font-bold text-purple-600">+12.5%</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">チャージバック率</span>
                <span class="text-lg font-bold text-yellow-600">0.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Helper methods
  private async loadPaymentSchedules(): Promise<any> {
    const response = await this.apiService.call('GET', '/admin/payment-schedules');
    return response.data || {
      stats: {
        pendingAmount: 2450000,
        processedCount: 156,
        pendingReviewCount: 8,
        failedCount: 3
      },
      data: []
    };
  }

  private async loadFeeStructure(): Promise<any> {
    const response = await this.apiService.call('GET', '/admin/fee-structure');
    return response.data || {
      monthlyRevenue: 1250000,
      averageFeeRate: 3.2,
      activeTenants: 45,
      transactionFees: [],
      subscriptionFees: [],
      history: []
    };
  }

  private async loadPlatformTransactions(): Promise<any> {
    const response = await this.apiService.call('GET', '/admin/platform-transactions');
    return response.data || {
      stats: {
        todayVolume: 5420000,
        todayCount: 89,
        feeRevenue: 173440,
        failedCount: 2
      },
      data: []
    };
  }

  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'bank_transfer': '銀行振込',
      'credit_card': 'クレジットカード',
      'auto_debit': '自動引き落とし'
    };
    return labels[method] || method;
  }

  private getStatusStyle(status: string): string {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': '予定',
      'processed': '処理済み',
      'failed': '失敗'
    };
    return labels[status] || status;
  }

  private getTransactionStatusStyle(status: string): string {
    const styles: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  private getTransactionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': '完了',
      'pending': '処理中',
      'failed': '失敗'
    };
    return labels[status] || status;
  }

  private attachScheduleEventListeners(): void {
    // Add event listeners for schedule management
  }

  private attachFeeEventListeners(): void {
    // Add event listeners for fee management
  }

  private attachTransactionEventListeners(): void {
    // Add event listeners for transaction management
  }
}