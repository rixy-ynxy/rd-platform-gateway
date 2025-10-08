import { Hono } from 'hono'
import { AuditLog, ApiKey, Integration, Webhook, ApiResponse, PaginatedResponse } from '../types'

const adminRoutes = new Hono()

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    action: 'tenant.suspend',
    resource: 'tenant',
    resourceId: 'tenant-def-ltd',
    userId: 'admin-123',
    userEmail: 'admin@platform.com',
    tenantId: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    metadata: {
      reason: 'Payment failure',
      previousStatus: 'active',
      newStatus: 'suspended'
    },
    timestamp: '2025-10-03T10:30:00Z'
  },
  {
    id: 'audit-2',
    action: 'user.create',
    resource: 'user',
    resourceId: 'user-789',
    userId: 'admin-456',
    userEmail: 'manager@abc-corp.com',
    tenantId: 'tenant-abc-corp',
    ipAddress: '10.0.1.50',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    metadata: {
      userEmail: 'jane.smith@abc-corp.com',
      roles: ['developer'],
      inviteSent: true
    },
    timestamp: '2025-10-03T09:15:00Z'
  }
]

// Mock API keys
const mockApiKeys: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production API Key',
    key: '[DEMO_API_KEY_ABCD1234]',
    permissions: ['read', 'write'],
    lastUsedAt: '2025-10-03T09:30:00Z',
    expiresAt: '2026-10-03T00:00:00Z',
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z'
  }
]

// Mock integrations
const mockIntegrations: Integration[] = [
  {
    id: 'int-stripe',
    name: 'Stripe Payments',
    type: 'stripe',
    status: 'connected',
    config: {
      accountId: 'acct_1234567890',
      webhookUrl: 'https://platform.example.com/api/webhooks/stripe',
      livemode: true
    },
    lastSyncAt: '2025-10-03T10:00:00Z'
  },
  {
    id: 'int-email',
    name: 'Email Notifications',
    type: 'email',
    status: 'connected',
    config: {
      smtpHost: 'smtp.example.com',
      port: 587,
      username: 'notifications@platform.example.com'
    },
    lastSyncAt: '2025-10-03T08:30:00Z'
  }
]

// Mock webhooks
const mockWebhooks: Webhook[] = [
  {
    id: 'wh-1',
    url: 'https://customer-app.com/webhooks/platform',
    events: ['tenant.created', 'user.created', 'payment.succeeded'],
    secret: '[WEBHOOK_SECRET_PLACEHOLDER]',
    isActive: true,
    lastTriggeredAt: '2025-10-03T09:45:00Z',
    createdAt: '2025-09-01T10:00:00Z'
  }
]

// Get audit logs
adminRoutes.get('/audit-logs', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  
  const response: PaginatedResponse<AuditLog> = {
    success: true,
    data: mockAuditLogs,
    meta: {
      page,
      limit,
      total: mockAuditLogs.length,
      totalPages: Math.ceil(mockAuditLogs.length / limit)
    }
  }
  
  return c.json(response)
})

// Get API keys
adminRoutes.get('/api-keys', async (c) => {
  const response: ApiResponse<ApiKey[]> = {
    success: true,
    data: mockApiKeys
  }
  return c.json(response)
})

// Create API key
adminRoutes.post('/api-keys', async (c) => {
  const body = await c.req.json()
  const { name, permissions } = body
  
  if (!name || !permissions) {
    const response: ApiResponse = {
      success: false,
      error: 'Name and permissions are required'
    }
    return c.json(response, 400)
  }
  
  const newApiKey: ApiKey = {
    id: `key-${Date.now()}`,
    name,
    key: `[DEMO_API_KEY_${Math.random().toString(36).substring(2, 8).toUpperCase()}]`,
    permissions,
    isActive: true,
    createdAt: new Date().toISOString()
  }
  
  mockApiKeys.push(newApiKey)
  
  const response: ApiResponse<ApiKey> = {
    success: true,
    data: newApiKey,
    message: 'API key created successfully'
  }
  return c.json(response, 201)
})

// Get integrations
adminRoutes.get('/integrations', async (c) => {
  const response: ApiResponse<Integration[]> = {
    success: true,
    data: mockIntegrations
  }
  return c.json(response)
})

// Get webhooks
adminRoutes.get('/webhooks', async (c) => {
  const response: ApiResponse<Webhook[]> = {
    success: true,
    data: mockWebhooks
  }
  return c.json(response)
})

// Get system configuration
adminRoutes.get('/config', async (c) => {
  const config = {
    platform: {
      name: 'Platform Gateway',
      version: '1.0.0',
      environment: 'production'
    },
    features: {
      multiTenant: true,
      ssoEnabled: true,
      paymentsEnabled: true,
      auditLogging: true
    }
  }
  
  const response: ApiResponse<typeof config> = {
    success: true,
    data: config
  }
  return c.json(response)
})

export { adminRoutes }