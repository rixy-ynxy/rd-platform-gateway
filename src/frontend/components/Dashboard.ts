import type { User, DashboardStats, Activity } from '../types';
import { ApiService } from '../services/ApiService';

export class Dashboard {
  private apiService: ApiService;
  private currentUser: User;

  constructor(apiService: ApiService, currentUser: User) {
    this.apiService = apiService;
    this.currentUser = currentUser;
  }

  async render(container: HTMLElement): Promise<void> {
    console.log('📊 Rendering dashboard...');
    
    // Show welcome message immediately
    this.renderWelcomeMessage(container);

    try {
      // Fetch dashboard stats in background
      const statsResponse = await this.apiService.call('GET', '/dashboard/stats', { 
        tenantId: this.currentUser.tenantId 
      });
      
      if (!statsResponse.success) {
        throw new Error(statsResponse.error);
      }

      const stats = statsResponse.data;
      
      container.innerHTML = `
        <!-- Welcome Message -->
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg mb-8 border border-primary-100">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-primary-900 mb-2">
                👋 ようこそ、${this.currentUser.name}さん
              </h2>
              <p class="text-primary-700 text-sm">
                ${this.currentUser.tenantName || 'Platform Gateway'} のダッシュボードです。
                重要な指標とシステムの状況をリアルタイムで確認できます。
              </p>
            </div>
            <button onclick="window.HelpGuide.show('dashboard')" 
                    class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center">
              <i class="fas fa-question-circle mr-2"></i>
              使い方ガイド
            </button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <i class="fas fa-chart-bar text-primary-600 mr-2"></i>
            主要指標
            <span class="ml-2 text-sm font-normal text-gray-500">（リアルタイム更新）</span>
          </h3>
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          ${this.renderStatsCards(stats)}
        </div>

        <!-- Charts and Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Usage Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title flex items-center">
                <i class="fas fa-chart-line text-green-600 mr-2"></i>
                API使用状況 (過去30日間)
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                日別のAPI呼び出し数の推移を確認できます
              </p>
            </div>
            <div class="chart-container">
              <canvas id="usage-chart"></canvas>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title flex items-center">
                <i class="fas fa-history text-warning-600 mr-2"></i>
                最近のアクティビティ
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                システム内の重要な操作履歴を表示
              </p>
            </div>
            <div id="recent-activity">
              <div class="text-center py-4"><div class="loading-spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- Additional Info -->
        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-sync-alt mr-2"></i>
              自動更新: 5分間隔
              <span class="ml-4 flex items-center">
                <i class="fas fa-clock mr-1"></i>
                最終更新: ${new Date().toLocaleTimeString('ja-JP')}
              </span>
            </div>
            <button onclick="location.reload()" 
                    class="text-primary-600 hover:text-primary-800 text-sm flex items-center">
              <i class="fas fa-refresh mr-1"></i>
              今すぐ更新
            </button>
          </div>
        </div>
      `;

      // Load and render chart
      this.renderUsageChart();
      
      // Load recent activity
      this.loadRecentActivity();

    } catch (error) {
      console.error('Failed to load dashboard:', error);
      container.innerHTML = `
        <div class="text-center py-8 text-danger-600">
          <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p>Failed to load dashboard data</p>
        </div>
      `;
    }
  }

  private renderStatsCards(stats: DashboardStats): string {
    const cards = [];
    
    if (this.currentUser.tenantId) {
      // Tenant-specific stats
      cards.push(
        this.createStatCard('Users', stats.users?.total || 0, 'fas fa-users', 'primary', `+${stats.users?.active || 0} active`),
        this.createStatCard('API Calls', this.formatNumber(stats.apiCalls?.thisMonth || 0), 'fas fa-code', 'success', `${stats.apiCalls?.usagePercent || 0}% of limit`),
        this.createStatCard('Storage', `${stats.storage?.used || 0} GB`, 'fas fa-database', 'warning', `${stats.storage?.usagePercent || 0}% used`),
        this.createStatCard('Monthly Bill', `$${stats.billing?.monthlyAmount || 0}`, 'fas fa-credit-card', 'danger', stats.billing?.currentPlan || 'N/A')
      );
    } else {
      // Platform-wide stats
      cards.push(
        this.createStatCard('Total Tenants', stats.totalTenants || 0, 'fas fa-building', 'primary', `${stats.activeTenants || 0} active`),
        this.createStatCard('Total Users', this.formatNumber(stats.totalUsers || 0), 'fas fa-users', 'success', `${stats.activeUsers || 0} active`),
        this.createStatCard('Monthly Revenue', `$${this.formatNumber(stats.monthlyRevenue || 0)}`, 'fas fa-dollar-sign', 'warning', `$${this.formatNumber(stats.totalRevenue || 0)} total`),
        this.createStatCard('API Calls', this.formatNumber(stats.apiCallsToday || 0), 'fas fa-code', 'danger', 'Today')
      );
    }
    
    return cards.join('');
  }

