// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Billing Types
export interface Subscription {
  id: string
  tenantId: string
  planId: string
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface BillingPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  maxUsers?: number
  maxApiCalls?: number
}

export interface Invoice {
  id: string
  subscriptionId: string
  tenantId: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  dueDate: string
  paidAt?: string
  items: InvoiceItem[]
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

// Admin Types
export interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string
  userId?: string | null
  userEmail?: string | null
  tenantId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
  timestamp: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface Integration {
  id: string
  name: string
  type: string
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  lastSyncAt?: string
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  lastTriggeredAt?: string
  createdAt: string
}

// Tenant Types
export interface Tenant {
  id: string
  name: string
  domain: string
  status: 'active' | 'inactive' | 'suspended'
  subscriptionId?: string
  createdAt: string
  updatedAt: string
}

export interface TenantUser {
  id: string
  tenantId: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

// Analytics Types
export interface RevenueMetrics {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  growth: number
}

export interface UsageMetrics {
  totalApiCalls: number
  activeUsers: number
  storageUsed: number
  bandwidthUsed: number
}