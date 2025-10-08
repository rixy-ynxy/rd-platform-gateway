import { Hono } from 'hono'
import { HonoEnv } from '../types/env'

const paymentApiRoutes = new Hono<HonoEnv>()

// Payment methods endpoint
paymentApiRoutes.get('/methods', (c) => {
  return c.json({
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
  })
})

// Invoices endpoint
paymentApiRoutes.get('/invoices', (c) => {
  return c.json({
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
  })
})

// Billing summary endpoint
paymentApiRoutes.get('/billing-summary', (c) => {
  return c.json({
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
  })
})

// Connect account status endpoint
paymentApiRoutes.get('/connect-account/status', (c) => {
  return c.json({
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
  })
})

export { paymentApiRoutes }