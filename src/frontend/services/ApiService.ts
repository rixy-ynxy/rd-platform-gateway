import type { ApiResponse, DashboardStats, Activity, MetricData, PaymentMethod, Invoice, BillingSummary, StripeConnectAccount, PaymentIntent } from '../types';

export class ApiService {
  private apiBaseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.apiBaseUrl = baseUrl;
  }

  async call<T = any>(method: string, endpoint: string, params: any = null, token: string | null = null): Promise<ApiResponse<T>> {
    // Demo mode: Return mock data instantly for faster UI response
    if (localStorage.getItem('demo_mode') === 'true') {
      // Add minimal delay to simulate network call but keep it fast
      await new Promise(resolve => setTimeout(resolve, 50));
      return this.getMockApiResponse(method, endpoint, params);
    }

    const url = new URL(this.apiBaseUrl + endpoint, window.location.origin);
    
    if (method === 'GET' && params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token || localStorage.getItem('auth_token')) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token || localStorage.getItem('auth_token')}`
      };
    }

    if (method !== 'GET' && params) {
      options.body = JSON.stringify(params);
    }

    const response = await fetch(url, options);
    return await response.json();
  }

  private getMockApiResponse(method: string, endpoint: string, params: any): ApiResponse {
    console.log(`🎭 Demo API Call: ${method} ${endpoint}`, params);
    
    // Mock responses for different endpoints
    if (endpoint === '/auth/me') {
      // ✅ Dynamic role switching based on localStorage selection
      const selectedRole = localStorage.getItem('demo_user_role') || 'super_admin';
      const roleMap: Record<string, { roles: string[], name: string, email: string }> = {
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
      
      const userConfig = roleMap[selectedRole] || roleMap['super_admin'];
      
      return {
        success: true,
        data: {
          id: 'user-123',
          email: userConfig.email,
          name: userConfig.name,
          lastName: 'Doe',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
          // ✅ Dynamic roles based on selection
          roles: userConfig.roles,
          tenantId: 'tenant-abc-corp',
          tenantName: 'ABC Corporation',
          company: 'ABC Corporation',
          department: 'Engineering',
          phone: '+81-90-1234-5678',
          bio: 'シニアソフトウェアエンジニア。フルスタック開発とクラウドアーキテクチャが専門。',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: '2024-09-01T09:00:00Z',
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    if (endpoint === '/dashboard/stats') {
      return {
        success: true,
        data: {
          users: { total: 245, active: 198 },
          apiCalls: { thisMonth: 125000, usagePercent: 65 },
          storage: { used: 12.5, usagePercent: 25 },
          billing: { monthlyAmount: 299, currentPlan: 'Enterprise' },
          totalTenants: 15,
          activeTenants: 12,
          totalUsers: 1850,
          activeUsers: 1203,
          monthlyRevenue: 45000,
          totalRevenue: 850000,
          apiCallsToday: 8500
        }
      };
    }
    
    if (endpoint === '/dashboard/metrics/api-calls') {
      const mockData: MetricData[] = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          timestamp: date.toISOString(),
          value: Math.floor(Math.random() * 5000) + 1000
        });
      }
      return {
        success: true,
        data: mockData
      };
    }
    
    if (endpoint === '/dashboard/activities') {
      return {
        success: true,
        data: [
          {
            type: 'user_login',
            message: 'User John Doe logged in',
            tenantName: 'ABC Corporation',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
          },
          {
            type: 'user_created',
            message: 'New user Sarah Smith was created',
            tenantName: 'XYZ Inc',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          },
          {
            type: 'api_limit_reached',
            message: 'API limit warning at 80% usage',
            tenantName: 'Demo Company',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
          }
        ]
      };
    }
    
    // Payment & Billing Mock Responses
    if (endpoint === '/payment/methods') {
      return {
        success: true,
        data: [
          {
            id: 'pm_demo_visa',
            tenantId: 'tenant-abc-corp',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 'pm_demo_mastercard',
            tenantId: 'tenant-abc-corp',
            type: 'card',
            brand: 'mastercard',
            last4: '8888',
            expiryMonth: 8,
            expiryYear: 2026,
            isDefault: false,
            createdAt: '2024-02-20T14:15:00Z',
            updatedAt: '2024-02-20T14:15:00Z'
          }
        ]
      };
    }
    
    if (endpoint === '/payment/invoices') {
      return {
        success: true,
        data: [
          {
            id: 'in_demo_001',
            tenantId: 'tenant-abc-corp',
            number: 'INV-2024-001',
            amount: 29900, // $299.00
            currency: 'usd',
            status: 'paid',
            description: 'Enterprise Plan - January 2024',
            dueDate: '2024-01-31T23:59:59Z',
            paidAt: '2024-01-25T14:22:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-25T14:22:00Z'
          },
          {
            id: 'in_demo_002',
            tenantId: 'tenant-abc-corp',
            number: 'INV-2024-002',
            amount: 29900, // $299.00
            currency: 'usd',
            status: 'open',
            description: 'Enterprise Plan - February 2024',
            dueDate: '2024-02-29T23:59:59Z',
            createdAt: '2024-02-01T00:00:00Z',
            updatedAt: '2024-02-01T00:00:00Z'
          }
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      };
    }
    
    if (endpoint === '/payment/billing-summary') {
      return {
        success: true,
        data: {
          currentPeriod: {
            start: '2024-02-01T00:00:00Z',
            end: '2024-02-29T23:59:59Z',
            amount: 299,
            currency: 'USD'
          },
          nextBillingDate: '2024-03-01T00:00:00Z',
          paymentMethod: {
            id: 'pm_demo_visa',
            tenantId: 'tenant-abc-corp',
            type: 'card',
            brand: 'visa',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          upcomingInvoice: null,
          usageThisMonth: {
            apiCalls: 125000,
            users: 245,
            storage: 12.5
          },
          tenant: {
            plan: 'Enterprise',
            limits: {
              users: 1000,
              apiCalls: 200000,
              storage: 50
            }
          }
        }
      };
    }
    
    if (endpoint === '/payment/connect-account/status') {
      return {
        success: true,
        data: {
          hasAccount: true,
          id: 'acct_demo_connect',
          status: 'enabled',
          chargesEnabled: true,
          detailsSubmitted: true,
          payoutsEnabled: true,
          requirements: {
            currently_due: [],
            past_due: [],
            pending_verification: []
          }
        }
      };
    }
    
    // Profile & User Management Mock Responses
    if (endpoint === '/user/profile' && method === 'PUT') {
      return {
        success: true,
        data: {
          message: 'Profile updated successfully',
          user: { ...params, id: 'user-123', updatedAt: new Date().toISOString() }
        }
      };
    }
    
    if (endpoint === '/user/change-password' && method === 'POST') {
      return {
        success: true,
        data: { message: 'Password changed successfully' }
      };
    }
    
    if (endpoint === '/user/preferences' && method === 'PUT') {
      return {
        success: true,
        data: { message: 'Preferences updated successfully' }
      };
    }
    
    if (endpoint.startsWith('/user/preference/') && method === 'PUT') {
      return {
        success: true,
        data: { message: 'Preference saved successfully' }
      };
    }
    
    // Tenant Management Mock Responses
    if (endpoint === '/tenant/profile' && method === 'GET') {
      return {
        success: true,
        data: {
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
        }
      };
    }
    
    if (endpoint === '/tenant/profile' && method === 'PUT') {
      return {
        success: true,
        data: {
          message: 'Tenant profile updated successfully',
          tenant: { ...params, id: 'tenant-abc-corp', updatedAt: new Date().toISOString() }
        }
      };
    }
    
    if (endpoint === '/tenant/branding' && method === 'PUT') {
      return {
        success: true,
        data: { message: 'Branding settings updated successfully' }
      };
    }
    
    if (endpoint === '/tenant/settings' && method === 'PUT') {
      return {
        success: true,
        data: { message: 'Tenant settings updated successfully' }
      };
    }

    // ✅ Admin Payment Management Mock Responses
    if (endpoint === '/admin/payment-schedules' && method === 'GET') {
      return {
        success: true,
        data: {
          stats: {
            pendingAmount: 2450000,
            processedCount: 156,
            pendingReviewCount: 8,
            failedCount: 3
          },
          data: [
            {
              id: 'ps_001',
              tenantId: 'tenant-abc-corp',
              tenantName: 'ABC Corporation',
              amount: 299000,
              currency: 'JPY',
              scheduledDate: '2024-01-31T00:00:00Z',
              paymentMethod: 'bank_transfer',
              status: 'pending',
              description: 'Monthly subscription fee',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z'
            },
            {
              id: 'ps_002',
              tenantId: 'tenant-xyz-inc',
              tenantName: 'XYZ Inc',
              amount: 150000,
              currency: 'JPY',
              scheduledDate: '2024-01-25T00:00:00Z',
              paymentMethod: 'credit_card',
              status: 'processed',
              description: 'Usage-based billing',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-25T00:00:00Z'
            }
          ]
        }
      };
    }

    if (endpoint === '/admin/fee-structure' && method === 'GET') {
      return {
        success: true,
        data: {
          monthlyRevenue: 1250000,
          averageFeeRate: 3.2,
          activeTenants: 45,
          transactionFees: [
            {
              id: 'tf_001',
              name: 'Standard Transaction Fee',
              description: '標準的な取引手数料',
              rate: 3.0
            },
            {
              id: 'tf_002',
              name: 'Premium Transaction Fee',
              description: 'プレミアムプラン向け手数料',
              rate: 2.5
            }
          ],
          subscriptionFees: [
            {
              id: 'sf_001',
              planName: 'Basic Plan',
              description: 'ベーシックプラン月額料金',
              monthlyFee: 9800
            },
            {
              id: 'sf_002',
              planName: 'Enterprise Plan',
              description: 'エンタープライズプラン月額料金',
              monthlyFee: 29800
            }
          ],
          history: [
            {
              id: 'fh_001',
              feeType: 'Transaction Fee',
              previousValue: '3.5%',
              newValue: '3.0%',
              changedAt: '2024-01-01T00:00:00Z',
              changedBy: 'Admin User'
            }
          ]
        }
      };
    }

    if (endpoint === '/admin/platform-transactions' && method === 'GET') {
      return {
        success: true,
        data: {
          stats: {
            todayVolume: 5420000,
            todayCount: 89,
            feeRevenue: 173440,
            failedCount: 2
          },
          data: [
            {
              id: 'ptx_001',
              tenantId: 'tenant-abc-corp',
              tenantName: 'ABC Corporation',
              amount: 125000,
              platformFee: 3750,
              currency: 'JPY',
              type: 'payment',
              status: 'completed',
              paymentMethod: 'credit_card',
              description: 'Subscription payment',
              createdAt: '2024-01-15T14:30:00Z',
              updatedAt: '2024-01-15T14:30:00Z'
            }
          ]
        }
      };
    }

    // ✅ Tenant Finance Management Mock Responses
    if (endpoint === '/tenant/financials' && method === 'GET') {
      return {
        success: true,
        data: {
          tenantId: 'tenant-abc-corp',
          availableBalance: 850000,
          pendingBalance: 125000,
          totalRevenue: 12500000,
          monthlyRevenue: 2350000,
          currency: 'JPY',
          lastUpdated: new Date().toISOString()
        }
      };
    }

    if (endpoint === '/tenant/transactions' && method === 'GET') {
      return {
        success: true,
        data: {
          stats: {
            monthlyRevenue: 2350000,
            transactionCount: 156,
            averageAmount: 15064,
            platformFees: 75200
          },
          data: [
            {
              id: 'tx_001',
              tenantId: 'tenant-abc-corp',
              tenantName: 'ABC Corporation',
              amount: 25000,
              platformFee: 750,
              currency: 'JPY',
              type: 'payment',
              status: 'completed',
              paymentMethod: 'credit_card',
              description: 'Service subscription',
              createdAt: '2024-01-15T12:00:00Z',
              updatedAt: '2024-01-15T12:00:00Z'
            }
          ],
          total: 156
        }
      };
    }

    if (endpoint === '/tenant/payouts' && method === 'GET') {
      return {
        success: true,
        data: {
          stats: {
            totalPaidOut: 8500000,
            pendingAmount: 200000,
            monthlyPayouts: 4,
            avgProcessingDays: 2
          },
          data: [
            {
              id: 'po_001',
              tenantId: 'tenant-abc-corp',
              amount: 200000,
              currency: 'JPY',
              status: 'pending',
              bankAccount: {
                accountNumber: '1234567',
                routingNumber: '001',
                accountName: 'ABC Corporation',
                bankName: '三菱UFJ銀行'
              },
              requestedAt: '2024-01-14T00:00:00Z'
            }
          ]
        }
      };
    }

    // ✅ User Payment Management Mock Responses
    if (endpoint === '/user/payment-profile' && method === 'GET') {
      return {
        success: true,
        data: {
          userId: 'user-123',
          paymentMethods: [
            {
              id: 'pm_demo_visa_user',
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
          billingAddress: {
            street: '東京都千代田区丸の内1-1-1',
            city: '千代田区',
            state: '東京都',
            postalCode: '100-0005',
            country: 'Japan'
          },
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
        }
      };
    }

    if (endpoint === '/marketplace/services' && method === 'GET') {
      return {
        success: true,
        data: [
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
        ]
      };
    }

    if (endpoint === '/user/payment-history' && method === 'GET') {
      return {
        success: true,
        data: {
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
        }
      };
    }

    // Default success response for other endpoints
    return {
      success: true,
      data: { message: 'Demo mode response' }
    };
  }

  // ✅ Profile Management Methods
  async updateUserProfile(formData: FormData): Promise<ApiResponse> {
    return this.call('PUT', '/user/profile', Object.fromEntries(formData));
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.call('POST', '/user/change-password', data);
  }

  async updateUserPreference(key: string, value: string): Promise<ApiResponse> {
    return this.call('PUT', `/user/preference/${key}`, { value });
  }

  async updateUserPreferences(preferences: Record<string, any>): Promise<ApiResponse> {
    return this.call('PUT', '/user/preferences', preferences);
  }

  async uploadAvatar(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // For file uploads, we need to handle FormData differently
    if (localStorage.getItem('demo_mode') === 'true') {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        data: { 
          message: 'Avatar uploaded successfully',
          avatarUrl: URL.createObjectURL(file) // Create a temporary URL for demo
        }
      };
    }

    // In real mode, use fetch directly for file uploads
    const token = localStorage.getItem('auth_token');
    const options: RequestInit = {
      method: 'POST',
      headers: {}
    };

    if (token) {
      options.headers = {
        'Authorization': `Bearer ${token}`
      };
    }

    options.body = formData;

    const response = await fetch(`${this.apiBaseUrl}/user/avatar`, options);
    return await response.json();
  }
}