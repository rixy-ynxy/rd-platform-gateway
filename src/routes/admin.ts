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
  },
  {
    id: 'audit-3',
    action: 'payment.failed',
    resource: 'payment',
    resourceId: 'pi_1234567890',
    userId: null,
    userEmail: null,
    tenantId: 'tenant-def-ltd',
    ipAddress: null,
    userAgent: null,
    metadata: {
      amount: 99.00,
      currency: 'USD',
      errorCode: 'card_declined',
      errorMessage: 'Your card was declined.'
    },
    timestamp: '2025-10-03T08:45:00Z'
  }
]

// Mock API keys
const mockApiKeys: ApiKey[] = [
  {
    id: 'key-1',
    name: 'Production API Key',
    key: 'pk_live_***************abc123',
    permissions: ['read', 'write'],
    lastUsedAt: '2025-10-03T09:30:00Z',
    expiresAt: '2026-10-03T00:00:00Z',
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'key-2',
    name: 'Development API Key',
    key: 'pk_test_***************def456',
    permissions: ['read'],
    lastUsedAt: '2025-10-02T14:20:00Z',
    isActive: true,
    createdAt: '2025-09-01T09:00:00Z'
  },
  {
    id: 'key-3',
    name: 'Analytics API Key',
    key: 'pk_live_***************ghi789',
    permissions: ['read'],
    lastUsedAt: '2025-09-28T16:45:00Z',
    expiresAt: '2025-12-31T23:59:59Z',
    isActive: false,
    createdAt: '2025-07-20T11:30:00Z'
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
    id: 'int-auth0',
    name: 'Auth0 Identity Provider',
    type: 'auth0',
    status: 'connected',
    config: {
      domain: 'platform-gateway.auth0.com',
      clientId: 'your-auth0-client-id',
      audience: 'https://api.platform-gateway.com'
    },
    lastSyncAt: '2025-10-03T08:30:00Z'
  },
  {
    id: 'int-slack',
    name: 'Slack Notifications',
    type: 'slack',
    status: 'error',
    config: {
      webhookUrl: '[SLACK_WEBHOOK_URL_PLACEHOLDER]',
      channel: '#alerts'
    },
    lastSyncAt: '2025-10-01T15:20:00Z'
  }
]

// Mock webhooks
const mockWebhooks: Webhook[] = [
  {
    id: 'wh-1',
    url: 'https://customer-app.com/webhooks/platform',
    events: ['tenant.created', 'user.created', 'payment.succeeded'],
    secret: 'whsec_***************abc123',
    isActive: true,
    lastTriggeredAt: '2025-10-03T09:45:00Z',
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: 'wh-2',
    url: 'https://analytics.example.com/api/events',
    events: ['usage.threshold_reached', 'tenant.suspended'],
    secret: 'whsec_***************def456',
    isActive: true,
    lastTriggeredAt: '2025-10-02T14:30:00Z',
    createdAt: '2025-08-15T14:00:00Z'
  }
]