  private createStatCard(title: string, value: string | number, icon: string, color: string, subtitle: string): string {
    const helpText = this.getStatCardHelpText(title);
    
    return `
      <div class="metric-card hover:shadow-lg transition-all duration-200 cursor-help group" 
           onclick="this.querySelector('.stat-help-text').classList.toggle('hidden')">
        <div class="metric-card-content">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-${color}-500 rounded-lg flex items-center justify-center">
                  <i class="${icon} text-white"></i>
                </div>
              </div>
              <div class="ml-3">
                <dt class="text-sm font-medium text-gray-600">${title}</dt>
              </div>
            </div>
            <i class="fas fa-info-circle text-gray-400 group-hover:text-${color}-500 transition-colors"></i>
          </div>
          
          <div class="ml-13">
            <dd class="text-2xl font-bold text-gray-900 mb-1">${value}</dd>
            <dd class="text-sm text-${color}-600 font-medium">${subtitle}</dd>
          </div>

          <div class="stat-help-text hidden mt-4 pt-3 border-t border-gray-100">
            <div class="bg-${color}-50 p-3 rounded-md">
              <p class="text-xs text-${color}-700 flex items-start">
                <i class="fas fa-lightbulb text-${color}-500 mr-2 mt-0.5 flex-shrink-0"></i>
                ${helpText}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getStatCardHelpText(title: string): string {
    const helpTexts: Record<string, string> = {
      'Users': 'システムに登録されているユーザーの総数です。アクティブユーザーは過去30日以内にログインしたユーザーを指します。',
      'API Calls': '今月のAPI呼び出し回数です。プランの制限に対する使用率が表示され、上限に近づくとアラートが表示されます。',
      'Storage': '使用しているストレージ容量（GB）です。ファイルアップロード、データベース、ログなどが含まれます。',
      'Monthly Bill': '今月の請求予定額です。使用量に応じて変動し、プランのアップグレードは課金画面から行えます。',
      'Total Tenants': 'プラットフォーム全体のテナント（組織）数です。アクティブなテナントは過去30日以内に活動があったテナントです。',
      'Total Users': 'プラットフォーム全体のユーザー数です。全テナントの合計ユーザー数が表示されます。',
      'Monthly Revenue': '今月の総売上です。全テナントからの課金収入の合計が表示されます。',
      'API Calls (Today)': '本日のAPI呼び出し総数です。リアルタイムで更新され、システムの使用状況を把握できます。'
    };
    return helpTexts[title] || 'この統計について詳しい情報は管理者にお問い合わせください。';
  }

  private async renderUsageChart(): Promise<void> {
    try {
      const response = await this.apiService.call('GET', '/dashboard/metrics/api-calls', {
        period: '30d',
        tenantId: this.currentUser.tenantId
      });

      if (response.success && response.data.length > 0) {
        const ctx = document.getElementById('usage-chart') as HTMLCanvasElement;
        if (ctx && typeof (window as any).Chart !== 'undefined') {
          new (window as any).Chart(ctx, {
            type: 'line',
            data: {
              labels: response.data.map((item: any) => (window as any).dayjs(item.timestamp).format('MMM D')),
              datasets: [{
                label: 'API Calls',
                data: response.data.map((item: any) => item.value),
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value: any) {
                      return Dashboard.formatNumber(value);
                    }
                  }
                }
              }
            }
          });
        } else if (!ctx) {
          console.warn('Chart canvas not found');
        } else if (typeof (window as any).Chart === 'undefined') {
          console.warn('Chart.js not available, showing placeholder');
          // Show a placeholder instead of chart
          if (ctx) {
            ctx.outerHTML = '<div class="flex items-center justify-center h-64 text-gray-500"><i class="fas fa-chart-line mr-2"></i>Chart placeholder - Chart.js loading...</div>';
          }
        }
      }
    } catch (error) {
      console.error('Failed to load usage chart:', error);
    }
  }

  private async loadRecentActivity(): Promise<void> {
    try {
      const response = await this.apiService.call('GET', '/dashboard/activities', {
        limit: 10,
        tenantId: this.currentUser.tenantId
      });

      const container = document.getElementById('recent-activity');
      if (response.success && container) {
        if (response.data.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-history"></i>
              </div>
              <div class="empty-state-title">No recent activity</div>
              <div class="empty-state-description">Activity will appear here as users interact with your platform.</div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="flow-root">
              <ul class="-mb-8">
                ${response.data.map((activity: Activity, index: number) => `
                  <li>
                    <div class="relative pb-8 ${index === response.data.length - 1 ? '' : 'border-l-2 border-gray-200 ml-4'}">
                      <div class="relative flex space-x-3">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full ${this.getActivityIconClass(activity.type)} ring-8 ring-white">
                          <i class="${this.getActivityIcon(activity.type)} text-xs"></i>
                        </div>
                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p class="text-sm text-gray-500">${activity.message}</p>
                            ${activity.tenantName ? `<p class="text-xs text-gray-400">${activity.tenantName}</p>` : ''}
                          </div>
                          <div class="text-right text-sm whitespace-nowrap text-gray-500">
                            ${(window as any).dayjs(activity.timestamp).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
      const container = document.getElementById('recent-activity');
      if (container) {
        container.innerHTML = '<div class="text-center py-4 text-danger-600">Failed to load activity</div>';
      }
    }
  }

  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      user_login: 'fas fa-sign-in-alt',
      user_created: 'fas fa-user-plus',
      tenant_created: 'fas fa-building',
      payment_failed: 'fas fa-exclamation-triangle',
      api_limit_reached: 'fas fa-warning'
    };
    return icons[type] || 'fas fa-info-circle';
  }

  private getActivityIconClass(type: string): string {
    const classes: Record<string, string> = {
      user_login: 'bg-primary-500',
      user_created: 'bg-success-500',
      tenant_created: 'bg-success-500',
      payment_failed: 'bg-danger-500',
      api_limit_reached: 'bg-warning-500'
    };
    return classes[type] || 'bg-gray-500';
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private renderWelcomeMessage(container: HTMLElement): void {
    container.innerHTML = `
      <!-- Welcome Message -->
      <div class="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg mb-8 border border-primary-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-primary-900 mb-2">
              👋 ようこそ、${this.currentUser.name}さん
            </h2>
            <p class="text-primary-700 text-sm">
              ${this.currentUser.tenantName || 'Platform Gateway'} のダッシュボードです。
              重要な指標とシステムの状況をリアルタイムで確認できます。
            </p>
          </div>
          <button onclick="window.HelpGuide.show('dashboard')" 
                  class="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center">
            <i class="fas fa-question-circle mr-2"></i>
            使い方ガイド
          </button>
        </div>
      </div>

      <!-- Loading Stats -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <i class="fas fa-chart-bar text-primary-600 mr-2"></i>
          主要指標
          <span class="ml-2 text-sm font-normal text-gray-500">（読み込み中...）</span>
        </h3>
      </div>
      
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        ${this.renderLoadingCards()}
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Loading Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title flex items-center">
              <i class="fas fa-chart-line text-green-600 mr-2"></i>
              API使用状況 (読み込み中...)
            </h3>
          </div>
          <div class="flex items-center justify-center py-16">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="ml-2 text-gray-600">チャートを読み込み中...</span>
          </div>
        </div>
        
        <!-- Loading Activity -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title flex items-center">
              <i class="fas fa-clock text-blue-600 mr-2"></i>
              最近のアクティビティ (読み込み中...)
            </h3>
          </div>
          <div class="flex items-center justify-center py-16">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="ml-2 text-gray-600">アクティビティを読み込み中...</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderLoadingCards(): string {
    return ['Users', 'API Calls', 'Storage', 'Revenue'].map(() => `
      <div class="card stat-card">
        <div class="stat-icon">
          <div class="animate-pulse bg-gray-200 w-6 h-6 rounded"></div>
        </div>
        <div class="stat-content">
          <div class="animate-pulse bg-gray-200 h-4 w-20 rounded mb-2"></div>
          <div class="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
        </div>
      </div>
    `).join('');
  }
}