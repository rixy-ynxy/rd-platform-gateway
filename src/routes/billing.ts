import { Hono } from 'hono'

const billingRoutes = new Hono()

// Mock billing data
const mockBillingData = {
  currentPlan: {
    id: 'plan-pro',
    name: 'Professional',
    price: 99,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited API calls', '24/7 Support', 'Advanced Analytics']
  },
  usage: {
    apiCalls: 45230,
    storage: 2.3,
    bandwidth: 156.7
  },
  invoices: [
    {
      id: 'inv-001',
      date: '2025-10-01',
      amount: 99,
      status: 'paid',
      downloadUrl: '/api/invoices/inv-001/download'
    }
  ]
}

// Get billing overview
billingRoutes.get('/overview', async (c) => {
  return c.json({
    success: true,
    data: mockBillingData
  })
})

// Get subscription details
billingRoutes.get('/subscription', async (c) => {
  return c.json({
    success: true,
    data: {
      id: 'sub-12345',
      status: 'active',
      currentPeriodStart: '2025-10-01',
      currentPeriodEnd: '2025-11-01',
      plan: mockBillingData.currentPlan
    }
  })
})

// Update subscription
billingRoutes.post('/subscription/update', async (c) => {
  const body = await c.req.json()
  
  return c.json({
    success: true,
    message: 'Subscription updated successfully',
    data: { planId: body.planId }
  })
})

export { billingRoutes }