// Get audit logs
adminRoutes.get('/audit-logs', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '50')
  const action = c.req.query('action')
  const resource = c.req.query('resource')
  const userId = c.req.query('userId')
  const tenantId = c.req.query('tenantId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  let filteredLogs = [...mockAuditLogs]
  
  // Apply filters
  if (action) {
    filteredLogs = filteredLogs.filter(log => log.action.includes(action))
  }
  
  if (resource) {
    filteredLogs = filteredLogs.filter(log => log.resource === resource)
  }
  
  if (userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === userId)
  }
  
  if (tenantId) {
    filteredLogs = filteredLogs.filter(log => log.tenantId === tenantId)
  }
  
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= new Date(startDate)
    )
  }
  
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= new Date(endDate)
    )
  }
  
  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  // Pagination
  const total = filteredLogs.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)
  
  const response: PaginatedResponse<AuditLog> = {
    success: true,
    data: paginatedLogs,
    meta: {
      page,
      limit,
      total,
      totalPages
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
  const { name, permissions, expiresAt } = body
  
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
    key: `pk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    permissions,
    expiresAt,
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

// Revoke API key
adminRoutes.delete('/api-keys/:id', async (c) => {
  const id = c.req.param('id')
  
  const keyIndex = mockApiKeys.findIndex(key => key.id === id)
  if (keyIndex === -1) {
    const response: ApiResponse = {
      success: false,
      error: 'API key not found'
    }
    return c.json(response, 404)
  }
  
  mockApiKeys[keyIndex].isActive = false
  
  const response: ApiResponse = {
    success: true,
    message: 'API key revoked successfully'
  }
  return c.json(response)
})

// Get integrations
adminRoutes.get('/integrations', async (c) => {
  const response: ApiResponse<Integration[]> = {
    success: true,
    data: mockIntegrations
  }
  return c.json(response)
})

// Test integration connection
adminRoutes.post('/integrations/:id/test', async (c) => {
  const id = c.req.param('id')
  
  const integration = mockIntegrations.find(int => int.id === id)
  if (!integration) {
    const response: ApiResponse = {
      success: false,
      error: 'Integration not found'
    }
    return c.json(response, 404)
  }
  
  // Mock connection test
  const testResult = {
    success: Math.random() > 0.2, // 80% success rate
    message: Math.random() > 0.2 ? 'Connection successful' : 'Connection failed: Invalid credentials',
    timestamp: new Date().toISOString()
  }
  
  const response: ApiResponse<typeof testResult> = {
    success: true,
    data: testResult
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

// Create webhook
adminRoutes.post('/webhooks', async (c) => {
  const body = await c.req.json()
  const { url, events } = body
  
  if (!url || !events || events.length === 0) {
    const response: ApiResponse = {
      success: false,
      error: 'URL and events are required'
    }
    return c.json(response, 400)
  }
  
  const newWebhook: Webhook = {
    id: `wh-${Date.now()}`,
    url,
    events,
    secret: `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
    isActive: true,
    createdAt: new Date().toISOString()
  }
  
  mockWebhooks.push(newWebhook)
  
  const response: ApiResponse<Webhook> = {
    success: true,
    data: newWebhook,
    message: 'Webhook created successfully'
  }
  return c.json(response, 201)
})

// Test webhook
adminRoutes.post('/webhooks/:id/test', async (c) => {
  const id = c.req.param('id')
  
  const webhook = mockWebhooks.find(wh => wh.id === id)
  if (!webhook) {
    const response: ApiResponse = {
      success: false,
      error: 'Webhook not found'
    }
    return c.json(response, 404)
  }
  
  // Mock webhook test
  const testResult = {
    success: Math.random() > 0.3, // 70% success rate
    statusCode: Math.random() > 0.3 ? 200 : 404,
    responseTime: Math.floor(Math.random() * 1000) + 100,
    message: Math.random() > 0.3 ? 'Webhook delivered successfully' : 'Webhook delivery failed: Endpoint not found',
    timestamp: new Date().toISOString()
  }
  
  const response: ApiResponse<typeof testResult> = {
    success: true,
    data: testResult
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
      auditLogging: true,
      rateLimiting: true
    },
    limits: {
      maxTenantsPerOrg: 10,
      maxUsersPerTenant: 1000,
      defaultRateLimit: 1000,
      maxApiKeysPerTenant: 5
    },
    security: {
      jwtExpirationMinutes: 15,
      refreshTokenExpirationDays: 30,
      passwordMinLength: 8,
      mfaRequired: false,
      sessionTimeoutMinutes: 480
    }
  }
  
  const response: ApiResponse<typeof config> = {
    success: true,
    data: config
  }
  return c.json(response)
})

// Update system configuration
adminRoutes.put('/config', async (c) => {
  const body = await c.req.json()
  
  // In real implementation, validate and update configuration
  const response: ApiResponse = {
    success: true,
    message: 'Configuration updated successfully'
  }
  return c.json(response)
})

export { adminRoutes }