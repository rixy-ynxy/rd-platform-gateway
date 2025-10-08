import { Hono } from 'hono'
import { HonoEnv } from '../types/env'

const dashboardRoutes = new Hono<HonoEnv>()

// Dashboard statistics endpoint
dashboardRoutes.get('/stats', (c) => {
  return c.json({
    success: true,
    data: {
      users: { total: 245, active: 198 },
      apiCalls: { thisMonth: 125000, usagePercent: 65 },
      storage: { used: 12.5, usagePercent: 25 },
      billing: { monthlyAmount: 299, currentPlan: 'Enterprise' },
      totalTenants: 15,
      activeTenants: 12,
      totalUsers: 1850,
      activeUsers: 1203,
      monthlyRevenue: 45000,
      totalRevenue: 850000,
      apiCallsToday: 8500
    }
  })
})

// API calls metrics endpoint
dashboardRoutes.get('/metrics/api-calls', (c) => {
  const mockData = []
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    mockData.push({
      timestamp: date.toISOString(),
      value: Math.floor(Math.random() * 5000) + 1000
    })
  }
  
  return c.json({
    success: true,
    data: mockData
  })
})

// Recent activities endpoint
dashboardRoutes.get('/activities', (c) => {
  return c.json({
    success: true,
    data: [
      {
        type: 'user_login',
        message: 'User John Doe logged in',
        tenantName: 'ABC Corporation',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
      },
      {
        type: 'user_created',
        message: 'New user Sarah Smith was created',
        tenantName: 'XYZ Inc',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      {
        type: 'api_limit_reached',
        message: 'API limit warning at 80% usage',
        tenantName: 'Demo Company',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
      }
    ]
  })
})

export { dashboardRoutes }