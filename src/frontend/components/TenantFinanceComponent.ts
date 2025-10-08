import type { User, TenantFinancials, PayoutRequest, PlatformTransaction } from '../types';
import { ApiService } from '../services/ApiService';

export class TenantFinanceComponent {
  private currentUser: User | null;
  private currentView: string;
  private apiService: ApiService;
  private financials: TenantFinancials | null = null;

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
        await this.renderFinancialOverview(container);
        break;
      case 'transactions':
        await this.renderTransactionHistory(container);
        break;
      case 'payouts':
        await this.renderPayoutManagement(container);
        break;
      case 'settings':
        await this.renderPaymentSettings(container);
        break;
      default:
        await this.renderFinancialOverview(container);
    }
  }

  private async renderFinancialOverview(container: HTMLElement): Promise<void> {
    await this.loadFinancialData();

    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-wallet mr-3 text-primary-600"></i>
              財務概要
            </h1>
            <p class="mt-2 text-gray-600">
              ${this.currentUser?.tenantName || 'あなたの組織'}の入出金状況を管理します
            </p>
          </div>
          <button onclick="this.requestPayout()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            <i class="fas fa-arrow-up mr-2"></i>
            出金申請
          </button>
        </div>

        <!-- Balance Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">利用可能残高</p>
                <p class="text-3xl font-bold">¥${(this.financials?.availableBalance || 0).toLocaleString()}</p>
                <p class="text-green-100 text-xs mt-2">即座に出金可能</p>
              </div>
              <div class="p-3 bg-green-500 bg-opacity-30 rounded-full">
                <i class="fas fa-coins text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-yellow-100 text-sm font-medium">保留中残高</p>
                <p class="text-3xl font-bold">¥${(this.financials?.pendingBalance || 0).toLocaleString()}</p>
                <p class="text-yellow-100 text-xs mt-2">処理中の取引</p>
              </div>
              <div class="p-3 bg-yellow-500 bg-opacity-30 rounded-full">
                <i class="fas fa-hourglass-half text-2xl"></i>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">今月の売上</p>
                <p class="text-3xl font-bold">¥${(this.financials?.monthlyRevenue || 0).toLocaleString()}</p>
                <p class="text-blue-100 text-xs mt-2">前月比 +12.5%</p>
              </div>
              <div class="p-3 bg-blue-500 bg-opacity-30 rounded-full">
                <i class="fas fa-chart-line text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">クイックアクション</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onclick="this.requestPayout()" 
                    class="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-arrow-up text-2xl text-gray-400 mb-2"></i>
                <p class="text-sm font-medium text-gray-700">出金申請</p>
              </div>
            </button>
            <button onclick="this.showTransactionHistory()" 
                    class="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-history text-2xl text-gray-400 mb-2"></i>
                <p class="text-sm font-medium text-gray-700">取引履歴</p>
              </div>
            </button>
            <button onclick="this.downloadReport()" 
                    class="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-download text-2xl text-gray-400 mb-2"></i>
                <p class="text-sm font-medium text-gray-700">レポート出力</p>
              </div>
            </button>
            <button onclick="this.showPaymentSettings()" 
                    class="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
              <div class="text-center">
                <i class="fas fa-cog text-2xl text-gray-400 mb-2"></i>
                <p class="text-sm font-medium text-gray-700">決済設定</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Recent Transactions & Payout Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Transactions -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">最近の取引</h3>
              <button onclick="window.location.hash='tenant-finance/transactions'" class="text-primary-600 text-sm hover:text-primary-800">
                全て表示
              </button>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div class="flex items-center">
                    <div class="p-2 bg-green-100 rounded-full">
                      <i class="fas fa-arrow-down text-green-600 text-sm"></i>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">サブスクリプション料金</p>
                      <p class="text-xs text-gray-500">2024-01-15 14:30</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-green-600">+¥12,000</p>
                    <p class="text-xs text-gray-500">完了</p>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-center">
                    <div class="p-2 bg-yellow-100 rounded-full">
                      <i class="fas fa-clock text-yellow-600 text-sm"></i>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">API利用料金</p>
                      <p class="text-xs text-gray-500">2024-01-15 12:15</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-yellow-600">+¥8,500</p>
                    <p class="text-xs text-gray-500">処理中</p>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div class="flex items-center">
                    <div class="p-2 bg-blue-100 rounded-full">
                      <i class="fas fa-arrow-down text-blue-600 text-sm"></i>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">ワンタイム購入</p>
                      <p class="text-xs text-gray-500">2024-01-14 18:45</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-blue-600">+¥25,000</p>
                    <p class="text-xs text-gray-500">完了</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payout Status -->
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">出金申請状況</h3>
              <button onclick="window.location.hash='tenant-finance/payouts'" class="text-primary-600 text-sm hover:text-primary-800">
                全て表示
              </button>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">出金申請 #PR-001</p>
                    <p class="text-xs text-gray-500">2024-01-10 申請</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-gray-900">¥150,000</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      完了
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p class="text-sm font-medium text-gray-900">出金申請 #PR-002</p>
                    <p class="text-xs text-gray-500">2024-01-14 申請</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-gray-900">¥200,000</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      審査中
                    </span>
                  </div>
                </div>

                <div class="text-center p-4">
                  <button onclick="this.requestPayout()" 
                          class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    新規出金申請
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachOverviewEventListeners();
  }

  private async renderTransactionHistory(container: HTMLElement): Promise<void> {
    const transactions = await this.loadTransactionHistory();

    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-history mr-3 text-primary-600"></i>
            取引履歴
          </h1>
          <p class="mt-2 text-gray-600">
            ${this.currentUser?.tenantName || 'あなたの組織'}の全取引履歴を確認できます
          </p>
        </div>

        <!-- Transaction Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-arrow-up text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月の売上</p>
                <p class="text-2xl font-bold text-gray-900">¥${transactions.stats.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-hashtag text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">取引件数</p>
                <p class="text-2xl font-bold text-gray-900">${transactions.stats.transactionCount}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-calculator text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">平均取引額</p>
                <p class="text-2xl font-bold text-gray-900">¥${transactions.stats.averageAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-percentage text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">プラットフォーム手数料</p>
                <p class="text-2xl font-bold text-gray-900">¥${transactions.stats.platformFees.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">期間（開始）</label>
              <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">期間（終了）</label>
              <input type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">取引種別</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">全て</option>
                <option value="payment">支払い</option>
                <option value="refund">返金</option>
                <option value="chargeback">チャージバック</option>
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
            <div class="flex items-end">
              <button class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-search mr-2"></i>
                検索
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
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
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
                      ${this.getTransactionTypeLabel(tx.type)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${tx.amount.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          
          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                表示中: 1-20 / 全${transactions.total}件
              </div>
              <div class="flex space-x-2">
                <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">前</button>
                <button class="px-3 py-1 text-sm bg-primary-600 text-white rounded">1</button>
                <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">2</button>
                <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">次</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachTransactionEventListeners();
  }

  private async renderPayoutManagement(container: HTMLElement): Promise<void> {
    const payouts = await this.loadPayoutRequests();

    container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-arrow-up mr-3 text-primary-600"></i>
              出金管理
            </h1>
            <p class="mt-2 text-gray-600">
              出金申請の管理と銀行口座設定を行います
            </p>
          </div>
          <button onclick="this.showPayoutRequestModal()" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            新規出金申請
          </button>
        </div>

        <!-- Payout Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">出金済み総額</p>
                <p class="text-2xl font-bold text-gray-900">¥${payouts.stats.totalPaidOut.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <i class="fas fa-clock text-yellow-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">申請中</p>
                <p class="text-2xl font-bold text-gray-900">¥${payouts.stats.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <i class="fas fa-calendar text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">今月の出金</p>
                <p class="text-2xl font-bold text-gray-900">${payouts.stats.monthlyPayouts}件</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <i class="fas fa-hourglass text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">平均処理時間</p>
                <p class="text-2xl font-bold text-gray-900">${payouts.stats.avgProcessingDays}日</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payout Requests Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">出金申請履歴</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請日</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">振込先</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">処理日</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${payouts.data.map(payout => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(payout.requestedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      ${payout.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥${payout.amount.toLocaleString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payout.bankAccount.bankName}<br>
                      <span class="text-xs">****${payout.bankAccount.accountNumber.slice(-4)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPayoutStatusStyle(payout.status)}">
                        ${this.getPayoutStatusLabel(payout.status)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${payout.processedAt ? new Date(payout.processedAt).toLocaleDateString('ja-JP') : '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      ${payout.status === 'pending' 
                        ? '<button class="text-red-600 hover:text-red-900">キャンセル</button>'
                        : '<button class="text-indigo-600 hover:text-indigo-900">詳細</button>'
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Bank Account Settings -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">銀行口座設定</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">銀行名</label>
              <input type="text" placeholder="例: 三菱UFJ銀行" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">支店名</label>
              <input type="text" placeholder="例: 新宿支店" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">口座種別</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>普通</option>
                <option>当座</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">口座番号</label>
              <input type="text" placeholder="例: 1234567" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">口座名義</label>
              <input type="text" placeholder="例: カブシキガイシャ エービーシー" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
              <i class="fas fa-save mr-2"></i>
              口座情報を保存
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachPayoutEventListeners();
  }

  private async renderPaymentSettings(container: HTMLElement): Promise<void> {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-cog mr-3 text-primary-600"></i>
            決済設定
          </h1>
          <p class="mt-2 text-gray-600">
            決済と出金に関する設定を管理します
          </p>
        </div>

        <!-- Auto Payout Settings -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">自動出金設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">自動出金を有効にする</p>
                <p class="text-sm text-gray-600">設定した条件に達したときに自動的に出金申請を行います</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">最小出金額</label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-500">¥</span>
                  <input type="number" placeholder="100000" 
                         class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">出金スケジュール</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>毎週</option>
                  <option>隔週</option>
                  <option>毎月</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">取引完了通知</p>
                <p class="text-sm text-gray-600">取引が完了した際にメール通知を受け取ります</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">出金状況通知</p>
                <p class="text-sm text-gray-600">出金申請の状況が変更された際に通知を受け取ります</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">残高アラート</p>
                <p class="text-sm text-gray-600">残高が設定額を超えた際に通知を受け取ります</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- API Settings -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">API設定</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input type="url" placeholder="https://your-domain.com/webhook" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              <p class="mt-1 text-xs text-gray-500">決済イベントの通知を受信するURLを設定してください</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">APIキー</label>
              <div class="flex space-x-2">
                <input type="password" value="sk_live_************************" 
                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50" readonly>
                <button class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t flex justify-end">
            <button class="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors">
              <i class="fas fa-save mr-2"></i>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachSettingsEventListeners();
  }

  // Data loading methods
  private async loadFinancialData(): Promise<void> {
    try {
      const response = await this.apiService.call('GET', '/tenant/financials');
      this.financials = response.data;
    } catch (error) {
      console.error('Failed to load financial data:', error);
      // Use mock data
      this.financials = {
        tenantId: this.currentUser?.tenantId || '',
        availableBalance: 850000,
        pendingBalance: 125000,
        totalRevenue: 12500000,
        monthlyRevenue: 2350000,
        currency: 'JPY',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async loadTransactionHistory(): Promise<any> {
    const response = await this.apiService.call('GET', '/tenant/transactions');
    return response.data || {
      stats: {
        monthlyRevenue: 2350000,
        transactionCount: 156,
        averageAmount: 15064,
        platformFees: 75200
      },
      data: [],
      total: 156
    };
  }

  private async loadPayoutRequests(): Promise<any> {
    const response = await this.apiService.call('GET', '/tenant/payouts');
    return response.data || {
      stats: {
        totalPaidOut: 8500000,
        pendingAmount: 200000,
        monthlyPayouts: 4,
        avgProcessingDays: 2
      },
      data: []
    };
  }

  // Helper methods
  private getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'payment': '支払い',
      'refund': '返金',
      'chargeback': 'チャージバック',
      'withdrawal': '出金'
    };
    return labels[type] || type;
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

  private getPayoutStatusStyle(status: string): string {
    const styles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  private getPayoutStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': '申請中',
      'approved': '承認済み',
      'completed': '完了',
      'rejected': '却下'
    };
    return labels[status] || status;
  }

  // Event listeners
  private attachOverviewEventListeners(): void {
    // Add event listeners for overview interactions
  }

  private attachTransactionEventListeners(): void {
    // Add event listeners for transaction management
  }

  private attachPayoutEventListeners(): void {
    // Add event listeners for payout management
  }

  private attachSettingsEventListeners(): void {
    // Add event listeners for settings management
  }
}