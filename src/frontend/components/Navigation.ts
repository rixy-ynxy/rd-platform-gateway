import type { NavItem, User } from '../types';

export class Navigation {
  private currentPage: string;
  private currentUser: User | null;

  constructor(currentPage: string, currentUser: User | null) {
    this.currentPage = currentPage;
    this.currentUser = currentUser;
  }

  render(container: HTMLElement): void {
    if (!container) return;
    
    // Initialize navigation state - expand top-level sections by default
    const currentExpanded = JSON.parse(localStorage.getItem('expandedNavSections') || '[]');
    
    // Determine user role and appropriate default expanded sections
    const userRoles = this.currentUser?.roles || [];
    const isSuperAdmin = userRoles.includes('super_admin');
    const isTenantOwner = userRoles.includes('tenant_owner');
    const isRegularUser = userRoles.includes('user') && !isSuperAdmin && !isTenantOwner;

    // Set default expanded sections based on role (only on first load)
    let defaultExpanded: string[] = [];
    if (currentExpanded.length === 0) { // First time loading
      if (isSuperAdmin) {
        defaultExpanded = ['overview', 'management'];
      } else if (isTenantOwner) {
        defaultExpanded = ['overview', 'my-tenant'];
      } else {
        defaultExpanded = ['overview', 'my-profile'];
      }
    }
    
    const expandedSections = [...new Set([...currentExpanded, ...defaultExpanded])];
    localStorage.setItem('expandedNavSections', JSON.stringify(expandedSections));
    console.log('📂 Initial expanded sections set:', expandedSections);

    // Get role-based navigation structure
    const navStructure: NavItem[] = this.getNavigationForRole(isSuperAdmin, isTenantOwner, isRegularUser);
    
    // Add navigation header with role switching functionality
    const roleLabel = isSuperAdmin ? '管理者' : isTenantOwner ? 'テナント運営者' : '利用者';
    const currentRole = isSuperAdmin ? 'super_admin' : isTenantOwner ? 'tenant_owner' : 'user';
    
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
            <option value="super_admin" ${currentRole === 'super_admin' ? 'selected' : ''}>
              👑 管理者 (全機能)
            </option>
            <option value="tenant_owner" ${currentRole === 'tenant_owner' ? 'selected' : ''}>
              🏢 テナント運営者 (組織管理)
            </option>
            <option value="user" ${currentRole === 'user' ? 'selected' : ''}>
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
  private filterNavigation(navItems: NavItem[], isAdmin: boolean, isTenantOwner: boolean, isManager: boolean): NavItem[] {
    return navItems.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.ownerOnly && !isTenantOwner && !isAdmin) return false;
      if (item.managerOnly && !isManager && !isTenantOwner && !isAdmin) return false;
      
      // Filter children recursively
      if (item.children) {
        item.children = this.filterNavigation(item.children, isAdmin, isTenantOwner, isManager);
      }
      
      return true;
    });
  }

  private renderNavigationTree(navItems: NavItem[], level: number = 0): string {
    if (!navItems || navItems.length === 0) return '';
    
    return navItems.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const isActive = this.isNavItemActive(item);
      const isExpanded = this.isNavSectionExpanded(item.id);
      
      // Tailwind classes for proper indentation and styling
      const levelPadding = {
        0: 'pl-3', // Top level
        1: 'pl-8', // First nested level 
        2: 'pl-12', // Second nested level
        3: 'pl-16'  // Third nested level
      }[level] || 'pl-16';
      
      const itemBaseClasses = 'flex items-center w-full py-2 text-sm font-medium transition-colors duration-200';
      const hoverClasses = 'hover:bg-gray-100 hover:text-gray-900';
      const activeClasses = isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700';
      
      if (hasChildren) {
        return `
          <div class="nav-section" data-level="${level}">
            <button class="${itemBaseClasses} ${levelPadding} ${hoverClasses} ${activeClasses} ${isExpanded ? 'bg-gray-50' : ''}" 
                    onclick="window.Navigation.toggleNavSection('${item.id}')"
                    data-section="${item.id}">
              <i class="${item.icon} w-5 h-5 mr-3 flex-shrink-0"></i>
              <span class="flex-1 text-left">${item.label}</span>
              <i class="fas fa-chevron-right w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}"></i>
            </button>
            <div class="nav-children" id="nav-${item.id}" style="display: ${isExpanded ? 'block' : 'none'}">
              ${this.renderNavigationTree(item.children, level + 1)}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="nav-section" data-level="${level}">
            <a href="#${item.id}" 
               class="${itemBaseClasses} ${levelPadding} ${hoverClasses} ${this.currentPage === item.id || this.currentPage.startsWith(item.id + '/') ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-600'} no-underline"
               data-page="${item.id}"
               onclick="window.app.navigateTo('${item.id}'); return false;">
              <i class="${item.icon} w-5 h-5 mr-3 flex-shrink-0 ${this.currentPage === item.id || this.currentPage.startsWith(item.id + '/') ? 'text-blue-600' : 'text-gray-500'}"></i>
              <span class="text-left">${item.label}</span>
            </a>
          </div>
        `;
      }
    }).join('');
  }

  private isNavItemActive(item: NavItem): boolean {
    if (item.id === this.currentPage) return true;
    if (item.children) {
      return item.children.some(child => this.isNavItemActive(child));
    }
    return this.currentPage.startsWith(item.id + '/');
  }

  private isNavSectionExpanded(sectionId: string): boolean {
    const expandedSections = JSON.parse(localStorage.getItem('expandedNavSections') || '[]');
    const isExpanded = expandedSections.includes(sectionId);
    return isExpanded;
  }

  static toggleNavSection(sectionId: string): void {
    console.log('🎯 Toggle navigation section called:', sectionId);
    const expandedSections = JSON.parse(localStorage.getItem('expandedNavSections') || '[]');
    const isExpanded = expandedSections.includes(sectionId);
    
    console.log('📂 Current expanded sections:', expandedSections);
    console.log('📊 Is currently expanded:', isExpanded);
    
    if (isExpanded) {
      const index = expandedSections.indexOf(sectionId);
      expandedSections.splice(index, 1);
    } else {
      expandedSections.push(sectionId);
    }
    
    localStorage.setItem('expandedNavSections', JSON.stringify(expandedSections));
    console.log('💾 Updated expanded sections:', expandedSections);
    
    // Update UI immediately with Tailwind classes
    const button = document.querySelector(`[data-section="${sectionId}"]`) as HTMLElement;
    const children = document.getElementById(`nav-${sectionId}`) as HTMLElement;
    const arrow = button?.querySelector('i:last-child') as HTMLElement;
    
    console.log('🔍 Found elements:', { button: !!button, children: !!children, arrow: !!arrow });
    
    if (button && children && arrow) {
      if (!isExpanded) {
        // Expanding
        console.log('🔽 Expanding section');
        children.style.display = 'block';
        arrow.classList.add('rotate-90');
        button.classList.add('bg-gray-50');
      } else {
        // Collapsing
        console.log('🔼 Collapsing section');
        children.style.display = 'none';
        arrow.classList.remove('rotate-90');
        button.classList.remove('bg-gray-50');
      }
    } else {
      console.error('❌ Could not find navigation elements for section:', sectionId);
    }
  }

  /**
   * Switch user role for demo purposes
   */
  static switchRole(newRole: string): void {
    console.log(`🔄 Switching role to: ${newRole}`);
    
    // Update the demo user's role in localStorage for ApiService
    const roleMap: Record<string, string[]> = {
      'super_admin': ['super_admin'],
      'tenant_owner': ['tenant_owner'],
      'user': ['user']
    };
    
    // Store the selected role
    localStorage.setItem('demo_user_role', newRole);
    
    // Show role change notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-md shadow-lg z-50';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-sync-alt mr-2"></i>
        ロールを変更中...
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Reload the page to reflect role changes
    setTimeout(() => {
      toast.remove();
      window.location.reload();
    }, 1000);
  }

  /**
   * Generate navigation structure based on user roles
   */
  private getNavigationForRole(isSuperAdmin: boolean, isTenantOwner: boolean, isRegularUser: boolean): NavItem[] {
    const baseNavigation: NavItem[] = [];

    // ✅ Super Admin (管理者): 全ての機能にアクセス可能
    if (isSuperAdmin) {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: 'fas fa-home',
          children: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
            { id: 'reports', label: 'Reports', icon: 'fas fa-file-chart' }
          ]
        },
        {
          id: 'management',
          label: 'Management',
          icon: 'fas fa-cogs',
          children: [
            { id: 'tenants', label: 'Tenants', icon: 'fas fa-building' },
            { 
              id: 'users', 
              label: 'Users', 
              icon: 'fas fa-users',
              children: [
                { id: 'users/list', label: 'All Users', icon: 'fas fa-list' },
                { id: 'users/create', label: 'Add User', icon: 'fas fa-user-plus' },
                { id: 'users/roles', label: 'Roles & Permissions', icon: 'fas fa-user-shield' },
                { id: 'users/invitations', label: 'Invitations', icon: 'fas fa-envelope' }
              ]
            },
            {
              id: 'api',
              label: 'API Management',
              icon: 'fas fa-code',
              children: [
                { id: 'api/keys', label: 'API Keys', icon: 'fas fa-key' },
                { id: 'api/endpoints', label: 'Endpoints', icon: 'fas fa-plug' },
                { id: 'api/documentation', label: 'Documentation', icon: 'fas fa-book' },
                { id: 'api/testing', label: 'API Testing', icon: 'fas fa-flask' }
              ]
            }
          ]
        },
        {
          id: 'billing',
          label: 'Billing & Payments',
          icon: 'fas fa-credit-card',
          children: [
            { id: 'billing/overview', label: 'Billing Overview', icon: 'fas fa-chart-pie' },
            { id: 'billing/invoices', label: 'Invoices', icon: 'fas fa-file-invoice' },
            { id: 'billing/payments', label: 'Payment Methods', icon: 'fas fa-credit-card' },
            { id: 'billing/subscription', label: 'Subscription', icon: 'fas fa-calendar-alt' },
            { id: 'billing/connect', label: 'Stripe Connect', icon: 'fab fa-stripe' }
          ]
        },
        {
          id: 'tenant-finance',
          label: 'Financial Management',
          icon: 'fas fa-wallet',
          children: [
            { id: 'tenant-finance/overview', label: 'Financial Overview', icon: 'fas fa-chart-pie' },
            { id: 'tenant-finance/transactions', label: 'Transaction History', icon: 'fas fa-history' },
            { id: 'tenant-finance/payouts', label: 'Payout Management', icon: 'fas fa-arrow-up' },
            { id: 'tenant-finance/settings', label: 'Payment Settings', icon: 'fas fa-cog' }
          ]
        },
        {
          id: 'platform-payments',
          label: 'Platform Payments',
          icon: 'fas fa-coins',
          children: [
            { id: 'admin-payment/schedule', label: 'Payment Schedules', icon: 'fas fa-calendar-alt' },
            { id: 'admin-payment/fees', label: 'Fee Management', icon: 'fas fa-percentage' },
            { id: 'admin-payment/transactions', label: 'Platform Transactions', icon: 'fas fa-exchange-alt' },
            { id: 'admin-payment/analytics', label: 'Payment Analytics', icon: 'fas fa-chart-pie' }
          ]
        },
        {
          id: 'monitoring',
          label: 'Monitoring',
          icon: 'fas fa-heartbeat',
          children: [
            { id: 'monitoring/usage', label: 'Usage Metrics', icon: 'fas fa-chart-bar' },
            { id: 'monitoring/performance', label: 'Performance', icon: 'fas fa-tachometer-alt' },
            { id: 'monitoring/logs', label: 'Activity Logs', icon: 'fas fa-list-alt' },
            { id: 'monitoring/health', label: 'System Health', icon: 'fas fa-heartbeat' },
            { id: 'monitoring/alerts', label: 'Alerts', icon: 'fas fa-bell' }
          ]
        },
        {
          id: 'integrations',
          label: 'Integrations',
          icon: 'fas fa-puzzle-piece',
          children: [
            { id: 'integrations/webhooks', label: 'Webhooks', icon: 'fas fa-webhook' },
            { id: 'integrations/sso', label: 'SSO Configuration', icon: 'fas fa-sign-in-alt' },
            { id: 'integrations/third-party', label: 'Third-party Services', icon: 'fas fa-external-link-alt' },
            { id: 'integrations/marketplace', label: 'App Marketplace', icon: 'fas fa-store' }
          ]
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'fas fa-cog',
          children: [
            { id: 'settings/general', label: 'General Settings', icon: 'fas fa-sliders-h' },
            { id: 'settings/security', label: 'Security', icon: 'fas fa-shield-alt' },
            { id: 'settings/notifications', label: 'Notifications', icon: 'fas fa-bell' },
            { id: 'settings/preferences', label: 'Preferences', icon: 'fas fa-user-cog' },
            { id: 'settings/branding', label: 'Branding', icon: 'fas fa-palette' }
          ]
        },
        {
          id: 'admin',
          label: 'Admin Console',
          icon: 'fas fa-tools',
          children: [
            { id: 'admin/platform', label: 'Platform Overview', icon: 'fas fa-globe' },
            { id: 'admin/tenants', label: 'Tenant Management', icon: 'fas fa-building' },
            { id: 'admin/users', label: 'Global Users', icon: 'fas fa-users-cog' },
            { id: 'admin/system', label: 'System Configuration', icon: 'fas fa-server' },
            { id: 'admin/maintenance', label: 'Maintenance', icon: 'fas fa-wrench' }
          ]
        }
      ];
    }

    // ✅ Tenant Owner (テナント運営者): 自分のテナント編集ができる
    if (isTenantOwner) {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: 'fas fa-home',
          children: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-line' },
            { id: 'reports', label: 'Reports', icon: 'fas fa-file-chart' }
          ]
        },
        {
          id: 'my-tenant',
          label: 'My Organization',
          icon: 'fas fa-building',
          children: [
            { id: 'tenant/profile', label: 'Organization Profile', icon: 'fas fa-id-card' },
            { id: 'tenant/settings', label: 'Organization Settings', icon: 'fas fa-cog' },
            { id: 'tenant/branding', label: 'Branding', icon: 'fas fa-palette' }
          ]
        },
        {
          id: 'team-management',
          label: 'Team Management',
          icon: 'fas fa-users',
          children: [
            { id: 'users/list', label: 'Team Members', icon: 'fas fa-list' },
            { id: 'users/create', label: 'Add Member', icon: 'fas fa-user-plus' },
            { id: 'users/roles', label: 'Roles & Permissions', icon: 'fas fa-user-shield' },
            { id: 'users/invitations', label: 'Invitations', icon: 'fas fa-envelope' }
          ]
        },
        {
          id: 'billing',
          label: 'Billing & Payments',
          icon: 'fas fa-credit-card',
          children: [
            { id: 'billing/overview', label: 'Billing Overview', icon: 'fas fa-chart-pie' },
            { id: 'billing/invoices', label: 'Invoices', icon: 'fas fa-file-invoice' },
            { id: 'billing/payments', label: 'Payment Methods', icon: 'fas fa-credit-card' },
            { id: 'billing/subscription', label: 'Subscription', icon: 'fas fa-calendar-alt' },
            { id: 'billing/connect', label: 'Stripe Connect', icon: 'fab fa-stripe' }
          ]
        },
        {
          id: 'tenant-finance',
          label: 'Financial Management',
          icon: 'fas fa-wallet',
          children: [
            { id: 'tenant-finance/overview', label: 'Financial Overview', icon: 'fas fa-chart-pie' },
            { id: 'tenant-finance/transactions', label: 'Transaction History', icon: 'fas fa-history' },
            { id: 'tenant-finance/payouts', label: 'Payout Management', icon: 'fas fa-arrow-up' },
            { id: 'tenant-finance/settings', label: 'Payment Settings', icon: 'fas fa-cog' }
          ]
        },
        {
          id: 'monitoring',
          label: 'Usage & Analytics',
          icon: 'fas fa-chart-bar',
          children: [
            { id: 'monitoring/usage', label: 'Usage Metrics', icon: 'fas fa-chart-bar' },
            { id: 'monitoring/performance', label: 'Performance', icon: 'fas fa-tachometer-alt' },
            { id: 'monitoring/logs', label: 'Activity Logs', icon: 'fas fa-list-alt' }
          ]
        },
        {
          id: 'integrations',
          label: 'Integrations',
          icon: 'fas fa-puzzle-piece',
          children: [
            { id: 'integrations/webhooks', label: 'Webhooks', icon: 'fas fa-webhook' },
            { id: 'integrations/third-party', label: 'Third-party Services', icon: 'fas fa-external-link-alt' }
          ]
        }
      ];
    }

    // ✅ Regular User (利用者): 個人情報と支払い情報の管理のみ
    if (isRegularUser) {
      return [
        {
          id: 'overview',
          label: 'Overview',
          icon: 'fas fa-home',
          children: [
            { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' }
          ]
        },
        {
          id: 'my-profile',
          label: 'My Profile',
          icon: 'fas fa-user',
          children: [
            { id: 'profile/personal', label: 'Personal Information', icon: 'fas fa-id-card' },
            { id: 'profile/security', label: 'Security Settings', icon: 'fas fa-shield-alt' },
            { id: 'profile/preferences', label: 'Preferences', icon: 'fas fa-user-cog' }
          ]
        },
        {
          id: 'my-billing',
          label: 'My Billing',
          icon: 'fas fa-credit-card',
          children: [
            { id: 'billing/overview', label: 'Billing Overview', icon: 'fas fa-chart-pie' },
            { id: 'billing/invoices', label: 'My Invoices', icon: 'fas fa-file-invoice' },
            { id: 'billing/payments', label: 'Payment Methods', icon: 'fas fa-credit-card' }
          ]
        },
        {
          id: 'user-payment',
          label: 'Payment Management',
          icon: 'fas fa-wallet',
          children: [
            { id: 'user-payment/overview', label: 'Payment Overview', icon: 'fas fa-chart-pie' },
            { id: 'user-payment/methods', label: 'Payment Methods', icon: 'fas fa-credit-card' },
            { id: 'user-payment/services', label: 'Connected Services', icon: 'fas fa-plug' },
            { id: 'user-payment/history', label: 'Payment History', icon: 'fas fa-history' }
          ]
        }
      ];
    }

    // Default fallback (should not happen)
    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'fas fa-home',
        children: [
          { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' }
        ]
      }
    ];
  }
}