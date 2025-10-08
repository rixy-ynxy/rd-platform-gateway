(function() {
  "use strict";
  const scriptRel = "modulepreload";
  const assetsURL = function(dep) {
    return "/" + dep;
  };
  const seen = {};
  const __vitePreload = function preload(baseModule, deps, importerUrl) {
    let promise = Promise.resolve();
    if (false) {
      let allSettled2 = function(promises) {
        return Promise.all(
          promises.map(
            (p) => Promise.resolve(p).then(
              (value) => ({ status: "fulfilled", value }),
              (reason) => ({ status: "rejected", reason })
            )
          )
        );
      };
      document.getElementsByTagName("link");
      const cspNonceMeta = document.querySelector(
        "meta[property=csp-nonce]"
      );
      const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
      promise = allSettled2(
        deps.map((dep) => {
          dep = assetsURL(dep);
          if (dep in seen) return;
          seen[dep] = true;
          const isCss = dep.endsWith(".css");
          const cssSelector = isCss ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
            return;
          }
          const link = document.createElement("link");
          link.rel = isCss ? "stylesheet" : scriptRel;
          if (!isCss) {
            link.as = "script";
          }
          link.crossOrigin = "";
          link.href = dep;
          if (cspNonce) {
            link.setAttribute("nonce", cspNonce);
          }
          document.head.appendChild(link);
          if (isCss) {
            return new Promise((res, rej) => {
              link.addEventListener("load", res);
              link.addEventListener(
                "error",
                () => rej(new Error(`Unable to preload CSS for ${dep}`))
              );
            });
          }
        })
      );
    }
    function handlePreloadError(err) {
      const e = new Event("vite:preloadError", {
        cancelable: true
      });
      e.payload = err;
      window.dispatchEvent(e);
      if (!e.defaultPrevented) {
        throw err;
      }
    }
    return promise.then((res) => {
      for (const item of res || []) {
        if (item.status !== "rejected") continue;
        handlePreloadError(item.reason);
      }
      return baseModule().catch(handlePreloadError);
    });
  };
  var __defProp$b = Object.defineProperty;
  var __defProps$1 = Object.defineProperties;
  var __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
  var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
  var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues$1 = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp$1.call(b, prop))
        __defNormalProp$b(a, prop, b[prop]);
    if (__getOwnPropSymbols$1)
      for (var prop of __getOwnPropSymbols$1(b)) {
        if (__propIsEnum$1.call(b, prop))
          __defNormalProp$b(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
  var __publicField$a = (obj, key, value) => __defNormalProp$b(obj, key + "", value);
  var __async$8 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class ApiService {
    constructor(baseUrl = "/api") {
      __publicField$a(this, "apiBaseUrl");
      this.apiBaseUrl = baseUrl;
    }
    call(method, endpoint, params = null, token = null) {
      return __async$8(this, null, function* () {
        if (localStorage.getItem("demo_mode") === "true") {
          yield new Promise((resolve) => setTimeout(resolve, 50));
          return this.getMockApiResponse(method, endpoint, params);
        }
        const url = new URL(this.apiBaseUrl + endpoint, window.location.origin);
        if (method === "GET" && params) {
          Object.keys(params).forEach((key) => {
            if (params[key] !== null && params[key] !== void 0) {
              url.searchParams.append(key, params[key]);
            }
          });
        }
        const options = {
          method,
          headers: {
            "Content-Type": "application/json"
          }
        };
        if (token || localStorage.getItem("auth_token")) {
          options.headers = __spreadProps$1(__spreadValues$1({}, options.headers), {
            "Authorization": `Bearer ${token || localStorage.getItem("auth_token")}`
          });
        }
        if (method !== "GET" && params) {
          options.body = JSON.stringify(params);
        }
        const response = yield fetch(url, options);
        return yield response.json();
      });
    }
    getMockApiResponse(method, endpoint, params) {
      console.log(`🎭 Demo API Call: ${method} ${endpoint}`, params);
      if (endpoint === "/auth/me") {
        const selectedRole = localStorage.getItem("demo_user_role") || "super_admin";
        const roleMap = {
          "super_admin": {
            roles: ["super_admin"],
            name: "Admin User (管理者)",
            email: "admin@example.com"
          },
          "tenant_owner": {
            roles: ["tenant_owner"],
            name: "Tenant Owner (テナント運営者)",
            email: "owner@abc-corp.com"
          },
          "user": {
            roles: ["user"],
            name: "Regular User (利用者)",
            email: "user@abc-corp.com"
          }
        };
        const userConfig = roleMap[selectedRole] || roleMap["super_admin"];
        return {
          success: true,
          data: {
            id: "user-123",
            email: userConfig.email,
            name: userConfig.name,
            lastName: "Doe",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format",
            // ✅ Dynamic roles based on selection
            roles: userConfig.roles,
            tenantId: "tenant-abc-corp",
            tenantName: "ABC Corporation",
            company: "ABC Corporation",
            department: "Engineering",
            phone: "+81-90-1234-5678",
            bio: "シニアソフトウェアエンジニア。フルスタック開発とクラウドアーキテクチャが専門。",
            isActive: true,
            lastLogin: (/* @__PURE__ */ new Date()).toISOString(),
            createdAt: "2024-09-01T09:00:00Z",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      }
      if (endpoint === "/dashboard/stats") {
        return {
          success: true,
          data: {
            users: { total: 245, active: 198 },
            apiCalls: { thisMonth: 125e3, usagePercent: 65 },
            storage: { used: 12.5, usagePercent: 25 },
            billing: { monthlyAmount: 299, currentPlan: "Enterprise" },
            totalTenants: 15,
            activeTenants: 12,
            totalUsers: 1850,
            activeUsers: 1203,
            monthlyRevenue: 45e3,
            totalRevenue: 85e4,
            apiCallsToday: 8500
          }
        };
      }
      if (endpoint === "/dashboard/metrics/api-calls") {
        const mockData = [];
        for (let i = 30; i >= 0; i--) {
          const date = /* @__PURE__ */ new Date();
          date.setDate(date.getDate() - i);
          mockData.push({
            timestamp: date.toISOString(),
            value: Math.floor(Math.random() * 5e3) + 1e3
          });
        }
        return {
          success: true,
          data: mockData
        };
      }
      if (endpoint === "/dashboard/activities") {
        return {
          success: true,
          data: [
            {
              type: "user_login",
              message: "User John Doe logged in",
              tenantName: "ABC Corporation",
              timestamp: new Date(Date.now() - 1e3 * 60 * 15).toISOString()
              // 15 minutes ago
            },
            {
              type: "user_created",
              message: "New user Sarah Smith was created",
              tenantName: "XYZ Inc",
              timestamp: new Date(Date.now() - 1e3 * 60 * 60 * 2).toISOString()
              // 2 hours ago
            },
            {
              type: "api_limit_reached",
              message: "API limit warning at 80% usage",
              tenantName: "Demo Company",
              timestamp: new Date(Date.now() - 1e3 * 60 * 60 * 4).toISOString()
              // 4 hours ago
            }
          ]
        };
      }
      if (endpoint === "/payment/methods") {
        return {
          success: true,
          data: [
            {
              id: "pm_demo_visa",
              tenantId: "tenant-abc-corp",
              type: "card",
              brand: "visa",
              last4: "4242",
              expiryMonth: 12,
              expiryYear: 2025,
              isDefault: true,
              createdAt: "2024-01-15T10:30:00Z",
              updatedAt: "2024-01-15T10:30:00Z"
            },
            {
              id: "pm_demo_mastercard",
              tenantId: "tenant-abc-corp",
              type: "card",
              brand: "mastercard",
              last4: "8888",
              expiryMonth: 8,
              expiryYear: 2026,
              isDefault: false,
              createdAt: "2024-02-20T14:15:00Z",
              updatedAt: "2024-02-20T14:15:00Z"
            }
          ]
        };
      }
      if (endpoint === "/payment/invoices") {
        return {
          success: true,
          data: [
            {
              id: "in_demo_001",
              tenantId: "tenant-abc-corp",
              number: "INV-2024-001",
              amount: 29900,
              // $299.00
              currency: "usd",
              status: "paid",
              description: "Enterprise Plan - January 2024",
              dueDate: "2024-01-31T23:59:59Z",
              paidAt: "2024-01-25T14:22:00Z",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-25T14:22:00Z"
            },
            {
              id: "in_demo_002",
              tenantId: "tenant-abc-corp",
              number: "INV-2024-002",
              amount: 29900,
              // $299.00
              currency: "usd",
              status: "open",
              description: "Enterprise Plan - February 2024",
              dueDate: "2024-02-29T23:59:59Z",
              createdAt: "2024-02-01T00:00:00Z",
              updatedAt: "2024-02-01T00:00:00Z"
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
      if (endpoint === "/payment/billing-summary") {
        return {
          success: true,
          data: {
            currentPeriod: {
              start: "2024-02-01T00:00:00Z",
              end: "2024-02-29T23:59:59Z",
              amount: 299,
              currency: "USD"
            },
            nextBillingDate: "2024-03-01T00:00:00Z",
            paymentMethod: {
              id: "pm_demo_visa",
              tenantId: "tenant-abc-corp",
              type: "card",
              brand: "visa",
              last4: "4242",
              expiryMonth: 12,
              expiryYear: 2025,
              isDefault: true,
              createdAt: "2024-01-15T10:30:00Z",
              updatedAt: "2024-01-15T10:30:00Z"
            },
            upcomingInvoice: null,
            usageThisMonth: {
              apiCalls: 125e3,
              users: 245,
              storage: 12.5
            },
            tenant: {
              plan: "Enterprise",
              limits: {
                users: 1e3,
                apiCalls: 2e5,
                storage: 50
              }
            }
          }
        };
      }
      if (endpoint === "/payment/connect-account/status") {
        return {
          success: true,
          data: {
            hasAccount: true,
            id: "acct_demo_connect",
            status: "enabled",
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
      if (endpoint === "/user/profile" && method === "PUT") {
        return {
          success: true,
          data: {
            message: "Profile updated successfully",
            user: __spreadProps$1(__spreadValues$1({}, params), { id: "user-123", updatedAt: (/* @__PURE__ */ new Date()).toISOString() })
          }
        };
      }
      if (endpoint === "/user/change-password" && method === "POST") {
        return {
          success: true,
          data: { message: "Password changed successfully" }
        };
      }
      if (endpoint === "/user/preferences" && method === "PUT") {
        return {
          success: true,
          data: { message: "Preferences updated successfully" }
        };
      }
      if (endpoint.startsWith("/user/preference/") && method === "PUT") {
        return {
          success: true,
          data: { message: "Preference saved successfully" }
        };
      }
      if (endpoint === "/tenant/profile" && method === "GET") {
        return {
          success: true,
          data: {
            id: "tenant-abc-corp",
            name: "ABC Corporation",
            domain: "abc-corp.com",
            status: "active",
            plan: "Enterprise",
            description: "革新的なソリューションを提供するテクノロジー企業",
            industry: "Technology",
            size: "large",
            country: "Japan",
            website: "https://abc-corp.com",
            phone: "+81-3-1234-5678",
            address: "東京都千代田区丸の内1-1-1",
            logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center&auto=format",
            primaryColor: "#3b82f6",
            secondaryColor: "#64748b",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      }
      if (endpoint === "/tenant/profile" && method === "PUT") {
        return {
          success: true,
          data: {
            message: "Tenant profile updated successfully",
            tenant: __spreadProps$1(__spreadValues$1({}, params), { id: "tenant-abc-corp", updatedAt: (/* @__PURE__ */ new Date()).toISOString() })
          }
        };
      }
      if (endpoint === "/tenant/branding" && method === "PUT") {
        return {
          success: true,
          data: { message: "Branding settings updated successfully" }
        };
      }
      if (endpoint === "/tenant/settings" && method === "PUT") {
        return {
          success: true,
          data: { message: "Tenant settings updated successfully" }
        };
      }
      if (endpoint === "/admin/payment-schedules" && method === "GET") {
        return {
          success: true,
          data: {
            stats: {
              pendingAmount: 245e4,
              processedCount: 156,
              pendingReviewCount: 8,
              failedCount: 3
            },
            data: [
              {
                id: "ps_001",
                tenantId: "tenant-abc-corp",
                tenantName: "ABC Corporation",
                amount: 299e3,
                currency: "JPY",
                scheduledDate: "2024-01-31T00:00:00Z",
                paymentMethod: "bank_transfer",
                status: "pending",
                description: "Monthly subscription fee",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-15T00:00:00Z"
              },
              {
                id: "ps_002",
                tenantId: "tenant-xyz-inc",
                tenantName: "XYZ Inc",
                amount: 15e4,
                currency: "JPY",
                scheduledDate: "2024-01-25T00:00:00Z",
                paymentMethod: "credit_card",
                status: "processed",
                description: "Usage-based billing",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-25T00:00:00Z"
              }
            ]
          }
        };
      }
      if (endpoint === "/admin/fee-structure" && method === "GET") {
        return {
          success: true,
          data: {
            monthlyRevenue: 125e4,
            averageFeeRate: 3.2,
            activeTenants: 45,
            transactionFees: [
              {
                id: "tf_001",
                name: "Standard Transaction Fee",
                description: "標準的な取引手数料",
                rate: 3
              },
              {
                id: "tf_002",
                name: "Premium Transaction Fee",
                description: "プレミアムプラン向け手数料",
                rate: 2.5
              }
            ],
            subscriptionFees: [
              {
                id: "sf_001",
                planName: "Basic Plan",
                description: "ベーシックプラン月額料金",
                monthlyFee: 9800
              },
              {
                id: "sf_002",
                planName: "Enterprise Plan",
                description: "エンタープライズプラン月額料金",
                monthlyFee: 29800
              }
            ],
            history: [
              {
                id: "fh_001",
                feeType: "Transaction Fee",
                previousValue: "3.5%",
                newValue: "3.0%",
                changedAt: "2024-01-01T00:00:00Z",
                changedBy: "Admin User"
              }
            ]
          }
        };
      }
      if (endpoint === "/admin/platform-transactions" && method === "GET") {
        return {
          success: true,
          data: {
            stats: {
              todayVolume: 542e4,
              todayCount: 89,
              feeRevenue: 173440,
              failedCount: 2
            },
            data: [
              {
                id: "ptx_001",
                tenantId: "tenant-abc-corp",
                tenantName: "ABC Corporation",
                amount: 125e3,
                platformFee: 3750,
                currency: "JPY",
                type: "payment",
                status: "completed",
                paymentMethod: "credit_card",
                description: "Subscription payment",
                createdAt: "2024-01-15T14:30:00Z",
                updatedAt: "2024-01-15T14:30:00Z"
              }
            ]
          }
        };
      }
      if (endpoint === "/tenant/financials" && method === "GET") {
        return {
          success: true,
          data: {
            tenantId: "tenant-abc-corp",
            availableBalance: 85e4,
            pendingBalance: 125e3,
            totalRevenue: 125e5,
            monthlyRevenue: 235e4,
            currency: "JPY",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      }
      if (endpoint === "/tenant/transactions" && method === "GET") {
        return {
          success: true,
          data: {
            stats: {
              monthlyRevenue: 235e4,
              transactionCount: 156,
              averageAmount: 15064,
              platformFees: 75200
            },
            data: [
              {
                id: "tx_001",
                tenantId: "tenant-abc-corp",
                tenantName: "ABC Corporation",
                amount: 25e3,
                platformFee: 750,
                currency: "JPY",
                type: "payment",
                status: "completed",
                paymentMethod: "credit_card",
                description: "Service subscription",
                createdAt: "2024-01-15T12:00:00Z",
                updatedAt: "2024-01-15T12:00:00Z"
              }
            ],
            total: 156
          }
        };
      }
      if (endpoint === "/tenant/payouts" && method === "GET") {
        return {
          success: true,
          data: {
            stats: {
              totalPaidOut: 85e5,
              pendingAmount: 2e5,
              monthlyPayouts: 4,
              avgProcessingDays: 2
            },
            data: [
              {
                id: "po_001",
                tenantId: "tenant-abc-corp",
                amount: 2e5,
                currency: "JPY",
                status: "pending",
                bankAccount: {
                  accountNumber: "1234567",
                  routingNumber: "001",
                  accountName: "ABC Corporation",
                  bankName: "三菱UFJ銀行"
                },
                requestedAt: "2024-01-14T00:00:00Z"
              }
            ]
          }
        };
      }
      if (endpoint === "/user/payment-profile" && method === "GET") {
        return {
          success: true,
          data: {
            userId: "user-123",
            paymentMethods: [
              {
                id: "pm_demo_visa_user",
                tenantId: "",
                type: "card",
                brand: "visa",
                last4: "4242",
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true,
                createdAt: "2024-01-15T10:30:00Z",
                updatedAt: "2024-01-15T10:30:00Z"
              }
            ],
            billingAddress: {
              street: "東京都千代田区丸の内1-1-1",
              city: "千代田区",
              state: "東京都",
              postalCode: "100-0005",
              country: "Japan"
            },
            connectedServices: [
              {
                id: "cs_analytics_pro",
                serviceName: "Analytics Pro",
                serviceType: "subscription",
                isActive: true,
                monthlyFee: 2980,
                connectedAt: "2024-01-01T00:00:00Z",
                lastBilledAt: "2024-01-01T00:00:00Z"
              },
              {
                id: "cs_cloud_storage",
                serviceName: "Cloud Storage",
                serviceType: "subscription",
                isActive: true,
                usageBasedPricing: {
                  unit: "GB",
                  pricePerUnit: 10,
                  includedUnits: 100
                },
                connectedAt: "2024-01-10T00:00:00Z"
              }
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
      }
      if (endpoint === "/marketplace/services" && method === "GET") {
        return {
          success: true,
          data: [
            {
              id: "svc_api_gateway",
              name: "API Gateway",
              description: "高性能なAPIゲートウェイサービス",
              type: "api",
              pricing: {
                free: true,
                monthly: 1980,
                perUnit: 0.1,
                unit: "リクエスト"
              }
            },
            {
              id: "svc_monitoring",
              name: "Advanced Monitoring",
              description: "リアルタイム監視とアラート機能",
              type: "monitoring",
              pricing: {
                monthly: 4980
              }
            },
            {
              id: "svc_backup",
              name: "Automated Backup",
              description: "自動バックアップとリストア機能",
              type: "backup",
              pricing: {
                free: true,
                monthly: 980
              }
            }
          ]
        };
      }
      if (endpoint === "/user/payment-history" && method === "GET") {
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
                id: "pay_001",
                date: "2024-01-15T00:00:00Z",
                serviceName: "Analytics Pro",
                serviceType: "subscription",
                description: "月額サブスクリプション",
                amount: 2980,
                paymentMethod: "VISA •••• 4242",
                status: "completed"
              },
              {
                id: "pay_002",
                date: "2024-01-10T00:00:00Z",
                serviceName: "Cloud Storage",
                serviceType: "subscription",
                description: "ストレージ使用料",
                amount: 1200,
                paymentMethod: "VISA •••• 4242",
                status: "completed"
              }
            ]
          }
        };
      }
      return {
        success: true,
        data: { message: "Demo mode response" }
      };
    }
    // ✅ Profile Management Methods
    updateUserProfile(formData) {
      return __async$8(this, null, function* () {
        return this.call("PUT", "/user/profile", Object.fromEntries(formData));
      });
    }
    changePassword(data) {
      return __async$8(this, null, function* () {
        return this.call("POST", "/user/change-password", data);
      });
    }
    updateUserPreference(key, value) {
      return __async$8(this, null, function* () {
        return this.call("PUT", `/user/preference/${key}`, { value });
      });
    }
    updateUserPreferences(preferences) {
      return __async$8(this, null, function* () {
        return this.call("PUT", "/user/preferences", preferences);
      });
    }
    uploadAvatar(file) {
      return __async$8(this, null, function* () {
        const formData = new FormData();
        formData.append("avatar", file);
        if (localStorage.getItem("demo_mode") === "true") {
          yield new Promise((resolve) => setTimeout(resolve, 100));
          return {
            success: true,
            data: {
              message: "Avatar uploaded successfully",
              avatarUrl: URL.createObjectURL(file)
              // Create a temporary URL for demo
            }
          };
        }
        const token = localStorage.getItem("auth_token");
        const options = {
          method: "POST",
          headers: {}
        };
        if (token) {
          options.headers = {
            "Authorization": `Bearer ${token}`
          };
        }
        options.body = formData;
        const response = yield fetch(`${this.apiBaseUrl}/user/avatar`, options);
        return yield response.json();
      });
    }
  }
  var __defProp$a = Object.defineProperty;
  var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$9 = (obj, key, value) => __defNormalProp$a(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Navigation {
    constructor(currentPage, currentUser) {
      __publicField$9(this, "currentPage");
      __publicField$9(this, "currentUser");
      this.currentPage = currentPage;
      this.currentUser = currentUser;
    }
    render(container) {
      var _a;
      if (!container) return;
      const currentExpanded = JSON.parse(localStorage.getItem("expandedNavSections") || "[]");
      const userRoles = ((_a = this.currentUser) == null ? void 0 : _a.roles) || [];
      const isSuperAdmin = userRoles.includes("super_admin");
      const isTenantOwner = userRoles.includes("tenant_owner");
      const isRegularUser = userRoles.includes("user") && !isSuperAdmin && !isTenantOwner;
      let defaultExpanded = [];
      if (currentExpanded.length === 0) {
        if (isSuperAdmin) {
          defaultExpanded = ["overview", "management"];
        } else if (isTenantOwner) {
          defaultExpanded = ["overview", "my-tenant"];
        } else {
          defaultExpanded = ["overview", "my-profile"];
        }
      }
      const expandedSections = [.../* @__PURE__ */ new Set([...currentExpanded, ...defaultExpanded])];
      localStorage.setItem("expandedNavSections", JSON.stringify(expandedSections));
      console.log("📂 Initial expanded sections set:", expandedSections);
      const navStructure = this.getNavigationForRole(isSuperAdmin, isTenantOwner, isRegularUser);
      const roleLabel = isSuperAdmin ? "管理者" : isTenantOwner ? "テナント運営者" : "利用者";
      const currentRole = isSuperAdmin ? "super_admin" : isTenantOwner ? "tenant_owner" : "user";
      const navigationHeader = `
      <div class="px-4 py-3 bg-blue-50 border-b border-blue-100 mb-2">
        <!-- Role Switcher -->
        <div class="mb-3">
          <label class="block text-xs font-medium text-blue-700 mb-2">
            <i class="fas fa-user-circle mr-1"></i>
            デモロール切り替え
          </label>
          <select id="role-switcher" 
                  class="w-full text-xs px-2 py-1 bg-white border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  onchange="window.Navigation.switchRole(this.value)">
            <option value="super_admin" ${currentRole === "super_admin" ? "selected" : ""}>
              👑 管理者 (全機能)
            </option>
            <option value="tenant_owner" ${currentRole === "tenant_owner" ? "selected" : ""}>
              🏢 テナント運営者 (組織管理)
            </option>
            <option value="user" ${currentRole === "user" ? "selected" : ""}>
              👤 利用者 (個人管理)
            </option>
          </select>
        </div>

        <!-- Navigation Header -->
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-blue-800 flex items-center">
            <i class="fas fa-compass mr-2"></i>
            ナビゲーション
          </h3>
          <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            ${roleLabel}
          </span>
        </div>
        <p class="text-xs text-blue-600 mt-1">
          左の項目をクリックして各機能に移動
        </p>
      </div>
    `;
      container.innerHTML = navigationHeader + this.renderNavigationTree(navStructure);
    }
    // This method is no longer needed since we generate role-specific navigation
    // directly in getNavigationForRole() method, but keeping for backward compatibility
    filterNavigation(navItems, isAdmin, isTenantOwner, isManager) {
      return navItems.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.ownerOnly && !isTenantOwner && !isAdmin) return false;
        if (item.managerOnly && !isManager && !isTenantOwner && !isAdmin) return false;
        if (item.children) {
          item.children = this.filterNavigation(item.children, isAdmin, isTenantOwner, isManager);
        }
        return true;
      });
    }
    renderNavigationTree(navItems, level = 0) {
      if (!navItems || navItems.length === 0) return "";
      return navItems.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = this.isNavItemActive(item);
        const isExpanded = this.isNavSectionExpanded(item.id);
        const levelPadding = {
          0: "pl-3",
          // Top level
          1: "pl-8",
          // First nested level 
          2: "pl-12",
          // Second nested level
          3: "pl-16"
          // Third nested level
        }[level] || "pl-16";
        const itemBaseClasses = "flex items-center w-full py-2 text-sm font-medium transition-colors duration-200";
        const hoverClasses = "hover:bg-gray-100 hover:text-gray-900";
        const activeClasses = isActive ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500" : "text-gray-700";
        if (hasChildren) {
          return `
          <div class="nav-section" data-level="${level}">
            <button class="${itemBaseClasses} ${levelPadding} ${hoverClasses} ${activeClasses} ${isExpanded ? "bg-gray-50" : ""}" 
                    onclick="window.Navigation.toggleNavSection('${item.id}')"
                    data-section="${item.id}">
              <i class="${item.icon} w-5 h-5 mr-3 flex-shrink-0"></i>
              <span class="flex-1 text-left">${item.label}</span>
              <i class="fas fa-chevron-right w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}"></i>
            </button>
            <div class="nav-children" id="nav-${item.id}" style="display: ${isExpanded ? "block" : "none"}">
              ${this.renderNavigationTree(item.children, level + 1)}
            </div>
          </div>
        `;
        } else {
          return `
          <div class="nav-section" data-level="${level}">
            <a href="#${item.id}" 
               class="${itemBaseClasses} ${levelPadding} ${hoverClasses} ${this.currentPage === item.id || this.currentPage.startsWith(item.id + "/") ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500" : "text-gray-600"} no-underline"
               data-page="${item.id}"
               onclick="window.app.navigateTo('${item.id}'); return false;">
              <i class="${item.icon} w-5 h-5 mr-3 flex-shrink-0 ${this.currentPage === item.id || this.currentPage.startsWith(item.id + "/") ? "text-blue-600" : "text-gray-500"}"></i>
              <span class="text-left">${item.label}</span>
            </a>
          </div>
        `;
        }
      }).join("");
    }
    isNavItemActive(item) {
      if (item.id === this.currentPage) return true;
      if (item.children) {
        return item.children.some((child) => this.isNavItemActive(child));
      }
      return this.currentPage.startsWith(item.id + "/");
    }
    isNavSectionExpanded(sectionId) {
      const expandedSections = JSON.parse(localStorage.getItem("expandedNavSections") || "[]");
      const isExpanded = expandedSections.includes(sectionId);
      return isExpanded;
    }
    static toggleNavSection(sectionId) {
      console.log("🎯 Toggle navigation section called:", sectionId);
      const expandedSections = JSON.parse(localStorage.getItem("expandedNavSections") || "[]");
      const isExpanded = expandedSections.includes(sectionId);
      console.log("📂 Current expanded sections:", expandedSections);
      console.log("📊 Is currently expanded:", isExpanded);
      if (isExpanded) {
        const index = expandedSections.indexOf(sectionId);
        expandedSections.splice(index, 1);
      } else {
        expandedSections.push(sectionId);
      }
      localStorage.setItem("expandedNavSections", JSON.stringify(expandedSections));
      console.log("💾 Updated expanded sections:", expandedSections);
      const button = document.querySelector(`[data-section="${sectionId}"]`);
      const children = document.getElementById(`nav-${sectionId}`);
      const arrow = button == null ? void 0 : button.querySelector("i:last-child");
      console.log("🔍 Found elements:", { button: !!button, children: !!children, arrow: !!arrow });
      if (button && children && arrow) {
        if (!isExpanded) {
          console.log("🔽 Expanding section");
          children.style.display = "block";
          arrow.classList.add("rotate-90");
          button.classList.add("bg-gray-50");
        } else {
          console.log("🔼 Collapsing section");
          children.style.display = "none";
          arrow.classList.remove("rotate-90");
          button.classList.remove("bg-gray-50");
        }
      } else {
        console.error("❌ Could not find navigation elements for section:", sectionId);
      }
    }
    /**
     * Switch user role for demo purposes
     */
    static switchRole(newRole) {
      console.log(`🔄 Switching role to: ${newRole}`);
      localStorage.setItem("demo_user_role", newRole);
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-md shadow-lg z-50";
      toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-sync-alt mr-2"></i>
        ロールを変更中...
      </div>
    `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
        window.location.reload();
      }, 1e3);
    }
    /**
     * Generate navigation structure based on user roles
     */
    getNavigationForRole(isSuperAdmin, isTenantOwner, isRegularUser) {
      if (isSuperAdmin) {
        return [
          {
            id: "overview",
            label: "Overview",
            icon: "fas fa-home",
            children: [
              { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
              { id: "analytics", label: "Analytics", icon: "fas fa-chart-line" },
              { id: "reports", label: "Reports", icon: "fas fa-file-chart" }
            ]
          },
          {
            id: "management",
            label: "Management",
            icon: "fas fa-cogs",
            children: [
              { id: "tenants", label: "Tenants", icon: "fas fa-building" },
              {
                id: "users",
                label: "Users",
                icon: "fas fa-users",
                children: [
                  { id: "users/list", label: "All Users", icon: "fas fa-list" },
                  { id: "users/create", label: "Add User", icon: "fas fa-user-plus" },
                  { id: "users/roles", label: "Roles & Permissions", icon: "fas fa-user-shield" },
                  { id: "users/invitations", label: "Invitations", icon: "fas fa-envelope" }
                ]
              },
              {
                id: "api",
                label: "API Management",
                icon: "fas fa-code",
                children: [
                  { id: "api/keys", label: "API Keys", icon: "fas fa-key" },
                  { id: "api/endpoints", label: "Endpoints", icon: "fas fa-plug" },
                  { id: "api/documentation", label: "Documentation", icon: "fas fa-book" },
                  { id: "api/testing", label: "API Testing", icon: "fas fa-flask" }
                ]
              }
            ]
          },
          {
            id: "billing",
            label: "Billing & Payments",
            icon: "fas fa-credit-card",
            children: [
              { id: "billing/overview", label: "Billing Overview", icon: "fas fa-chart-pie" },
              { id: "billing/invoices", label: "Invoices", icon: "fas fa-file-invoice" },
              { id: "billing/payments", label: "Payment Methods", icon: "fas fa-credit-card" },
              { id: "billing/subscription", label: "Subscription", icon: "fas fa-calendar-alt" },
              { id: "billing/connect", label: "Stripe Connect", icon: "fab fa-stripe" }
            ]
          },
          {
            id: "tenant-finance",
            label: "Financial Management",
            icon: "fas fa-wallet",
            children: [
              { id: "tenant-finance/overview", label: "Financial Overview", icon: "fas fa-chart-pie" },
              { id: "tenant-finance/transactions", label: "Transaction History", icon: "fas fa-history" },
              { id: "tenant-finance/payouts", label: "Payout Management", icon: "fas fa-arrow-up" },
              { id: "tenant-finance/settings", label: "Payment Settings", icon: "fas fa-cog" }
            ]
          },
          {
            id: "platform-payments",
            label: "Platform Payments",
            icon: "fas fa-coins",
            children: [
              { id: "admin-payment/schedule", label: "Payment Schedules", icon: "fas fa-calendar-alt" },
              { id: "admin-payment/fees", label: "Fee Management", icon: "fas fa-percentage" },
              { id: "admin-payment/transactions", label: "Platform Transactions", icon: "fas fa-exchange-alt" },
              { id: "admin-payment/analytics", label: "Payment Analytics", icon: "fas fa-chart-pie" }
            ]
          },
          {
            id: "monitoring",
            label: "Monitoring",
            icon: "fas fa-heartbeat",
            children: [
              { id: "monitoring/usage", label: "Usage Metrics", icon: "fas fa-chart-bar" },
              { id: "monitoring/performance", label: "Performance", icon: "fas fa-tachometer-alt" },
              { id: "monitoring/logs", label: "Activity Logs", icon: "fas fa-list-alt" },
              { id: "monitoring/health", label: "System Health", icon: "fas fa-heartbeat" },
              { id: "monitoring/alerts", label: "Alerts", icon: "fas fa-bell" }
            ]
          },
          {
            id: "integrations",
            label: "Integrations",
            icon: "fas fa-puzzle-piece",
            children: [
              { id: "integrations/webhooks", label: "Webhooks", icon: "fas fa-webhook" },
              { id: "integrations/sso", label: "SSO Configuration", icon: "fas fa-sign-in-alt" },
              { id: "integrations/third-party", label: "Third-party Services", icon: "fas fa-external-link-alt" },
              { id: "integrations/marketplace", label: "App Marketplace", icon: "fas fa-store" }
            ]
          },
          {
            id: "settings",
            label: "Settings",
            icon: "fas fa-cog",
            children: [
              { id: "settings/general", label: "General Settings", icon: "fas fa-sliders-h" },
              { id: "settings/security", label: "Security", icon: "fas fa-shield-alt" },
              { id: "settings/notifications", label: "Notifications", icon: "fas fa-bell" },
              { id: "settings/preferences", label: "Preferences", icon: "fas fa-user-cog" },
              { id: "settings/branding", label: "Branding", icon: "fas fa-palette" }
            ]
          },
          {
            id: "admin",
            label: "Admin Console",
            icon: "fas fa-tools",
            children: [
              { id: "admin/platform", label: "Platform Overview", icon: "fas fa-globe" },
              { id: "admin/tenants", label: "Tenant Management", icon: "fas fa-building" },
              { id: "admin/users", label: "Global Users", icon: "fas fa-users-cog" },
              { id: "admin/system", label: "System Configuration", icon: "fas fa-server" },
              { id: "admin/maintenance", label: "Maintenance", icon: "fas fa-wrench" }
            ]
          }
        ];
      }
      if (isTenantOwner) {
        return [
          {
            id: "overview",
            label: "Overview",
            icon: "fas fa-home",
            children: [
              { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" },
              { id: "analytics", label: "Analytics", icon: "fas fa-chart-line" },
              { id: "reports", label: "Reports", icon: "fas fa-file-chart" }
            ]
          },
          {
            id: "my-tenant",
            label: "My Organization",
            icon: "fas fa-building",
            children: [
              { id: "tenant/profile", label: "Organization Profile", icon: "fas fa-id-card" },
              { id: "tenant/settings", label: "Organization Settings", icon: "fas fa-cog" },
              { id: "tenant/branding", label: "Branding", icon: "fas fa-palette" }
            ]
          },
          {
            id: "team-management",
            label: "Team Management",
            icon: "fas fa-users",
            children: [
              { id: "users/list", label: "Team Members", icon: "fas fa-list" },
              { id: "users/create", label: "Add Member", icon: "fas fa-user-plus" },
              { id: "users/roles", label: "Roles & Permissions", icon: "fas fa-user-shield" },
              { id: "users/invitations", label: "Invitations", icon: "fas fa-envelope" }
            ]
          },
          {
            id: "billing",
            label: "Billing & Payments",
            icon: "fas fa-credit-card",
            children: [
              { id: "billing/overview", label: "Billing Overview", icon: "fas fa-chart-pie" },
              { id: "billing/invoices", label: "Invoices", icon: "fas fa-file-invoice" },
              { id: "billing/payments", label: "Payment Methods", icon: "fas fa-credit-card" },
              { id: "billing/subscription", label: "Subscription", icon: "fas fa-calendar-alt" },
              { id: "billing/connect", label: "Stripe Connect", icon: "fab fa-stripe" }
            ]
          },
          {
            id: "tenant-finance",
            label: "Financial Management",
            icon: "fas fa-wallet",
            children: [
              { id: "tenant-finance/overview", label: "Financial Overview", icon: "fas fa-chart-pie" },
              { id: "tenant-finance/transactions", label: "Transaction History", icon: "fas fa-history" },
              { id: "tenant-finance/payouts", label: "Payout Management", icon: "fas fa-arrow-up" },
              { id: "tenant-finance/settings", label: "Payment Settings", icon: "fas fa-cog" }
            ]
          },
          {
            id: "monitoring",
            label: "Usage & Analytics",
            icon: "fas fa-chart-bar",
            children: [
              { id: "monitoring/usage", label: "Usage Metrics", icon: "fas fa-chart-bar" },
              { id: "monitoring/performance", label: "Performance", icon: "fas fa-tachometer-alt" },
              { id: "monitoring/logs", label: "Activity Logs", icon: "fas fa-list-alt" }
            ]
          },
          {
            id: "integrations",
            label: "Integrations",
            icon: "fas fa-puzzle-piece",
            children: [
              { id: "integrations/webhooks", label: "Webhooks", icon: "fas fa-webhook" },
              { id: "integrations/third-party", label: "Third-party Services", icon: "fas fa-external-link-alt" }
            ]
          }
        ];
      }
      if (isRegularUser) {
        return [
          {
            id: "overview",
            label: "Overview",
            icon: "fas fa-home",
            children: [
              { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" }
            ]
          },
          {
            id: "my-profile",
            label: "My Profile",
            icon: "fas fa-user",
            children: [
              { id: "profile/personal", label: "Personal Information", icon: "fas fa-id-card" },
              { id: "profile/security", label: "Security Settings", icon: "fas fa-shield-alt" },
              { id: "profile/preferences", label: "Preferences", icon: "fas fa-user-cog" }
            ]
          },
          {
            id: "my-billing",
            label: "My Billing",
            icon: "fas fa-credit-card",
            children: [
              { id: "billing/overview", label: "Billing Overview", icon: "fas fa-chart-pie" },
              { id: "billing/invoices", label: "My Invoices", icon: "fas fa-file-invoice" },
              { id: "billing/payments", label: "Payment Methods", icon: "fas fa-credit-card" }
            ]
          },
          {
            id: "user-payment",
            label: "Payment Management",
            icon: "fas fa-wallet",
            children: [
              { id: "user-payment/overview", label: "Payment Overview", icon: "fas fa-chart-pie" },
              { id: "user-payment/methods", label: "Payment Methods", icon: "fas fa-credit-card" },
              { id: "user-payment/services", label: "Connected Services", icon: "fas fa-plug" },
              { id: "user-payment/history", label: "Payment History", icon: "fas fa-history" }
            ]
          }
        ];
      }
      return [
        {
          id: "overview",
          label: "Overview",
          icon: "fas fa-home",
          children: [
            { id: "dashboard", label: "Dashboard", icon: "fas fa-tachometer-alt" }
          ]
        }
      ];
    }
  }
  var __defProp$9 = Object.defineProperty;
  var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$8 = (obj, key, value) => __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$7 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class Dashboard {
    constructor(apiService, currentUser) {
      __publicField$8(this, "apiService");
      __publicField$8(this, "currentUser");
      this.apiService = apiService;
      this.currentUser = currentUser;
    }
    render(container) {
      return __async$7(this, null, function* () {
        console.log("📊 Rendering dashboard...");
        this.renderWelcomeMessage(container);
        try {
          const statsResponse = yield this.apiService.call("GET", "/dashboard/stats", {
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
                ${this.currentUser.tenantName || "Platform Gateway"} のダッシュボードです。
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
                最終更新: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP")}
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
          this.renderUsageChart();
          this.loadRecentActivity();
        } catch (error) {
          console.error("Failed to load dashboard:", error);
          container.innerHTML = `
        <div class="text-center py-8 text-danger-600">
          <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p>Failed to load dashboard data</p>
        </div>
      `;
        }
      });
    }
    renderStatsCards(stats) {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const cards = [];
      if (this.currentUser.tenantId) {
        cards.push(
          this.createStatCard("Users", ((_a = stats.users) == null ? void 0 : _a.total) || 0, "fas fa-users", "primary", `+${((_b = stats.users) == null ? void 0 : _b.active) || 0} active`),
          this.createStatCard("API Calls", this.formatNumber(((_c = stats.apiCalls) == null ? void 0 : _c.thisMonth) || 0), "fas fa-code", "success", `${((_d = stats.apiCalls) == null ? void 0 : _d.usagePercent) || 0}% of limit`),
          this.createStatCard("Storage", `${((_e = stats.storage) == null ? void 0 : _e.used) || 0} GB`, "fas fa-database", "warning", `${((_f = stats.storage) == null ? void 0 : _f.usagePercent) || 0}% used`),
          this.createStatCard("Monthly Bill", `$${((_g = stats.billing) == null ? void 0 : _g.monthlyAmount) || 0}`, "fas fa-credit-card", "danger", ((_h = stats.billing) == null ? void 0 : _h.currentPlan) || "N/A")
        );
      } else {
        cards.push(
          this.createStatCard("Total Tenants", stats.totalTenants || 0, "fas fa-building", "primary", `${stats.activeTenants || 0} active`),
          this.createStatCard("Total Users", this.formatNumber(stats.totalUsers || 0), "fas fa-users", "success", `${stats.activeUsers || 0} active`),
          this.createStatCard("Monthly Revenue", `$${this.formatNumber(stats.monthlyRevenue || 0)}`, "fas fa-dollar-sign", "warning", `$${this.formatNumber(stats.totalRevenue || 0)} total`),
          this.createStatCard("API Calls", this.formatNumber(stats.apiCallsToday || 0), "fas fa-code", "danger", "Today")
        );
      }
      return cards.join("");
    }
    createStatCard(title, value, icon, color, subtitle) {
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
    getStatCardHelpText(title) {
      const helpTexts = {
        "Users": "システムに登録されているユーザーの総数です。アクティブユーザーは過去30日以内にログインしたユーザーを指します。",
        "API Calls": "今月のAPI呼び出し回数です。プランの制限に対する使用率が表示され、上限に近づくとアラートが表示されます。",
        "Storage": "使用しているストレージ容量（GB）です。ファイルアップロード、データベース、ログなどが含まれます。",
        "Monthly Bill": "今月の請求予定額です。使用量に応じて変動し、プランのアップグレードは課金画面から行えます。",
        "Total Tenants": "プラットフォーム全体のテナント（組織）数です。アクティブなテナントは過去30日以内に活動があったテナントです。",
        "Total Users": "プラットフォーム全体のユーザー数です。全テナントの合計ユーザー数が表示されます。",
        "Monthly Revenue": "今月の総売上です。全テナントからの課金収入の合計が表示されます。",
        "API Calls (Today)": "本日のAPI呼び出し総数です。リアルタイムで更新され、システムの使用状況を把握できます。"
      };
      return helpTexts[title] || "この統計について詳しい情報は管理者にお問い合わせください。";
    }
    renderUsageChart() {
      return __async$7(this, null, function* () {
        try {
          const response = yield this.apiService.call("GET", "/dashboard/metrics/api-calls", {
            period: "30d",
            tenantId: this.currentUser.tenantId
          });
          if (response.success && response.data.length > 0) {
            const ctx = document.getElementById("usage-chart");
            if (ctx && typeof window.Chart !== "undefined") {
              new window.Chart(ctx, {
                type: "line",
                data: {
                  labels: response.data.map((item) => window.dayjs(item.timestamp).format("MMM D")),
                  datasets: [{
                    label: "API Calls",
                    data: response.data.map((item) => item.value),
                    borderColor: "#0ea5e9",
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
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
                        callback: function(value) {
                          return Dashboard.formatNumber(value);
                        }
                      }
                    }
                  }
                }
              });
            } else if (!ctx) {
              console.warn("Chart canvas not found");
            } else if (typeof window.Chart === "undefined") {
              console.warn("Chart.js not available, showing placeholder");
              if (ctx) {
                ctx.outerHTML = '<div class="flex items-center justify-center h-64 text-gray-500"><i class="fas fa-chart-line mr-2"></i>Chart placeholder - Chart.js loading...</div>';
              }
            }
          }
        } catch (error) {
          console.error("Failed to load usage chart:", error);
        }
      });
    }
    loadRecentActivity() {
      return __async$7(this, null, function* () {
        try {
          const response = yield this.apiService.call("GET", "/dashboard/activities", {
            limit: 10,
            tenantId: this.currentUser.tenantId
          });
          const container = document.getElementById("recent-activity");
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
                ${response.data.map((activity, index) => `
                  <li>
                    <div class="relative pb-8 ${index === response.data.length - 1 ? "" : "border-l-2 border-gray-200 ml-4"}">
                      <div class="relative flex space-x-3">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full ${this.getActivityIconClass(activity.type)} ring-8 ring-white">
                          <i class="${this.getActivityIcon(activity.type)} text-xs"></i>
                        </div>
                        <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p class="text-sm text-gray-500">${activity.message}</p>
                            ${activity.tenantName ? `<p class="text-xs text-gray-400">${activity.tenantName}</p>` : ""}
                          </div>
                          <div class="text-right text-sm whitespace-nowrap text-gray-500">
                            ${window.dayjs(activity.timestamp).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
            }
          }
        } catch (error) {
          console.error("Failed to load recent activity:", error);
          const container = document.getElementById("recent-activity");
          if (container) {
            container.innerHTML = '<div class="text-center py-4 text-danger-600">Failed to load activity</div>';
          }
        }
      });
    }
    getActivityIcon(type) {
      const icons = {
        user_login: "fas fa-sign-in-alt",
        user_created: "fas fa-user-plus",
        tenant_created: "fas fa-building",
        payment_failed: "fas fa-exclamation-triangle",
        api_limit_reached: "fas fa-warning"
      };
      return icons[type] || "fas fa-info-circle";
    }
    getActivityIconClass(type) {
      const classes = {
        user_login: "bg-primary-500",
        user_created: "bg-success-500",
        tenant_created: "bg-success-500",
        payment_failed: "bg-danger-500",
        api_limit_reached: "bg-warning-500"
      };
      return classes[type] || "bg-gray-500";
    }
    formatNumber(num) {
      if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + "M";
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + "K";
      }
      return num.toString();
    }
    static formatNumber(num) {
      if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + "M";
      } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + "K";
      }
      return num.toString();
    }
    renderWelcomeMessage(container) {
      container.innerHTML = `
      <!-- Welcome Message -->
      <div class="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg mb-8 border border-primary-100">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-primary-900 mb-2">
              👋 ようこそ、${this.currentUser.name}さん
            </h2>
            <p class="text-primary-700 text-sm">
              ${this.currentUser.tenantName || "Platform Gateway"} のダッシュボードです。
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
    renderLoadingCards() {
      return ["Users", "API Calls", "Storage", "Revenue"].map(() => `
      <div class="card stat-card">
        <div class="stat-icon">
          <div class="animate-pulse bg-gray-200 w-6 h-6 rounded"></div>
        </div>
        <div class="stat-content">
          <div class="animate-pulse bg-gray-200 h-4 w-20 rounded mb-2"></div>
          <div class="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
        </div>
      </div>
    `).join("");
    }
  }
  function showToast(type, message) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type} fade-in`;
    toast.innerHTML = `
    <div class="p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-${type === "error" ? "exclamation-circle" : type === "success" ? "check-circle" : "info-circle"} text-${type === "error" ? "danger" : type === "success" ? "success" : "primary"}-500"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-900">${message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5e3);
  }
  var __defProp$8 = Object.defineProperty;
  var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$7 = (obj, key, value) => __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$6 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class BillingComponent {
    constructor(apiService, currentUser) {
      __publicField$7(this, "apiService");
      __publicField$7(this, "currentUser");
      __publicField$7(this, "billingSummary", null);
      __publicField$7(this, "paymentMethods", []);
      __publicField$7(this, "invoices", []);
      __publicField$7(this, "currentView", "overview");
      this.apiService = apiService;
      this.currentUser = currentUser;
    }
    render(container, view = "billing/overview") {
      return __async$6(this, null, function* () {
        const viewParts = view.split("/");
        this.currentView = viewParts[1] || "overview";
        container.innerHTML = `
      <div class="billing-container">
        <div class="billing-tabs mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button class="billing-tab ${this.currentView === "overview" ? "active" : ""}" 
                    onclick="window.app.showBillingView('billing/overview')">
              <i class="fas fa-chart-pie mr-2"></i>
              請求概要
            </button>
            <button class="billing-tab ${this.currentView === "payments" ? "active" : ""}" 
                    onclick="window.app.showBillingView('billing/payments')">
              <i class="fas fa-credit-card mr-2"></i>
              支払い方法
            </button>
            <button class="billing-tab ${this.currentView === "invoices" ? "active" : ""}" 
                    onclick="window.app.showBillingView('billing/invoices')">
              <i class="fas fa-file-invoice mr-2"></i>
              請求書
            </button>
            <button class="billing-tab ${this.currentView === "connect" ? "active" : ""}" 
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
        window.app = window.app || {};
        Object.assign(window.app, {
          addPaymentMethod: this.addPaymentMethod.bind(this),
          setDefaultPaymentMethod: this.setDefaultPaymentMethod.bind(this),
          removePaymentMethod: this.removePaymentMethod.bind(this),
          downloadInvoice: this.downloadInvoice.bind(this),
          createConnectAccount: this.createConnectAccount.bind(this),
          continueOnboarding: this.continueOnboarding.bind(this),
          openStripeDashboard: this.openStripeDashboard.bind(this),
          updateAccountInfo: this.updateAccountInfo.bind(this)
        });
        this.showLoadingState();
        try {
          yield this.loadData();
          yield this.renderContent();
        } catch (error) {
          this.showErrorState();
        }
      });
    }
    loadData() {
      return __async$6(this, null, function* () {
        try {
          switch (this.currentView) {
            case "overview":
              yield this.loadOverviewData();
              break;
            case "payments":
              yield this.loadPaymentMethodsData();
              break;
            case "invoices":
              yield this.loadInvoicesData();
              break;
            case "connect":
              break;
            default:
              yield this.loadOverviewData();
          }
        } catch (error) {
          console.error("Failed to load billing data:", error);
          showToast("error", "請求データの読み込みに失敗しました");
        }
      });
    }
    loadOverviewData() {
      return __async$6(this, null, function* () {
        const [summaryResponse, methodsResponse] = yield Promise.all([
          this.apiService.call("GET", "/payment/billing-summary"),
          this.apiService.call("GET", "/payment/methods")
        ]);
        if (summaryResponse.success) {
          this.billingSummary = summaryResponse.data;
        }
        if (methodsResponse.success) {
          this.paymentMethods = methodsResponse.data;
        }
      });
    }
    loadPaymentMethodsData() {
      return __async$6(this, null, function* () {
        const methodsResponse = yield this.apiService.call("GET", "/payment/methods");
        if (methodsResponse.success) {
          this.paymentMethods = methodsResponse.data;
        }
      });
    }
    loadInvoicesData() {
      return __async$6(this, null, function* () {
        const invoicesResponse = yield this.apiService.call("GET", "/payment/invoices", { page: 1, limit: 10 });
        if (invoicesResponse.success) {
          this.invoices = invoicesResponse.data.data;
        }
      });
    }
    showLoadingState() {
      const contentContainer = document.getElementById("billing-content");
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
    showErrorState() {
      const contentContainer = document.getElementById("billing-content");
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
    renderContent() {
      return __async$6(this, null, function* () {
        const contentContainer = document.getElementById("billing-content");
        if (!contentContainer) return;
        switch (this.currentView) {
          case "overview":
            contentContainer.innerHTML = this.renderOverview();
            break;
          case "payments":
            contentContainer.innerHTML = this.renderPaymentMethods();
            break;
          case "invoices":
            contentContainer.innerHTML = this.renderInvoices();
            break;
          case "connect":
            contentContainer.innerHTML = this.renderStripeConnect();
            yield this.loadConnectStatus();
            break;
          default:
            contentContainer.innerHTML = this.renderOverview();
        }
      });
    }
    renderOverview() {
      var _a, _b, _c;
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
                <span class="font-semibold">${nextBillingDate ? new Date(nextBillingDate).toLocaleDateString("ja-JP") : "未設定"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">請求期間:</span>
                <span class="text-sm text-gray-500">
                  ${new Date(currentPeriod.start).toLocaleDateString("ja-JP")} - 
                  ${new Date(currentPeriod.end).toLocaleDateString("ja-JP")}
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
              ${((_a = tenant.limits) == null ? void 0 : _a.apiCalls) ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min(usageThisMonth.apiCalls / tenant.limits.apiCalls * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.apiCalls.toLocaleString()}まで
                </div>
              ` : ""}
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-1">
                ${usageThisMonth.users}
              </div>
              <div class="text-sm text-gray-500">ユーザー数</div>
              ${((_b = tenant.limits) == null ? void 0 : _b.users) ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min(usageThisMonth.users / tenant.limits.users * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.users.toLocaleString()}まで
                </div>
              ` : ""}
            </div>
            
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-1">
                ${usageThisMonth.storage.toFixed(1)} GB
              </div>
              <div class="text-sm text-gray-500">ストレージ</div>
              ${((_c = tenant.limits) == null ? void 0 : _c.storage) ? `
                <div class="mt-2 bg-gray-200 rounded-full h-2">
                  <div class="bg-primary-600 h-2 rounded-full" 
                       style="width: ${Math.min(usageThisMonth.storage / tenant.limits.storage * 100, 100)}%"></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  ${tenant.limits.storage} GBまで
                </div>
              ` : ""}
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
              ${this.invoices.slice(0, 3).map((invoice) => `
                <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div class="flex items-center space-x-3">
                    <i class="fas fa-file-invoice text-gray-400"></i>
                    <div>
                      <div class="font-medium text-gray-900">${invoice.number}</div>
                      <div class="text-sm text-gray-500">${new Date(invoice.createdAt).toLocaleDateString("ja-JP")}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="font-semibold">$${(invoice.amount / 100).toFixed(2)}</span>
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${invoice.status === "paid" ? "bg-green-100 text-green-800" : invoice.status === "open" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}">
                      ${invoice.status === "paid" ? "支払済" : invoice.status === "open" ? "未払い" : invoice.status}
                    </span>
                  </div>
                </div>
              `).join("")}
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
    renderPaymentMethods() {
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
            ${this.paymentMethods.map((method) => `
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
                      追加日: ${new Date(method.createdAt).toLocaleDateString("ja-JP")}
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
            `).join("")}
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
    renderInvoices() {
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
                ${this.invoices.map((invoice) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <i class="fas fa-file-invoice text-gray-400 mr-3"></i>
                        <div>
                          <div class="font-medium text-gray-900">${invoice.number}</div>
                          <div class="text-sm text-gray-500">${invoice.description || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-gray-900">
                        $${(invoice.amount / 100).toFixed(2)} ${invoice.currency.toUpperCase()}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${invoice.status === "paid" ? "bg-green-100 text-green-800" : invoice.status === "open" ? "bg-yellow-100 text-yellow-800" : invoice.status === "draft" ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800"}">
                        ${invoice.status === "paid" ? "支払済" : invoice.status === "open" ? "未払い" : invoice.status === "draft" ? "下書き" : invoice.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(invoice.dueDate).toLocaleDateString("ja-JP")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(invoice.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onclick="window.app.downloadInvoice('${invoice.id}')" 
                              class="text-primary-600 hover:text-primary-700">
                        <i class="fas fa-download mr-1"></i>
                        ダウンロード
                      </button>
                    </td>
                  </tr>
                `).join("")}
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
    renderStripeConnect() {
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
    loadConnectStatus() {
      return __async$6(this, null, function* () {
        try {
          const response = yield this.apiService.call("GET", "/payment/connect-account/status");
          const container = document.getElementById("connect-status-container");
          if (!container) return;
          if (response.success) {
            const account = response.data;
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
          console.error("Failed to load connect status:", error);
        }
      });
    }
    renderConnectStatus(account) {
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
      const statusColor = account.status === "enabled" ? "green" : account.status === "restricted" ? "yellow" : "red";
      const statusText = account.status === "enabled" ? "有効" : account.status === "restricted" ? "制限中" : account.status === "pending" ? "設定中" : "無効";
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
              <div class="text-2xl font-bold ${account.chargesEnabled ? "text-green-600" : "text-red-600"} mb-1">
                <i class="fas fa-${account.chargesEnabled ? "check-circle" : "times-circle"}"></i>
              </div>
              <div class="text-sm text-gray-600">支払い受取</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.chargesEnabled ? "有効" : "無効"}
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold ${account.payoutsEnabled ? "text-green-600" : "text-red-600"} mb-1">
                <i class="fas fa-${account.payoutsEnabled ? "check-circle" : "times-circle"}"></i>
              </div>
              <div class="text-sm text-gray-600">出金</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.payoutsEnabled ? "有効" : "無効"}
              </div>
            </div>
            
            <div class="text-center">
              <div class="text-2xl font-bold ${account.detailsSubmitted ? "text-green-600" : "text-yellow-600"} mb-1">
                <i class="fas fa-${account.detailsSubmitted ? "check-circle" : "clock"}"></i>
              </div>
              <div class="text-sm text-gray-600">詳細情報</div>
              <div class="text-xs text-gray-500 mt-1">
                ${account.detailsSubmitted ? "提出済" : "未提出"}
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
                  ${account.requirements.past_due.map((req) => `<li>${req}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            
            ${account.requirements.currently_due.length > 0 ? `
              <div class="mb-4">
                <h4 class="font-medium text-yellow-800 mb-2">対応が必要な項目:</h4>
                <ul class="list-disc list-inside text-yellow-700 space-y-1">
                  ${account.requirements.currently_due.map((req) => `<li>${req}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            
            <button onclick="window.app.continueOnboarding()" 
                    class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 font-medium">
              <i class="fas fa-arrow-right mr-2"></i>
              設定を続ける
            </button>
          </div>
        ` : ""}

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
    showView(view) {
      window.location.hash = view;
    }
    addPaymentMethod() {
      showToast("info", "デモモード: 支払い方法の追加機能");
    }
    setDefaultPaymentMethod(methodId) {
      return __async$6(this, null, function* () {
        try {
          const response = yield this.apiService.call("POST", `/payment/methods/${methodId}/set-default`);
          if (response.success) {
            showToast("success", "デフォルト支払い方法を更新しました");
            yield this.loadData();
            yield this.renderContent();
          } else {
            showToast("error", response.error || "デフォルト支払い方法の設定に失敗しました");
          }
        } catch (error) {
          showToast("error", "エラーが発生しました");
        }
      });
    }
    removePaymentMethod(methodId) {
      return __async$6(this, null, function* () {
        if (!confirm("この支払い方法を削除しますか？")) {
          return;
        }
        try {
          const response = yield this.apiService.call("DELETE", `/payment/methods/${methodId}`);
          if (response.success) {
            showToast("success", "支払い方法を削除しました");
            yield this.loadData();
            yield this.renderContent();
          } else {
            showToast("error", response.error || "支払い方法の削除に失敗しました");
          }
        } catch (error) {
          showToast("error", "エラーが発生しました");
        }
      });
    }
    downloadInvoice(invoiceId) {
      return __async$6(this, null, function* () {
        var _a;
        try {
          const response = yield this.apiService.call("GET", `/payment/invoices/${invoiceId}/download`);
          if (response.success && ((_a = response.data) == null ? void 0 : _a.downloadUrl)) {
            window.open(response.data.downloadUrl, "_blank");
            showToast("success", "請求書のダウンロードを開始しました");
          } else {
            showToast("error", "請求書のダウンロードに失敗しました");
          }
        } catch (error) {
          showToast("error", "エラーが発生しました");
        }
      });
    }
    createConnectAccount() {
      return __async$6(this, null, function* () {
        try {
          showToast("info", "Stripe Connectアカウントを作成中...");
          const response = yield this.apiService.call("POST", "/payment/connect-account", {
            country: "US",
            type: "express"
          });
          if (response.success) {
            showToast("success", "Stripe Connectアカウントを作成しました");
            yield this.loadConnectStatus();
          } else {
            showToast("error", response.error || "アカウント作成に失敗しました");
          }
        } catch (error) {
          showToast("error", "エラーが発生しました");
        }
      });
    }
    continueOnboarding() {
      showToast("info", "デモモード: Stripeオンボーディング");
    }
    openStripeDashboard() {
      showToast("info", "デモモード: Stripeダッシュボードを開く");
    }
    updateAccountInfo() {
      showToast("info", "デモモード: アカウント情報を更新");
    }
  }
  var __defProp$7 = Object.defineProperty;
  var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$6 = (obj, key, value) => __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$5 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class PlatformGatewayApp {
    constructor() {
      __publicField$6(this, "state");
      __publicField$6(this, "apiService");
      __publicField$6(this, "navigation", null);
      this.state = {
        currentUser: null,
        currentTenant: null,
        currentPage: "dashboard",
        apiBaseUrl: "/api"
      };
      this.apiService = new ApiService(this.state.apiBaseUrl);
      if (typeof window.dayjs !== "undefined" && typeof window.dayjs_plugin_relativeTime !== "undefined") {
        window.dayjs.extend(window.dayjs_plugin_relativeTime);
      } else {
        console.warn("Day.js or relativeTime plugin not loaded");
      }
      window.app = {
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
    init() {
      return __async$5(this, null, function* () {
        console.log("🔄 Checking authentication status...");
        yield this.checkAuth();
        console.log("🗺️ Initializing routing...");
        this.initRouting();
        console.log("🎨 Rendering initial page...");
        this.renderPage();
        console.log("⏰ Starting auto-refresh...");
        this.startAutoRefresh();
        window.Navigation = Navigation;
        console.log("✅ App initialization completed successfully");
      });
    }
    initRouting() {
      window.addEventListener("popstate", (event) => {
        const page = window.location.hash.slice(1) || "dashboard";
        console.log("🔙 Browser navigation:", page);
        this.navigateTo(page, false);
      });
      const initialPage = window.location.hash.slice(1) || "dashboard";
      this.state.currentPage = initialPage;
      console.log("🏠 Initial page:", initialPage);
    }
    navigateTo(page, pushToHistory = true) {
      console.log("🧭 Navigating to:", page);
      this.state.currentPage = page;
      if (pushToHistory && window.location.hash.slice(1) !== page) {
        window.location.hash = page;
      }
      this.renderNavigation();
      this.renderPageContent();
    }
    checkAuth() {
      return __async$5(this, null, function* () {
        try {
          let token = localStorage.getItem("auth_token");
          if (!token) {
            console.log("🎭 Demo Mode: Auto-login activated");
            token = "demo_jwt_token_" + Date.now();
            localStorage.setItem("auth_token", token);
            localStorage.setItem("demo_mode", "true");
            this.state.currentUser = {
              id: "user-123",
              email: "admin@example.com",
              name: "John Doe (Demo User)",
              avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format",
              roles: ["admin", "tenant_owner"],
              tenantId: "tenant-abc-corp",
              tenantName: "ABC Corporation",
              isActive: true,
              lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
              createdAt: "2025-09-01T09:00:00Z",
              updatedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            console.log("🎭 Demo user logged in automatically:", this.state.currentUser);
            return;
          }
          const response = yield this.apiService.call("GET", "/auth/me", null, token);
          if (response.success) {
            this.state.currentUser = response.data;
            console.log("Authenticated user:", this.state.currentUser);
          } else {
            console.log("🎭 Invalid token, switching to demo mode");
            localStorage.removeItem("auth_token");
            yield this.checkAuth();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          console.log("🎭 Error occurred, switching to demo mode");
          localStorage.removeItem("auth_token");
          yield this.checkAuth();
        }
      });
    }
    renderPage() {
      console.log("🎨 renderPage called");
      const appContainer = document.getElementById("app");
      if (!appContainer) {
        console.error("❌ App container not found");
        return;
      }
      if (!this.state.currentUser) {
        console.log("🔐 User not authenticated, showing login page");
        this.showLoginPage();
        return;
      }
      console.log("👤 User authenticated, rendering main layout");
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
                     src="${this.state.currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format"}" 
                     alt="${this.state.currentUser.name}">
                <div class="ml-3">
                  <p class="text-sm font-medium text-gray-700">
                    ${this.state.currentUser.name}
                    ${localStorage.getItem("demo_mode") === "true" ? '<span class="text-green-600 text-xs ml-1">🎭</span>' : ""}
                  </p>
                  <div class="relative">
                    <button class="text-xs text-gray-500 hover:text-gray-700" onclick="window.app.toggleUserMenu()" id="user-menu-button">
                      ${this.state.currentUser.tenantName || "Platform Admin"} <i class="fas fa-chevron-down ml-1"></i>
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
        ${localStorage.getItem("demo_mode") === "true" && localStorage.getItem("demo_banner_hidden") !== "true" ? `
        <div class="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 text-center text-sm">
          <i class="fas fa-magic mr-2"></i>
          <strong>🎭 DEMO MODE</strong> - This is a fully functional UI prototype with mock data
          <button onclick="window.app.hideDemoBanner()" class="ml-4 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ` : ""}

        <!-- Main content -->
        <div class="flex-1 overflow-hidden">
          <div class="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <div class="flex-1 px-4 flex justify-between items-center">
              <div class="flex-1">
                <h2 class="text-2xl font-bold text-gray-900" id="page-title">Dashboard</h2>
              </div>
              <div class="ml-4 flex items-center md:ml-6">
                ${localStorage.getItem("demo_mode") === "true" ? `
                <div class="mr-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  <i class="fas fa-magic mr-1"></i>
                  Demo Mode
                </div>
                ` : ""}
                
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
      console.log("📋 Rendering navigation...");
      this.renderNavigation();
      console.log("📄 Rendering page content...");
      this.renderPageContent();
      console.log("✅ Page render completed");
    }
    renderNavigation() {
      const navContainer = document.getElementById("sidebar-nav");
      if (!navContainer || !this.state.currentUser) return;
      this.navigation = new Navigation(this.state.currentPage, this.state.currentUser);
      this.navigation.render(navContainer);
    }
    renderPageContent() {
      return __async$5(this, null, function* () {
        const contentContainer = document.getElementById("page-content");
        const titleContainer = document.getElementById("page-title");
        if (!contentContainer || !titleContainer || !this.state.currentUser) return;
        if (this.state.currentPage === "dashboard" || this.state.currentPage === "") {
          titleContainer.textContent = "Dashboard";
          const dashboard = new Dashboard(this.apiService, this.state.currentUser);
          yield dashboard.render(contentContainer);
        } else if (this.state.currentPage.startsWith("billing/") || this.state.currentPage === "billing") {
          const billingView = this.state.currentPage === "billing" ? "billing/overview" : this.state.currentPage;
          titleContainer.textContent = this.getPageTitle(billingView);
          const billingComponent = new BillingComponent(this.apiService, this.state.currentUser);
          yield billingComponent.render(contentContainer, billingView);
        } else if (this.state.currentPage.startsWith("profile/")) {
          const profileView = this.state.currentPage.split("/")[1] || "personal";
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const { ProfileComponent: ProfileComponent2 } = yield __vitePreload(() => Promise.resolve().then(() => ProfileComponent$1), false ? __VITE_PRELOAD__ : void 0);
          const profileComponent = new ProfileComponent2(this.state.currentUser);
          profileComponent.render(contentContainer, profileView);
        } else if (this.state.currentPage.startsWith("tenant/")) {
          const tenantView = this.state.currentPage.split("/")[1] || "profile";
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const { TenantComponent: TenantComponent2 } = yield __vitePreload(() => Promise.resolve().then(() => TenantComponent$1), false ? __VITE_PRELOAD__ : void 0);
          const tenantComponent = new TenantComponent2(this.state.currentUser);
          yield tenantComponent.render(contentContainer, tenantView);
        } else if (this.state.currentPage.startsWith("admin-payment/")) {
          const adminPaymentView = this.state.currentPage.split("/")[1] || "schedule";
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const { AdminPaymentComponent: AdminPaymentComponent2 } = yield __vitePreload(() => Promise.resolve().then(() => AdminPaymentComponent$1), false ? __VITE_PRELOAD__ : void 0);
          const adminPaymentComponent = new AdminPaymentComponent2(this.apiService, this.state.currentUser);
          yield adminPaymentComponent.render(contentContainer, adminPaymentView);
        } else if (this.state.currentPage.startsWith("tenant-finance/")) {
          const tenantFinanceView = this.state.currentPage.split("/")[1] || "overview";
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const { TenantFinanceComponent: TenantFinanceComponent2 } = yield __vitePreload(() => Promise.resolve().then(() => TenantFinanceComponent$1), false ? __VITE_PRELOAD__ : void 0);
          const tenantFinanceComponent = new TenantFinanceComponent2(this.apiService, this.state.currentUser);
          yield tenantFinanceComponent.render(contentContainer, tenantFinanceView);
        } else if (this.state.currentPage.startsWith("user-payment/")) {
          const userPaymentView = this.state.currentPage.split("/")[1] || "overview";
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const { UserPaymentComponent: UserPaymentComponent2 } = yield __vitePreload(() => Promise.resolve().then(() => UserPaymentComponent$1), false ? __VITE_PRELOAD__ : void 0);
          const userPaymentComponent = new UserPaymentComponent2(this.apiService, this.state.currentUser);
          yield userPaymentComponent.render(contentContainer, userPaymentView);
        } else if (this.state.currentPage === "analytics" || this.state.currentPage === "reports") {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          const dashboard = new Dashboard(this.apiService, this.state.currentUser);
          yield dashboard.render(contentContainer);
        } else if (this.state.currentPage.startsWith("users/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "users");
        } else if (this.state.currentPage.startsWith("api/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "api");
        } else if (this.state.currentPage.startsWith("monitoring/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "monitoring");
        } else if (this.state.currentPage.startsWith("integrations/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "integrations");
        } else if (this.state.currentPage.startsWith("settings/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "settings");
        } else if (this.state.currentPage.startsWith("admin/")) {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "admin");
        } else {
          titleContainer.textContent = this.getPageTitle(this.state.currentPage);
          contentContainer.innerHTML = this.renderPlaceholderPage(this.state.currentPage, "default");
        }
      });
    }
    renderPlaceholderPage(page, category) {
      const pageTitle = this.getPageTitle(page);
      const categoryIcons = {
        "users": "fas fa-users",
        "api": "fas fa-code",
        "monitoring": "fas fa-chart-bar",
        "integrations": "fas fa-puzzle-piece",
        "settings": "fas fa-cog",
        "admin": "fas fa-tools",
        "default": "fas fa-cog"
      };
      const categoryDescriptions = {
        "users": "ユーザー管理機能",
        "api": "API管理機能",
        "monitoring": "モニタリング機能",
        "integrations": "連携管理機能",
        "settings": "設定機能",
        "admin": "管理者機能",
        "default": "システム機能"
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
    getPageTitle(page) {
      const titles = {
        // Dashboard & Analytics
        "dashboard": "Dashboard",
        "analytics": "Analytics",
        "reports": "Reports",
        // User Management
        "tenants": "テナント管理",
        "users": "ユーザー管理",
        "users/list": "ユーザー一覧",
        "users/create": "ユーザー追加",
        "users/roles": "ロール・権限管理",
        "users/invitations": "招待管理",
        // API Management
        "api": "API管理",
        "api/keys": "APIキー管理",
        "api/endpoints": "エンドポイント管理",
        "api/documentation": "API ドキュメント",
        "api/testing": "APIテスト",
        // Billing & Payments
        "billing": "請求管理",
        "billing/overview": "請求概要",
        "billing/payments": "支払い方法",
        "billing/invoices": "請求書",
        "billing/subscription": "サブスクリプション",
        "billing/connect": "Stripe Connect",
        // Profile Management
        "profile/personal": "個人情報",
        "profile/security": "セキュリティ設定",
        "profile/preferences": "設定",
        // Tenant Management
        "tenant/profile": "組織プロフィール",
        "tenant/settings": "組織設定",
        "tenant/branding": "ブランディング",
        // Admin Payment Management
        "admin-payment/schedule": "支払いスケジュール管理",
        "admin-payment/fees": "手数料管理",
        "admin-payment/transactions": "プラットフォーム取引履歴",
        "admin-payment/analytics": "決済分析",
        // Tenant Finance Management
        "tenant-finance/overview": "財務概要",
        "tenant-finance/transactions": "取引履歴",
        "tenant-finance/payouts": "出金管理",
        "tenant-finance/settings": "決済設定",
        // User Payment Management
        "user-payment/overview": "決済管理",
        "user-payment/methods": "決済方法管理",
        "user-payment/services": "サービス連携",
        "user-payment/history": "支払い履歴",
        // Monitoring & Performance
        "monitoring": "モニタリング",
        "monitoring/usage": "使用量メトリクス",
        "monitoring/performance": "パフォーマンス",
        "monitoring/logs": "アクティビティログ",
        "monitoring/health": "システムヘルス",
        "monitoring/alerts": "アラート",
        // Integrations
        "integrations": "連携管理",
        "integrations/webhooks": "Webhook管理",
        "integrations/sso": "SSO設定",
        "integrations/third-party": "サードパーティサービス",
        "integrations/marketplace": "アプリマーケットプレイス",
        // Settings
        "settings": "設定",
        "settings/general": "一般設定",
        "settings/security": "セキュリティ設定",
        "settings/notifications": "通知設定",
        "settings/preferences": "個人設定",
        "settings/branding": "ブランディング",
        // Admin Console
        "admin": "管理コンソール",
        "admin/platform": "プラットフォーム概要",
        "admin/tenants": "テナント管理",
        "admin/users": "グローバルユーザー管理",
        "admin/system": "システム設定",
        "admin/maintenance": "メンテナンス"
      };
      return titles[page] || "ページ";
    }
    getPageType(page) {
      const pageMap = {
        "analytics": "dashboard",
        "reports": "dashboard",
        "tenants": "tenants",
        "users": "users",
        "users/list": "users",
        "users/create": "users",
        "users/roles": "users",
        "users/invitations": "users",
        "api/keys": "api",
        "api/endpoints": "api",
        "api/documentation": "api",
        "api/testing": "api",
        "billing/overview": "billing",
        "billing/invoices": "billing",
        "billing/payments": "billing",
        "billing/subscription": "billing",
        "billing/connect": "billing",
        "monitoring/usage": "monitoring",
        "monitoring/performance": "monitoring",
        "monitoring/logs": "monitoring",
        "monitoring/health": "monitoring",
        "monitoring/alerts": "monitoring",
        "integrations/webhooks": "integrations",
        "integrations/sso": "integrations",
        "integrations/third-party": "integrations",
        "integrations/marketplace": "integrations",
        "settings/general": "settings",
        "settings/security": "settings",
        "settings/notifications": "settings",
        "settings/preferences": "settings",
        "settings/branding": "settings",
        "admin/platform": "admin",
        "admin/tenants": "admin",
        "admin/users": "admin",
        "admin/system": "admin",
        "admin/maintenance": "admin"
      };
      return pageMap[page] || page;
    }
    showLoginPage() {
      const appContainer = document.getElementById("app");
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
    startAutoRefresh() {
      setInterval(() => {
        if (this.state.currentPage === "dashboard" && this.state.currentUser) {
          this.renderPageContent();
        }
      }, 5 * 60 * 1e3);
    }
    // Public methods (exposed to window.app)
    loginWithRole() {
      const roleSelect = document.getElementById("demo-role-select");
      const selectedRole = roleSelect ? roleSelect.value : "super_admin";
      console.log(`🎭 Demo: Logging in with role: ${selectedRole}`);
      localStorage.setItem("demo_user_role", selectedRole);
      const demoToken = "demo_jwt_token_" + Date.now();
      localStorage.setItem("auth_token", demoToken);
      localStorage.setItem("demo_mode", "true");
      const roleConfig = {
        "super_admin": {
          roles: ["super_admin"],
          name: "Admin User (管理者)",
          email: "admin@example.com"
        },
        "tenant_owner": {
          roles: ["tenant_owner"],
          name: "Tenant Owner (テナント運営者)",
          email: "owner@abc-corp.com"
        },
        "user": {
          roles: ["user"],
          name: "Regular User (利用者)",
          email: "user@abc-corp.com"
        }
      };
      const userConfig = roleConfig[selectedRole] || roleConfig["super_admin"];
      this.state.currentUser = {
        id: "user-123",
        email: userConfig.email,
        name: userConfig.name,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format",
        roles: userConfig.roles,
        tenantId: "tenant-abc-corp",
        tenantName: "ABC Corporation",
        isActive: true,
        lastLoginAt: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: "2024-09-01T09:00:00Z",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log(`✅ Logged in as ${userConfig.name}:`, this.state.currentUser);
      this.renderPage();
    }
    bypassLogin() {
      localStorage.setItem("demo_user_role", "super_admin");
      this.loginWithRole();
      window.location.hash = "dashboard";
      this.renderPage();
      setTimeout(() => {
        showToast("success", "🎭 Demo mode activated! Welcome to Platform Gateway");
      }, 500);
    }
    logout() {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("demo_mode");
      this.state.currentUser = null;
      window.location.hash = "";
      this.showLoginPage();
    }
    toggleUserMenu() {
      const menu = document.getElementById("user-menu");
      if (menu) {
        menu.classList.toggle("hidden");
      }
    }
    hideDemoBanner() {
      localStorage.setItem("demo_banner_hidden", "true");
      this.renderPage();
    }
    showBillingView(view) {
      window.location.hash = view;
    }
  }
  var __defProp$6 = Object.defineProperty;
  var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$5 = (obj, key, value) => __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _HelpGuide = class _HelpGuide2 {
    static show(page) {
      this.currentPage = page;
      this.isVisible = true;
      this.render();
    }
    static hide() {
      this.isVisible = false;
      const overlay = document.getElementById("help-guide-overlay");
      if (overlay) {
        overlay.remove();
      }
    }
    static toggle(page) {
      if (this.isVisible && this.currentPage === page) {
        this.hide();
      } else {
        this.show(page);
      }
    }
    static render() {
      this.hide();
      const overlay = document.createElement("div");
      overlay.id = "help-guide-overlay";
      overlay.className = "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4";
      overlay.onclick = (e) => {
        if (e.target === overlay) this.hide();
      };
      const modal = document.createElement("div");
      modal.className = "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto";
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
      window.HelpGuide = _HelpGuide2;
    }
    static getPageTitle() {
      const titles = {
        "login": "ログイン画面",
        "dashboard": "ダッシュボード",
        "analytics": "分析画面",
        "reports": "レポート",
        "tenants": "テナント管理",
        "users": "ユーザー管理",
        "api": "API管理",
        "billing": "課金・支払い",
        "monitoring": "監視・モニタリング",
        "integrations": "統合設定",
        "settings": "設定",
        "admin": "管理者コンソール"
      };
      return titles[this.currentPage] || "ページ";
    }
    static getHelpContent() {
      switch (this.currentPage) {
        case "login":
          return this.getLoginHelp();
        case "dashboard":
          return this.getDashboardHelp();
        case "users":
          return this.getUsersHelp();
        case "tenants":
          return this.getTenantsHelp();
        case "api":
          return this.getApiHelp();
        case "billing":
          return this.getBillingHelp();
        case "monitoring":
          return this.getMonitoringHelp();
        case "settings":
          return this.getSettingsHelp();
        case "admin":
          return this.getAdminHelp();
        default:
          return this.getGenericHelp();
      }
    }
    static getLoginHelp() {
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
    static getDashboardHelp() {
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
    static getUsersHelp() {
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
    static getTenantsHelp() {
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
    static getApiHelp() {
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
    static getBillingHelp() {
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
    static getMonitoringHelp() {
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
    static getSettingsHelp() {
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
    static getAdminHelp() {
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
    static getGenericHelp() {
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
  };
  __publicField$5(_HelpGuide, "isVisible", false);
  __publicField$5(_HelpGuide, "currentPage", "");
  let HelpGuide = _HelpGuide;
  var __defProp$5 = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp$5(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp$5(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  let app;
  function initializeApp() {
    try {
      console.log("🚀 Initializing Platform Gateway App...");
      app = new PlatformGatewayApp();
      window.app = __spreadProps(__spreadValues({}, app), {
        bypassLogin: () => app.bypassLogin(),
        logout: () => app.logout(),
        toggleUserMenu: () => app.toggleUserMenu(),
        hideDemoBanner: () => app.hideDemoBanner(),
        toggleNavSection: (sectionId) => {
          Navigation.toggleNavSection(sectionId);
        }
      });
      window.HelpGuide = HelpGuide;
      console.log("✅ Platform Gateway App initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Platform Gateway App:", error);
      const appElement = document.getElementById("app");
      if (appElement) {
        appElement.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 class="text-xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p class="text-gray-600">Failed to initialize the application. Please refresh the page.</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Refresh Page
            </button>
          </div>
        </div>
      `;
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
  setTimeout(() => {
    if (!app) {
      console.warn("⚠️ App not initialized after 2 seconds, trying again...");
      initializeApp();
    }
  }, 2e3);
  window.PlatformGatewayApp = app;
  var __defProp$4 = Object.defineProperty;
  var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$4 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class ProfileComponent {
    constructor(currentUser) {
      __publicField$4(this, "currentUser");
      __publicField$4(this, "currentView");
      this.currentUser = currentUser;
      this.currentView = "personal";
    }
    render(container, view = "personal") {
      if (!container) return;
      this.currentView = view;
      switch (view) {
        case "personal":
          this.renderPersonalInfo(container);
          break;
        case "security":
          this.renderSecuritySettings(container);
          break;
        case "preferences":
          this.renderPreferences(container);
          break;
        default:
          this.renderPersonalInfo(container);
      }
    }
    renderPersonalInfo(container) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-id-card mr-3 text-primary-600"></i>
            個人情報
          </h1>
          <p class="mt-2 text-gray-600">
            あなたのプロフィール情報を管理します
          </p>
        </div>

        <!-- Profile Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <form id="profile-form" class="space-y-6">
            <!-- Profile Picture Section -->
            <div class="flex items-center space-x-6">
              <div class="shrink-0">
                <img class="h-20 w-20 rounded-full object-cover bg-gray-200" 
                     src="${((_a = this.currentUser) == null ? void 0 : _a.avatar) || "/static/default-avatar.svg"}" 
                     alt="Profile Picture" 
                     id="profile-avatar">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール画像
                </label>
                <input type="file" 
                       id="avatar-input" 
                       accept="image/*" 
                       class="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100">
              </div>
            </div>

            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="first-name" class="block text-sm font-medium text-gray-700 mb-2">
                  名前 <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       id="first-name" 
                       value="${((_b = this.currentUser) == null ? void 0 : _b.name) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="last-name" class="block text-sm font-medium text-gray-700 mb-2">
                  姓
                </label>
                <input type="text" 
                       id="last-name" 
                       value="${((_c = this.currentUser) == null ? void 0 : _c.lastName) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span class="text-red-500">*</span>
                </label>
                <input type="email" 
                       id="email" 
                       value="${((_d = this.currentUser) == null ? void 0 : _d.email) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input type="tel" 
                       id="phone" 
                       value="${((_e = this.currentUser) == null ? void 0 : _e.phone) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Additional Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="company" class="block text-sm font-medium text-gray-700 mb-2">
                  会社名
                </label>
                <input type="text" 
                       id="company" 
                       value="${((_f = this.currentUser) == null ? void 0 : _f.company) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                  部署
                </label>
                <input type="text" 
                       id="department" 
                       value="${((_g = this.currentUser) == null ? void 0 : _g.department) || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              </div>
            </div>

            <!-- Bio -->
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea id="bio" 
                        rows="4" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="あなたについて簡単に教えてください...">${((_h = this.currentUser) == null ? void 0 : _h.bio) || ""}</textarea>
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

        <!-- Account Information -->
        <div class="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">アカウント情報</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">ユーザーID:</span>
              <span class="ml-2 font-mono text-gray-900">${((_i = this.currentUser) == null ? void 0 : _i.id) || "N/A"}</span>
            </div>
            <div>
              <span class="text-gray-600">アカウント作成日:</span>
              <span class="ml-2 text-gray-900">${((_j = this.currentUser) == null ? void 0 : _j.createdAt) ? new Date(this.currentUser.createdAt).toLocaleDateString("ja-JP") : "N/A"}</span>
            </div>
            <div>
              <span class="text-gray-600">最終ログイン:</span>
              <span class="ml-2 text-gray-900">${((_k = this.currentUser) == null ? void 0 : _k.lastLogin) ? new Date(this.currentUser.lastLogin).toLocaleString("ja-JP") : "N/A"}</span>
            </div>
            <div>
              <span class="text-gray-600">ロール:</span>
              <span class="ml-2">
                ${((_m = (_l = this.currentUser) == null ? void 0 : _l.roles) == null ? void 0 : _m.map((role) => {
        const roleLabels = {
          "super_admin": "管理者",
          "tenant_owner": "テナント運営者",
          "user": "利用者"
        };
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">${roleLabels[role] || role}</span>`;
      }).join(" ")) || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
      this.attachEventListeners();
    }
    renderSecuritySettings(container) {
      container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-shield-alt mr-3 text-primary-600"></i>
            セキュリティ設定
          </h1>
          <p class="mt-2 text-gray-600">
            アカウントのセキュリティを管理します
          </p>
        </div>

        <!-- Password Change -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h3>
          <form id="password-form" class="space-y-4">
            <div>
              <label for="current-password" class="block text-sm font-medium text-gray-700 mb-2">
                現在のパスワード <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="current-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="new-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <p class="mt-1 text-xs text-gray-600">
                8文字以上で、大文字、小文字、数字を含む必要があります
              </p>
            </div>
            <div>
              <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
                パスワード確認 <span class="text-red-500">*</span>
              </label>
              <input type="password" 
                     id="confirm-password" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
            </div>
            <div class="flex justify-end">
              <button type="submit" 
                      class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                <i class="fas fa-key mr-2"></i>
                パスワードを更新
              </button>
            </div>
          </form>
        </div>

        <!-- Two-Factor Authentication -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">二段階認証</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-700">アカウントのセキュリティを強化するために二段階認証を設定します</p>
              <p class="text-sm text-gray-600 mt-1">
                現在のステータス: 
                <span class="text-red-600 font-medium">無効</span>
              </p>
            </div>
            <button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <i class="fas fa-mobile-alt mr-2"></i>
              有効にする
            </button>
          </div>
        </div>

        <!-- Session Management -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">セッション管理</h3>
          <p class="text-gray-700 mb-4">他のデバイスでのアクティブなセッションを管理します</p>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-laptop text-green-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">現在のセッション</p>
                  <p class="text-sm text-gray-600">Chrome on Windows • 現在</p>
                </div>
              </div>
              <span class="text-green-600 text-sm font-medium">アクティブ</span>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-mobile-alt text-gray-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">iPhone Safari</p>
                  <p class="text-sm text-gray-600">2時間前</p>
                </div>
              </div>
              <button class="text-red-600 text-sm font-medium hover:text-red-800">
                終了
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t">
            <button class="text-red-600 hover:text-red-800 font-medium">
              <i class="fas fa-sign-out-alt mr-2"></i>
              すべてのセッションを終了
            </button>
          </div>
        </div>
      </div>
    `;
      this.attachSecurityEventListeners();
    }
    renderPreferences(container) {
      container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-user-cog mr-3 text-primary-600"></i>
            設定
          </h1>
          <p class="mt-2 text-gray-600">
            あなたの使用設定をカスタマイズします
          </p>
        </div>

        <!-- Language and Localization -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">言語と地域</h3>
          <div class="space-y-4">
            <div>
              <label for="language" class="block text-sm font-medium text-gray-700 mb-2">
                言語
              </label>
              <select id="language" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="ja">日本語</option>
                <option value="en">English</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <div>
              <label for="timezone" class="block text-sm font-medium text-gray-700 mb-2">
                タイムゾーン
              </label>
              <select id="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notification Preferences -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">通知設定</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">メール通知</p>
                <p class="text-sm text-gray-600">重要な更新やお知らせをメールで受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">プッシュ通知</p>
                <p class="text-sm text-gray-600">ブラウザでのプッシュ通知を受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">SMS通知</p>
                <p class="text-sm text-gray-600">緊急時のSMS通知を受信</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Display Preferences -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">表示設定</h3>
          <div class="space-y-4">
            <div>
              <label for="theme" class="block text-sm font-medium text-gray-700 mb-2">
                テーマ
              </label>
              <select id="theme" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="light">ライト</option>
                <option value="dark">ダーク</option>
                <option value="auto">システム設定に従う</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">デンスモード</p>
                <p class="text-sm text-gray-600">コンパクトな表示でより多くの情報を表示</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
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
      this.attachPreferencesEventListeners();
    }
    attachEventListeners() {
      const profileForm = document.getElementById("profile-form");
      if (profileForm) {
        profileForm.addEventListener("submit", this.handleProfileSubmit.bind(this));
      }
      const avatarInput = document.getElementById("avatar-input");
      if (avatarInput) {
        avatarInput.addEventListener("change", this.handleAvatarChange.bind(this));
      }
    }
    attachSecurityEventListeners() {
      const passwordForm = document.getElementById("password-form");
      if (passwordForm) {
        passwordForm.addEventListener("submit", this.handlePasswordSubmit.bind(this));
      }
    }
    attachPreferencesEventListeners() {
      const preferences = ["language", "timezone", "theme"];
      preferences.forEach((pref) => {
        const element = document.getElementById(pref);
        if (element) {
          element.addEventListener("change", this.handlePreferenceChange.bind(this));
        }
      });
    }
    handleProfileSubmit(event) {
      return __async$4(this, null, function* () {
        event.preventDefault();
        const formData = new FormData();
        formData.append("name", document.getElementById("first-name").value);
        formData.append("lastName", document.getElementById("last-name").value);
        formData.append("email", document.getElementById("email").value);
        formData.append("phone", document.getElementById("phone").value);
        formData.append("company", document.getElementById("company").value);
        formData.append("department", document.getElementById("department").value);
        formData.append("bio", document.getElementById("bio").value);
        try {
          const response = yield ApiService.updateUserProfile(formData);
          if (response.success) {
            this.showSuccessMessage("プロフィールが正常に更新されました");
          } else {
            this.showErrorMessage("プロフィールの更新に失敗しました");
          }
        } catch (error) {
          console.error("Profile update error:", error);
          this.showErrorMessage("プロフィールの更新中にエラーが発生しました");
        }
      });
    }
    handlePasswordSubmit(event) {
      return __async$4(this, null, function* () {
        event.preventDefault();
        const currentPassword = document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        if (newPassword !== confirmPassword) {
          this.showErrorMessage("新しいパスワードが一致しません");
          return;
        }
        try {
          const response = yield ApiService.changePassword({
            currentPassword,
            newPassword
          });
          if (response.success) {
            this.showSuccessMessage("パスワードが正常に更新されました");
            document.getElementById("password-form").reset();
          } else {
            this.showErrorMessage("パスワードの更新に失敗しました");
          }
        } catch (error) {
          console.error("Password change error:", error);
          this.showErrorMessage("パスワードの更新中にエラーが発生しました");
        }
      });
    }
    handleAvatarChange(event) {
      var _a;
      const input = event.target;
      const file = (_a = input.files) == null ? void 0 : _a[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          var _a2;
          const avatarImg = document.getElementById("profile-avatar");
          if (avatarImg && ((_a2 = e.target) == null ? void 0 : _a2.result)) {
            avatarImg.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    }
    handlePreferenceChange(event) {
      const target = event.target;
      console.log(`Preference ${target.id} changed to: ${target.value}`);
      this.savePreference(target.id, target.value);
    }
    savePreference(key, value) {
      return __async$4(this, null, function* () {
        try {
          yield ApiService.updateUserPreference(key, value);
        } catch (error) {
          console.error("Failed to save preference:", error);
        }
      });
    }
    showSuccessMessage(message) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50";
      toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        ${message}
      </div>
    `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3e3);
    }
    showErrorMessage(message) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50";
      toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
      </div>
    `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3e3);
    }
  }
  const ProfileComponent$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    ProfileComponent
  }, Symbol.toStringTag, { value: "Module" }));
  var __defProp$3 = Object.defineProperty;
  var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$3 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class TenantComponent {
    constructor(currentUser) {
      __publicField$3(this, "currentUser");
      __publicField$3(this, "currentView");
      __publicField$3(this, "tenant", null);
      this.currentUser = currentUser;
      this.currentView = "profile";
    }
    render(container, view = "profile") {
      return __async$3(this, null, function* () {
        if (!container) return;
        this.currentView = view;
        yield this.loadTenantData();
        switch (view) {
          case "profile":
            this.renderTenantProfile(container);
            break;
          case "settings":
            this.renderTenantSettings(container);
            break;
          case "branding":
            this.renderTenantBranding(container);
            break;
          default:
            this.renderTenantProfile(container);
        }
      });
    }
    loadTenantData() {
      return __async$3(this, null, function* () {
        try {
          const response = yield ApiService.prototype.call("GET", "/tenant/profile");
          if (response.success) {
            this.tenant = response.data;
          }
        } catch (error) {
          console.error("Failed to load tenant data:", error);
          this.tenant = {
            id: "tenant-abc-corp",
            name: "ABC Corporation",
            domain: "abc-corp.com",
            status: "active",
            plan: "Enterprise",
            description: "革新的なソリューションを提供するテクノロジー企業",
            industry: "Technology",
            size: "large",
            country: "Japan",
            website: "https://abc-corp.com",
            phone: "+81-3-1234-5678",
            address: "東京都千代田区丸の内1-1-1",
            logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center&auto=format",
            primaryColor: "#3b82f6",
            secondaryColor: "#64748b",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      });
    }
    renderTenantProfile(container) {
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
                   src="${this.tenant.logoUrl || "/static/default-org-logo.svg"}" 
                   alt="Organization Logo" 
                   id="org-logo">
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-900">${this.tenant.name}</h2>
                <div class="flex space-x-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.tenant.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                    ${this.tenant.status === "active" ? "アクティブ" : "非アクティブ"}
                  </span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${this.tenant.plan} プラン
                  </span>
                </div>
              </div>
              <p class="text-gray-600 mb-4">${this.tenant.description || "説明がありません"}</p>
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
                  <span class="ml-2 text-gray-900">${new Date(this.tenant.createdAt).toLocaleDateString("ja-JP")}</span>
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
                        placeholder="組織について簡潔に説明してください...">${this.tenant.description || ""}</textarea>
            </div>

            <!-- Industry and Size -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="org-industry" class="block text-sm font-medium text-gray-700 mb-2">
                  業界
                </label>
                <select id="org-industry" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="Technology" ${this.tenant.industry === "Technology" ? "selected" : ""}>テクノロジー</option>
                  <option value="Finance" ${this.tenant.industry === "Finance" ? "selected" : ""}>金融</option>
                  <option value="Healthcare" ${this.tenant.industry === "Healthcare" ? "selected" : ""}>ヘルスケア</option>
                  <option value="Education" ${this.tenant.industry === "Education" ? "selected" : ""}>教育</option>
                  <option value="Retail" ${this.tenant.industry === "Retail" ? "selected" : ""}>小売</option>
                  <option value="Manufacturing" ${this.tenant.industry === "Manufacturing" ? "selected" : ""}>製造業</option>
                  <option value="Other" ${this.tenant.industry === "Other" ? "selected" : ""}>その他</option>
                </select>
              </div>

              <div>
                <label for="org-size" class="block text-sm font-medium text-gray-700 mb-2">
                  組織規模
                </label>
                <select id="org-size" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="small" ${this.tenant.size === "small" ? "selected" : ""}>小規模 (1-50人)</option>
                  <option value="medium" ${this.tenant.size === "medium" ? "selected" : ""}>中規模 (51-200人)</option>
                  <option value="large" ${this.tenant.size === "large" ? "selected" : ""}>大規模 (201-1000人)</option>
                  <option value="enterprise" ${this.tenant.size === "enterprise" ? "selected" : ""}>エンタープライズ (1000人以上)</option>
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
                       value="${this.tenant.website || ""}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                       placeholder="https://example.com">
              </div>

              <div>
                <label for="org-phone" class="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input type="tel" 
                       id="org-phone" 
                       value="${this.tenant.phone || ""}" 
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
                        placeholder="組織の所在地を入力してください">${this.tenant.address || ""}</textarea>
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
              <span class="ml-2 font-medium ${this.tenant.status === "active" ? "text-green-600" : "text-red-600"}">${this.tenant.status === "active" ? "アクティブ" : "非アクティブ"}</span>
            </div>
            <div>
              <span class="text-gray-600">最終更新:</span>
              <span class="ml-2 text-gray-900">${new Date(this.tenant.updatedAt).toLocaleString("ja-JP")}</span>
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
    renderTenantSettings(container) {
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
    renderTenantBranding(container) {
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
                         value="${this.tenant.primaryColor || "#3b82f6"}" 
                         class="h-12 w-16 rounded-md border border-gray-300 cursor-pointer">
                  <input type="text" 
                         value="${this.tenant.primaryColor || "#3b82f6"}" 
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
                         value="${this.tenant.secondaryColor || "#64748b"}" 
                         class="h-12 w-16 rounded-md border border-gray-300 cursor-pointer">
                  <input type="text" 
                         value="${this.tenant.secondaryColor || "#64748b"}" 
                         class="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm">
                </div>
              </div>
            </div>

            <!-- Color Preview -->
            <div class="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 class="text-sm font-medium text-gray-700 mb-3">プレビュー</h4>
              <div class="flex space-x-3">
                <button type="button" 
                        style="background-color: ${this.tenant.primaryColor || "#3b82f6"}" 
                        class="px-4 py-2 text-white rounded-md font-medium">
                  プライマリボタン
                </button>
                <button type="button" 
                        style="background-color: ${this.tenant.secondaryColor || "#64748b"}" 
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
    attachEventListeners() {
      const profileForm = document.getElementById("tenant-profile-form");
      if (profileForm) {
        profileForm.addEventListener("submit", this.handleTenantProfileSubmit.bind(this));
      }
      const logoInput = document.getElementById("logo-input");
      if (logoInput) {
        logoInput.addEventListener("change", this.handleLogoChange.bind(this));
      }
    }
    attachBrandingEventListeners() {
      const primaryColorInput = document.getElementById("primary-color");
      const secondaryColorInput = document.getElementById("secondary-color");
      if (primaryColorInput && secondaryColorInput) {
        primaryColorInput.addEventListener("change", this.updateColorPreview.bind(this));
        secondaryColorInput.addEventListener("change", this.updateColorPreview.bind(this));
      }
    }
    handleTenantProfileSubmit(event) {
      return __async$3(this, null, function* () {
        event.preventDefault();
        const formData = {
          name: document.getElementById("org-name").value,
          domain: document.getElementById("org-domain").value,
          description: document.getElementById("org-description").value,
          industry: document.getElementById("org-industry").value,
          size: document.getElementById("org-size").value,
          website: document.getElementById("org-website").value,
          phone: document.getElementById("org-phone").value,
          address: document.getElementById("org-address").value
        };
        try {
          const response = yield ApiService.prototype.call("PUT", "/tenant/profile", formData);
          if (response.success) {
            this.showSuccessMessage("組織プロフィールが正常に更新されました");
          } else {
            this.showErrorMessage("組織プロフィールの更新に失敗しました");
          }
        } catch (error) {
          console.error("Tenant profile update error:", error);
          this.showErrorMessage("組織プロフィールの更新中にエラーが発生しました");
        }
      });
    }
    handleLogoChange(event) {
      var _a;
      const input = event.target;
      const file = (_a = input.files) == null ? void 0 : _a[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          var _a2;
          const logoImg = document.getElementById("org-logo");
          if (logoImg && ((_a2 = e.target) == null ? void 0 : _a2.result)) {
            logoImg.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    }
    updateColorPreview() {
      const primaryColor = document.getElementById("primary-color").value;
      const secondaryColor = document.getElementById("secondary-color").value;
      const primaryBtn = document.querySelector('[style*="background-color"]');
      const secondaryBtn = document.querySelector('[style*="background-color"]:last-child');
      if (primaryBtn) primaryBtn.style.backgroundColor = primaryColor;
      if (secondaryBtn) secondaryBtn.style.backgroundColor = secondaryColor;
    }
    getTenantSizeLabel(size) {
      const labels = {
        "small": "小規模 (1-50人)",
        "medium": "中規模 (51-200人)",
        "large": "大規模 (201-1000人)",
        "enterprise": "エンタープライズ (1000人以上)"
      };
      return labels[size] || size;
    }
    showSuccessMessage(message) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50";
      toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        ${message}
      </div>
    `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3e3);
    }
    showErrorMessage(message) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50";
      toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        ${message}
      </div>
    `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3e3);
    }
  }
  const TenantComponent$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    TenantComponent
  }, Symbol.toStringTag, { value: "Module" }));
  var __defProp$2 = Object.defineProperty;
  var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$2 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class AdminPaymentComponent {
    constructor(apiService, currentUser) {
      __publicField$2(this, "currentUser");
      __publicField$2(this, "currentView");
      __publicField$2(this, "apiService");
      this.apiService = apiService;
      this.currentUser = currentUser;
      this.currentView = "schedule";
    }
    render(container, view = "schedule") {
      return __async$2(this, null, function* () {
        if (!container) return;
        this.currentView = view;
        switch (view) {
          case "schedule":
            yield this.renderPaymentSchedule(container);
            break;
          case "fees":
            yield this.renderFeeManagement(container);
            break;
          case "transactions":
            yield this.renderPlatformTransactions(container);
            break;
          case "analytics":
            yield this.renderPaymentAnalytics(container);
            break;
          default:
            yield this.renderPaymentSchedule(container);
        }
      });
    }
    renderPaymentSchedule(container) {
      return __async$2(this, null, function* () {
        const schedules = yield this.loadPaymentSchedules();
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
                ${schedules.data.map((schedule) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(schedule.scheduledDate).toLocaleDateString("ja-JP")}
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
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
        this.attachScheduleEventListeners();
      });
    }
    renderFeeManagement(container) {
      return __async$2(this, null, function* () {
        const feeStructure = yield this.loadFeeStructure();
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
              ${feeStructure.transactionFees.map((fee) => `
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
              `).join("")}
            </div>
          </div>

          <!-- Subscription Fees -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">月額手数料</h3>
            <div class="space-y-4">
              ${feeStructure.subscriptionFees.map((fee) => `
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
              `).join("")}
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
                ${feeStructure.history.map((item) => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(item.changedAt).toLocaleDateString("ja-JP")}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.feeType}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.previousValue}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.newValue}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.changedBy}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
        this.attachFeeEventListeners();
      });
    }
    renderPlatformTransactions(container) {
      return __async$2(this, null, function* () {
        const transactions = yield this.loadPlatformTransactions();
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
                ${transactions.data.map((tx) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(tx.createdAt).toLocaleString("ja-JP")}
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
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
        this.attachTransactionEventListeners();
      });
    }
    renderPaymentAnalytics(container) {
      return __async$2(this, null, function* () {
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
      });
    }
    // Helper methods
    loadPaymentSchedules() {
      return __async$2(this, null, function* () {
        const response = yield this.apiService.call("GET", "/admin/payment-schedules");
        return response.data || {
          stats: {
            pendingAmount: 245e4,
            processedCount: 156,
            pendingReviewCount: 8,
            failedCount: 3
          },
          data: []
        };
      });
    }
    loadFeeStructure() {
      return __async$2(this, null, function* () {
        const response = yield this.apiService.call("GET", "/admin/fee-structure");
        return response.data || {
          monthlyRevenue: 125e4,
          averageFeeRate: 3.2,
          activeTenants: 45,
          transactionFees: [],
          subscriptionFees: [],
          history: []
        };
      });
    }
    loadPlatformTransactions() {
      return __async$2(this, null, function* () {
        const response = yield this.apiService.call("GET", "/admin/platform-transactions");
        return response.data || {
          stats: {
            todayVolume: 542e4,
            todayCount: 89,
            feeRevenue: 173440,
            failedCount: 2
          },
          data: []
        };
      });
    }
    getPaymentMethodLabel(method) {
      const labels = {
        "bank_transfer": "銀行振込",
        "credit_card": "クレジットカード",
        "auto_debit": "自動引き落とし"
      };
      return labels[method] || method;
    }
    getStatusStyle(status) {
      const styles = {
        "pending": "bg-yellow-100 text-yellow-800",
        "processed": "bg-green-100 text-green-800",
        "failed": "bg-red-100 text-red-800"
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    }
    getStatusLabel(status) {
      const labels = {
        "pending": "予定",
        "processed": "処理済み",
        "failed": "失敗"
      };
      return labels[status] || status;
    }
    getTransactionStatusStyle(status) {
      const styles = {
        "completed": "bg-green-100 text-green-800",
        "pending": "bg-yellow-100 text-yellow-800",
        "failed": "bg-red-100 text-red-800"
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    }
    getTransactionStatusLabel(status) {
      const labels = {
        "completed": "完了",
        "pending": "処理中",
        "failed": "失敗"
      };
      return labels[status] || status;
    }
    attachScheduleEventListeners() {
    }
    attachFeeEventListeners() {
    }
    attachTransactionEventListeners() {
    }
  }
  const AdminPaymentComponent$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    AdminPaymentComponent
  }, Symbol.toStringTag, { value: "Module" }));
  var __defProp$1 = Object.defineProperty;
  var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async$1 = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class TenantFinanceComponent {
    constructor(apiService, currentUser) {
      __publicField$1(this, "currentUser");
      __publicField$1(this, "currentView");
      __publicField$1(this, "apiService");
      __publicField$1(this, "financials", null);
      this.apiService = apiService;
      this.currentUser = currentUser;
      this.currentView = "overview";
    }
    render(container, view = "overview") {
      return __async$1(this, null, function* () {
        if (!container) return;
        this.currentView = view;
        switch (view) {
          case "overview":
            yield this.renderFinancialOverview(container);
            break;
          case "transactions":
            yield this.renderTransactionHistory(container);
            break;
          case "payouts":
            yield this.renderPayoutManagement(container);
            break;
          case "settings":
            yield this.renderPaymentSettings(container);
            break;
          default:
            yield this.renderFinancialOverview(container);
        }
      });
    }
    renderFinancialOverview(container) {
      return __async$1(this, null, function* () {
        var _a, _b, _c, _d;
        yield this.loadFinancialData();
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
              ${((_a = this.currentUser) == null ? void 0 : _a.tenantName) || "あなたの組織"}の入出金状況を管理します
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
                <p class="text-3xl font-bold">¥${(((_b = this.financials) == null ? void 0 : _b.availableBalance) || 0).toLocaleString()}</p>
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
                <p class="text-3xl font-bold">¥${(((_c = this.financials) == null ? void 0 : _c.pendingBalance) || 0).toLocaleString()}</p>
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
                <p class="text-3xl font-bold">¥${(((_d = this.financials) == null ? void 0 : _d.monthlyRevenue) || 0).toLocaleString()}</p>
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
      });
    }
    renderTransactionHistory(container) {
      return __async$1(this, null, function* () {
        var _a;
        const transactions = yield this.loadTransactionHistory();
        container.innerHTML = `
      <div class="max-w-7xl mx-auto p-6">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-history mr-3 text-primary-600"></i>
            取引履歴
          </h1>
          <p class="mt-2 text-gray-600">
            ${((_a = this.currentUser) == null ? void 0 : _a.tenantName) || "あなたの組織"}の全取引履歴を確認できます
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
                ${transactions.data.map((tx) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(tx.createdAt).toLocaleString("ja-JP")}
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
                `).join("")}
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
      });
    }
    renderPayoutManagement(container) {
      return __async$1(this, null, function* () {
        const payouts = yield this.loadPayoutRequests();
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
                ${payouts.data.map((payout) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(payout.requestedAt).toLocaleDateString("ja-JP")}
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
                      ${payout.processedAt ? new Date(payout.processedAt).toLocaleDateString("ja-JP") : "-"}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      ${payout.status === "pending" ? '<button class="text-red-600 hover:text-red-900">キャンセル</button>' : '<button class="text-indigo-600 hover:text-indigo-900">詳細</button>'}
                    </td>
                  </tr>
                `).join("")}
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
      });
    }
    renderPaymentSettings(container) {
      return __async$1(this, null, function* () {
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
      });
    }
    // Data loading methods
    loadFinancialData() {
      return __async$1(this, null, function* () {
        var _a;
        try {
          const response = yield this.apiService.call("GET", "/tenant/financials");
          this.financials = response.data;
        } catch (error) {
          console.error("Failed to load financial data:", error);
          this.financials = {
            tenantId: ((_a = this.currentUser) == null ? void 0 : _a.tenantId) || "",
            availableBalance: 85e4,
            pendingBalance: 125e3,
            totalRevenue: 125e5,
            monthlyRevenue: 235e4,
            currency: "JPY",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      });
    }
    loadTransactionHistory() {
      return __async$1(this, null, function* () {
        const response = yield this.apiService.call("GET", "/tenant/transactions");
        return response.data || {
          stats: {
            monthlyRevenue: 235e4,
            transactionCount: 156,
            averageAmount: 15064,
            platformFees: 75200
          },
          data: [],
          total: 156
        };
      });
    }
    loadPayoutRequests() {
      return __async$1(this, null, function* () {
        const response = yield this.apiService.call("GET", "/tenant/payouts");
        return response.data || {
          stats: {
            totalPaidOut: 85e5,
            pendingAmount: 2e5,
            monthlyPayouts: 4,
            avgProcessingDays: 2
          },
          data: []
        };
      });
    }
    // Helper methods
    getTransactionTypeLabel(type) {
      const labels = {
        "payment": "支払い",
        "refund": "返金",
        "chargeback": "チャージバック",
        "withdrawal": "出金"
      };
      return labels[type] || type;
    }
    getTransactionStatusStyle(status) {
      const styles = {
        "completed": "bg-green-100 text-green-800",
        "pending": "bg-yellow-100 text-yellow-800",
        "failed": "bg-red-100 text-red-800"
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    }
    getTransactionStatusLabel(status) {
      const labels = {
        "completed": "完了",
        "pending": "処理中",
        "failed": "失敗"
      };
      return labels[status] || status;
    }
    getPayoutStatusStyle(status) {
      const styles = {
        "pending": "bg-yellow-100 text-yellow-800",
        "approved": "bg-blue-100 text-blue-800",
        "completed": "bg-green-100 text-green-800",
        "rejected": "bg-red-100 text-red-800"
      };
      return styles[status] || "bg-gray-100 text-gray-800";
    }
    getPayoutStatusLabel(status) {
      const labels = {
        "pending": "申請中",
        "approved": "承認済み",
        "completed": "完了",
        "rejected": "却下"
      };
      return labels[status] || status;
    }
    // Event listeners
    attachOverviewEventListeners() {
    }
    attachTransactionEventListeners() {
    }
    attachPayoutEventListeners() {
    }
    attachSettingsEventListeners() {
    }
  }
  const TenantFinanceComponent$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    TenantFinanceComponent
  }, Symbol.toStringTag, { value: "Module" }));
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };
  class UserPaymentComponent {
    constructor(apiService, currentUser) {
      __publicField(this, "currentUser");
      __publicField(this, "currentView");
      __publicField(this, "apiService");
      __publicField(this, "paymentProfile", null);
      this.apiService = apiService;
      this.currentUser = currentUser;
      this.currentView = "overview";
    }
    render(container, view = "overview") {
      return __async(this, null, function* () {
        if (!container) return;
        this.currentView = view;
        switch (view) {
          case "overview":
            yield this.renderPaymentOverview(container);
            break;
          case "methods":
            yield this.renderPaymentMethods(container);
            break;
          case "services":
            yield this.renderConnectedServices(container);
            break;
          case "history":
            yield this.renderPaymentHistory(container);
            break;
          default:
            yield this.renderPaymentOverview(container);
        }
      });
    }
    renderPaymentOverview(container) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
        yield this.loadPaymentProfile();
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
                <p class="text-2xl font-bold text-gray-900">${((_a = this.paymentProfile) == null ? void 0 : _a.paymentMethods.length) || 0}件</p>
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
                <p class="text-2xl font-bold text-gray-900">${((_b = this.paymentProfile) == null ? void 0 : _b.connectedServices.length) || 0}件</p>
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
            ${((_c = this.paymentProfile) == null ? void 0 : _c.paymentMethods.length) ? this.renderPaymentMethodList(this.paymentProfile.paymentMethods) : this.renderEmptyPaymentMethods()}
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
            ${((_d = this.paymentProfile) == null ? void 0 : _d.connectedServices.length) ? this.renderConnectedServiceList(this.paymentProfile.connectedServices) : this.renderEmptyServices()}
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
                       value="${((_f = (_e = this.paymentProfile) == null ? void 0 : _e.billingAddress) == null ? void 0 : _f.street) || ""}"
                       placeholder="住所を入力してください"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                <input type="text" 
                       value="${((_h = (_g = this.paymentProfile) == null ? void 0 : _g.billingAddress) == null ? void 0 : _h.city) || ""}"
                       placeholder="市区町村"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
                <input type="text" 
                       value="${((_j = (_i = this.paymentProfile) == null ? void 0 : _i.billingAddress) == null ? void 0 : _j.postalCode) || ""}"
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
      });
    }
    renderPaymentMethodList(methods) {
      return `
      <div class="space-y-4">
        ${methods.map((method) => `
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
                  ${method.isDefault ? " • デフォルト" : ""}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              ${!method.isDefault ? `
                <button class="text-primary-600 text-sm hover:text-primary-800">
                  デフォルト設定
                </button>
              ` : ""}
              <button class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-edit"></i>
              </button>
              <button class="text-red-400 hover:text-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    }
    renderEmptyPaymentMethods() {
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
    renderConnectedServiceList(services) {
      return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${services.map((service) => `
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
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}">
                  ${service.isActive ? "アクティブ" : "停止中"}
                </span>
                <button class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-cog"></i>
                </button>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              ${service.monthlyFee ? `月額: ¥${service.monthlyFee.toLocaleString()}` : service.usageBasedPricing ? `従量課金: ¥${service.usageBasedPricing.pricePerUnit}/${service.usageBasedPricing.unit}` : "無料プラン"}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              接続日: ${new Date(service.connectedAt).toLocaleDateString("ja-JP")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
    }
    renderEmptyServices() {
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
    renderPaymentMethods(container) {
      return __async(this, null, function* () {
        var _a;
        yield this.loadPaymentProfile();
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
          ${((_a = this.paymentProfile) == null ? void 0 : _a.paymentMethods.map((method) => `
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
                  <p class="font-medium">${method.type === "card" ? "クレジットカード" : method.type}</p>
                </div>
                <div>
                  <p class="text-gray-500">登録日</p>
                  <p class="font-medium">${new Date(method.createdAt).toLocaleDateString("ja-JP")}</p>
                </div>
                <div>
                  <p class="text-gray-500">最終使用</p>
                  <p class="font-medium">${new Date(method.updatedAt).toLocaleDateString("ja-JP")}</p>
                </div>
              </div>
            </div>
          `).join("")) || '<p class="text-gray-500 text-center py-8">決済方法が登録されていません</p>'}
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
                  ${Array.from({ length: 12 }, (_, i) => i + 1).map(
          (month) => `<option value="${month}">${month.toString().padStart(2, "0")}</option>`
        ).join("")}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">有効期限（年）</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                  ${Array.from({ length: 10 }, (_, i) => (/* @__PURE__ */ new Date()).getFullYear() + i).map(
          (year) => `<option value="${year}">${year}</option>`
        ).join("")}
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
      });
    }
    renderConnectedServices(container) {
      return __async(this, null, function* () {
        var _a;
        yield this.loadPaymentProfile();
        const availableServices = yield this.loadAvailableServices();
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
            ${((_a = this.paymentProfile) == null ? void 0 : _a.connectedServices.map((service) => `
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
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                      ${service.isActive ? "アクティブ" : "停止中"}
                    </span>
                  </div>
                </div>
                
                <div class="space-y-2 text-sm">
                  ${service.monthlyFee ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">月額料金:</span>
                      <span class="font-medium">¥${service.monthlyFee.toLocaleString()}</span>
                    </div>
                  ` : ""}
                  
                  ${service.usageBasedPricing ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">従量課金:</span>
                      <span class="font-medium">¥${service.usageBasedPricing.pricePerUnit}/${service.usageBasedPricing.unit}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">無料枠:</span>
                      <span class="font-medium">${service.usageBasedPricing.includedUnits} ${service.usageBasedPricing.unit}</span>
                    </div>
                  ` : ""}
                  
                  <div class="flex justify-between">
                    <span class="text-gray-600">接続日:</span>
                    <span class="font-medium">${new Date(service.connectedAt).toLocaleDateString("ja-JP")}</span>
                  </div>
                  
                  ${service.lastBilledAt ? `
                    <div class="flex justify-between">
                      <span class="text-gray-600">最終請求:</span>
                      <span class="font-medium">${new Date(service.lastBilledAt).toLocaleDateString("ja-JP")}</span>
                    </div>
                  ` : ""}
                </div>
                
                <div class="mt-4 flex space-x-2">
                  <button class="flex-1 text-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    <i class="fas fa-cog mr-1"></i>
                    設定
                  </button>
                  <button class="px-3 py-2 text-sm ${service.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"} rounded-md">
                    ${service.isActive ? "停止" : "再開"}
                  </button>
                </div>
              </div>
            `).join("")) || '<p class="text-gray-500 col-span-3 text-center py-8">連携中のサービスはありません</p>'}
          </div>
        </div>

        <!-- Available Services -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">利用可能なサービス</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${availableServices.map((service) => `
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
                    ` : ""}
                    ${service.pricing.monthly ? `
                      <div>月額: ¥${service.pricing.monthly.toLocaleString()}〜</div>
                    ` : ""}
                    ${service.pricing.perUnit ? `
                      <div>従量課金: ¥${service.pricing.perUnit}/${service.pricing.unit}</div>
                    ` : ""}
                  </div>
                  
                  <button onclick="this.connectService('${service.id}')" 
                          class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    連携する
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
        this.attachServicesEventListeners();
      });
    }
    renderPaymentHistory(container) {
      return __async(this, null, function* () {
        const paymentHistory = yield this.loadPaymentHistory();
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
                ${paymentHistory.payments.map((payment) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${new Date(payment.date).toLocaleDateString("ja-JP")}
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
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}">
                        ${payment.status === "completed" ? "完了" : "失敗"}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-download mr-1"></i>
                        ダウンロード
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
        this.attachHistoryEventListeners();
      });
    }
    // Data loading methods
    loadPaymentProfile() {
      return __async(this, null, function* () {
        var _a;
        try {
          const response = yield this.apiService.call("GET", "/user/payment-profile");
          this.paymentProfile = response.data;
        } catch (error) {
          console.error("Failed to load payment profile:", error);
          this.paymentProfile = {
            userId: ((_a = this.currentUser) == null ? void 0 : _a.id) || "",
            paymentMethods: [
              {
                id: "pm_demo_visa",
                tenantId: "",
                type: "card",
                brand: "visa",
                last4: "4242",
                expiryMonth: 12,
                expiryYear: 2025,
                isDefault: true,
                createdAt: "2024-01-15T10:30:00Z",
                updatedAt: "2024-01-15T10:30:00Z"
              }
            ],
            connectedServices: [
              {
                id: "cs_analytics_pro",
                serviceName: "Analytics Pro",
                serviceType: "subscription",
                isActive: true,
                monthlyFee: 2980,
                connectedAt: "2024-01-01T00:00:00Z",
                lastBilledAt: "2024-01-01T00:00:00Z"
              },
              {
                id: "cs_cloud_storage",
                serviceName: "Cloud Storage",
                serviceType: "subscription",
                isActive: true,
                usageBasedPricing: {
                  unit: "GB",
                  pricePerUnit: 10,
                  includedUnits: 100
                },
                connectedAt: "2024-01-10T00:00:00Z"
              }
            ],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
        }
      });
    }
    loadAvailableServices() {
      return __async(this, null, function* () {
        const response = yield this.apiService.call("GET", "/marketplace/services");
        return response.data || [
          {
            id: "svc_api_gateway",
            name: "API Gateway",
            description: "高性能なAPIゲートウェイサービス",
            type: "api",
            pricing: {
              free: true,
              monthly: 1980,
              perUnit: 0.1,
              unit: "リクエスト"
            }
          },
          {
            id: "svc_monitoring",
            name: "Advanced Monitoring",
            description: "リアルタイム監視とアラート機能",
            type: "monitoring",
            pricing: {
              monthly: 4980
            }
          },
          {
            id: "svc_backup",
            name: "Automated Backup",
            description: "自動バックアップとリストア機能",
            type: "backup",
            pricing: {
              free: true,
              monthly: 980
            }
          }
        ];
      });
    }
    loadPaymentHistory() {
      return __async(this, null, function* () {
        const response = yield this.apiService.call("GET", "/user/payment-history");
        return response.data || {
          stats: {
            thisMonth: 12500,
            thisYear: 89600,
            totalTransactions: 24,
            averageAmount: 3733
          },
          payments: [
            {
              id: "pay_001",
              date: "2024-01-15T00:00:00Z",
              serviceName: "Analytics Pro",
              serviceType: "subscription",
              description: "月額サブスクリプション",
              amount: 2980,
              paymentMethod: "VISA •••• 4242",
              status: "completed"
            },
            {
              id: "pay_002",
              date: "2024-01-10T00:00:00Z",
              serviceName: "Cloud Storage",
              serviceType: "subscription",
              description: "ストレージ使用料",
              amount: 1200,
              paymentMethod: "VISA •••• 4242",
              status: "completed"
            }
          ]
        };
      });
    }
    // Helper methods
    getServiceIcon(type) {
      const icons = {
        "subscription": "fa-calendar-alt",
        "marketplace": "fa-store",
        "api": "fa-code",
        "integration": "fa-plug",
        "monitoring": "fa-chart-line",
        "backup": "fa-shield-alt"
      };
      return icons[type] || "fa-cog";
    }
    getServiceTypeLabel(type) {
      const labels = {
        "subscription": "サブスクリプション",
        "marketplace": "マーケットプレイス",
        "api": "API サービス",
        "integration": "統合サービス",
        "monitoring": "モニタリング",
        "backup": "バックアップ"
      };
      return labels[type] || type;
    }
    // Event listeners
    attachOverviewEventListeners() {
    }
    attachPaymentMethodEventListeners() {
    }
    attachServicesEventListeners() {
    }
    attachHistoryEventListeners() {
    }
  }
  const UserPaymentComponent$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    UserPaymentComponent
  }, Symbol.toStringTag, { value: "Module" }));
})();
