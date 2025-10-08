// Type definitions for Platform Gateway UI

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  roles: string[]
  tenantId?: string
  tenantName?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  name: string
  domain: string
  subdomain?: string
  logo?: string
  status: 'active' | 'suspended' | 'pending' | 'cancelled'
  plan: 'starter' | 'professional' | 'enterprise' | 'custom'
  limits: TenantLimits
  usage: TenantUsage
  billing: TenantBilling
  owner: User
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

export interface TenantLimits {
  users: number
  apiCallsPerMonth: number
  storageGB: number
  requestsPerMinute: number
  customDomains: number
  ssoConnections: number
}

export interface TenantUsage {
  users: {
    current: number
    limit: number
  }
  apiCalls: {
    currentMonth: number
    limit: number
    trend: number // percentage change
  }
  storage: {
    usedGB: number
    limit: number
  }
  bandwidth: {
    currentMonthGB: number
    trend: number
  }
}

export interface TenantBilling {
  currentPlan: string
  monthlyPrice: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  paymentMethod?: PaymentMethod
  invoices: Invoice[]
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

export interface TenantSettings {
  allowUserRegistration: boolean
  requireEmailVerification: boolean
  enableSSO: boolean
  enableMFA: boolean
  sessionTimeout: number // minutes
  passwordPolicy: PasswordPolicy
  branding: BrandingSettings
  notifications: NotificationSettings
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account'
  brand?: string
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface Invoice {
  id: string
  number: string
  status: 'paid' | 'pending' | 'failed' | 'cancelled'
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  dueDate: string
  paidAt?: string
  downloadUrl?: string
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  maxAge: number // days
}

export interface BrandingSettings {
  primaryColor: string
  secondaryColor: string
  logo?: string
  favicon?: string
  customCSS?: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  slackWebhook?: string
  webhookUrl?: string
  notifyOnUserRegistration: boolean
  notifyOnUsageThreshold: boolean
  usageThresholdPercent: number
}

export interface AuthProvider {
  id: string
  name: string
  type: 'oidc' | 'saml' | 'oauth2'
  config: Record<string, any>
  isEnabled: boolean
}

export interface ApiKey {
  id: string
  name: string
  key: string // masked in UI
  permissions: string[]
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  userId?: string
  userEmail?: string
  tenantId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface Metric {
  name: string
  value: number
  unit: string
  trend?: number
  timestamp: string
}

export interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  apiCallsToday: number
  apiCallsThisMonth: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  uptime: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface CreateTenantForm {
  name: string
  domain: string
  ownerEmail: string
  ownerName: string
  plan: string
}

export interface CreateUserForm {
  email: string
  name: string
  roles: string[]
  sendInvite: boolean
}

export interface UpdateTenantLimitsForm {
  users: number
  apiCallsPerMonth: number
  storageGB: number
  requestsPerMinute: number
}

// Navigation & UI types
export interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  isActive?: boolean
  children?: NavItem[]
}

export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => string | JSX.Element
}

export interface FilterOption {
  key: string
  label: string
  value: string
}

// Webhook & Integration types
export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  lastTriggeredAt?: string
  createdAt: string
}

export interface Integration {
  id: string
  name: string
  type: 'stripe' | 'auth0' | 'slack' | 'webhook'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  lastSyncAt?: string
}