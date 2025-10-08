import { Hono } from 'hono'
import { HonoEnv } from '../types/env'

const tenantApiRoutes = new Hono<HonoEnv>()

// Tenant financial data endpoint
tenantApiRoutes.get('/financials', (c) => {
  return c.json({
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
  })
})

// Tenant transactions endpoint
tenantApiRoutes.get('/transactions', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  
  return c.json({
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
        },
        {
          id: 'tx_002',
          tenantId: 'tenant-abc-corp',
          tenantName: 'ABC Corporation',
          amount: 15000,
          platformFee: 450,
          currency: 'JPY',
          type: 'payment',
          status: 'completed',
          paymentMethod: 'bank_transfer',
          description: 'API usage fee',
          createdAt: '2024-01-14T09:30:00Z',
          updatedAt: '2024-01-14T09:30:00Z'
        }
      ],
      total: 156,
      page,
      limit,
      totalPages: Math.ceil(156 / limit)
    }
  })
})

// Tenant payouts endpoint
tenantApiRoutes.get('/payouts', (c) => {
  return c.json({
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
  })
})

// Tenant profile endpoint
tenantApiRoutes.get('/profile', (c) => {
  return c.json({
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
  })
})

// Tenant branding endpoint
tenantApiRoutes.get('/branding', (c) => {
  return c.json({
    success: true,
    data: {
      tenantId: 'tenant-abc-corp',
      logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=center&auto=format',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      favicon: null,
      customCss: null,
      updatedAt: new Date().toISOString()
    }
  })
})

export { tenantApiRoutes }