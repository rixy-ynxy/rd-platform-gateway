import { Hono } from 'hono'
import type { PaymentMethod, Invoice, ApiResponse, PaginatedResponse } from '../types'
import { demoAuthMiddleware } from '../middleware/demo-auth'

const paymentRoutes = new Hono()

// Apply demo authentication middleware to all routes
paymentRoutes.use('/*', demoAuthMiddleware)

// Get payment methods for a tenant (DEMO)
paymentRoutes.get('/methods', async (c) => {
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_demo_visa',
      tenantId: 'demo-tenant-abc',
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
      tenantId: 'demo-tenant-abc',
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

  return c.json({
    success: true,
    data: mockPaymentMethods
  })
})

// Add new payment method (DEMO)
paymentRoutes.post('/methods', async (c) => {
  const body = await c.req.json()
  console.log('Demo: Adding payment method:', body)
  
  return c.json({
    success: true,
    data: {
      id: `pm_demo_${Date.now()}`,
      tenantId: 'demo-tenant-abc',
      type: 'card',
      brand: 'visa',
      last4: '0000',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    message: 'Payment method added successfully (demo)'
  }, 201)
})

// Set default payment method (DEMO)
paymentRoutes.post('/methods/:id/set-default', async (c) => {
  const id = c.req.param('id')
  console.log('Demo: Setting default payment method:', id)
  
  return c.json({
    success: true,
    message: 'Default payment method updated (demo)'
  })
})

// Remove payment method (DEMO)
paymentRoutes.delete('/methods/:id', async (c) => {
  const id = c.req.param('id')
  console.log('Demo: Removing payment method:', id)
  
  return c.json({
    success: true,
    message: 'Payment method removed successfully (demo)'
  })
})

// Get invoices for a tenant (DEMO)
paymentRoutes.get('/invoices', async (c) => {
  const mockInvoices: Invoice[] = [
    {
      id: 'in_demo_001',
      tenantId: 'demo-tenant-abc',
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
      tenantId: 'demo-tenant-abc',
      number: 'INV-2024-002',
      amount: 29900, // $299.00
      currency: 'usd',
      status: 'open',
      description: 'Enterprise Plan - February 2024',
      dueDate: '2024-02-29T23:59:59Z',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z'
    }
  ]

  const response: PaginatedResponse<Invoice> = {
    success: true,
    data: mockInvoices,
    meta: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  }

  return c.json(response)
})

// Get single invoice (DEMO)
paymentRoutes.get('/invoices/:id', async (c) => {
  const id = c.req.param('id')
  
  const mockInvoice: Invoice = {
    id: id,
    tenantId: 'demo-tenant-abc',
    number: 'INV-2024-001',
    amount: 29900,
    currency: 'usd',
    status: 'paid',
    description: 'Enterprise Plan - Demo Invoice',
    dueDate: '2024-01-31T23:59:59Z',
    paidAt: '2024-01-25T14:22:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-25T14:22:00Z'
  }

  return c.json({
    success: true,
    data: mockInvoice
  })
})

// Download invoice PDF (DEMO)
paymentRoutes.get('/invoices/:id/download', async (c) => {
  const id = c.req.param('id')
  console.log('Demo: Downloading invoice:', id)
  
  return c.json({
    success: true,
    data: {
      downloadUrl: 'https://demo.stripe.com/invoice.pdf'
    },
    message: 'Invoice download URL generated (demo)'
  })
})

// Create payment intent (DEMO)
paymentRoutes.post('/intents', async (c) => {
  const body = await c.req.json()
  console.log('Demo: Creating payment intent:', body)
  
  return c.json({
    success: true,
    data: {
      id: `pi_demo_${Date.now()}`,
      amount: body.amount * 100,
      currency: body.currency || 'usd',
      status: 'requires_payment_method',
      client_secret: `pi_demo_${Date.now()}_secret_demo`,
      description: body.description
    },
    message: 'Payment intent created successfully (demo)'
  }, 201)
})

// Confirm payment intent (DEMO)
paymentRoutes.post('/intents/:id/confirm', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  console.log('Demo: Confirming payment intent:', id, body)
  
  return c.json({
    success: true,
    data: {
      id: id,
      amount: 29900,
      currency: 'usd',
      status: 'succeeded',
      client_secret: `${id}_secret_demo`
    },
    message: 'Payment confirmed successfully (demo)'
  })
})

// Get billing summary for a tenant (DEMO)
paymentRoutes.get('/billing-summary', async (c) => {
  const mockBillingSummary = {
    currentPeriod: {
      start: '2024-02-01T00:00:00Z',
      end: '2024-02-29T23:59:59Z',
      amount: 299,
      currency: 'USD'
    },
    nextBillingDate: '2024-03-01T00:00:00Z',
    paymentMethod: {
      id: 'pm_demo_visa',
      tenantId: 'demo-tenant-abc',
      type: 'card' as const,
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

  return c.json({
    success: true,
    data: mockBillingSummary
  })
})

// Create Stripe Connect Account for tenant (DEMO)
paymentRoutes.post('/connect-account', async (c) => {
  const body = await c.req.json()
  console.log('Demo: Creating Stripe Connect account:', body)
  
  return c.json({
    success: true,
    data: {
      id: `acct_demo_${Date.now()}`,
      type: body.type || 'express',
      country: body.country || 'US',
      charges_enabled: false,
      details_submitted: false,
      payouts_enabled: false
    },
    message: 'Stripe Connect account created successfully (demo)'
  }, 201)
})

// Create account onboarding link (DEMO)
paymentRoutes.post('/connect-account/onboarding-link', async (c) => {
  const body = await c.req.json()
  console.log('Demo: Creating onboarding link:', body)
  
  return c.json({
    success: true,
    data: {
      url: 'https://connect.stripe.com/setup/demo',
      created: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 3600
    },
    message: 'Onboarding link created successfully (demo)'
  })
})

// Get Connect Account status (DEMO)
paymentRoutes.get('/connect-account/status', async (c) => {
  const mockConnectStatus = {
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

  return c.json({
    success: true,
    data: mockConnectStatus
  })
})

export { paymentRoutes }