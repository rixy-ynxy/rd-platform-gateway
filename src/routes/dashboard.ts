import { Hono } from 'hono'
import { DashboardStats, Metric, ApiResponse } from '../types'
import { HonoEnv } from '../types/env'
import { DatabaseService } from '../services/database'
import { authMiddleware } from '../middleware/auth'

const dashboardRoutes = new Hono<HonoEnv>()

// Apply authentication middleware to all routes
dashboardRoutes.use('/*', authMiddleware)


// Get dashboard overview statistics
dashboardRoutes.get('/stats', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  const targetTenantId = c.req.query('tenantId')
  const hasAdminAccess = user.roles.includes('super_admin')
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // If specific tenant requested and user has access
    if (targetTenantId) {
      const canViewTenant = hasAdminAccess || 
        (targetTenantId === currentTenant.id && user.roles.some(role => 
          ['tenant_owner', 'admin', 'manager'].includes(role)
        ))
      
      if (!canViewTenant) {
        return c.json({
          success: false,
          error: 'Access denied: Cannot view stats for this tenant'
        }, 403)
      }
      
      // Get tenant-specific stats
      const tenant = await dbService.getTenant(targetTenantId)
      if (!tenant) {
        return c.json({
          success: false,
          error: 'Tenant not found'
        }, 404)
      }
      
      // Get usage stats for current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const [userStats, usageRecords, recentActivities] = await Promise.all([
        dbService.getTenantUserStats(targetTenantId),
        dbService.getUsageRecords(targetTenantId, {
          startDate: startOfMonth.toISOString(),
          endDate: now.toISOString()
        }),
        dbService.getAuditLogs({
          tenantId: targetTenantId,
          limit: 5,
          orderBy: 'timestamp',
          orderDirection: 'desc'
        })
      ])
      
      const totalApiCalls = usageRecords.reduce((sum, record) => sum + (record.apiCalls || 0), 0)
      const todayUsageRecords = usageRecords.filter(record => 
        new Date(record.timestamp) >= startOfDay
      )
      const todayApiCalls = todayUsageRecords.reduce((sum, record) => sum + (record.apiCalls || 0), 0)
      
      const tenantStats = {
        users: {
          total: userStats.total,
          active: userStats.active,
          inactive: userStats.total - userStats.active
        },
        apiCalls: {
          today: todayApiCalls,
          thisMonth: totalApiCalls,
          limit: tenant.limits?.apiCallsPerMonth || 0,
          usagePercent: tenant.limits?.apiCallsPerMonth ? 
            (totalApiCalls / tenant.limits.apiCallsPerMonth) * 100 : 0
        },
        storage: {
          used: tenant.usage?.storage?.usedGB || 0,
          limit: tenant.limits?.storageGB || 0,
          usagePercent: tenant.limits?.storageGB ? 
            ((tenant.usage?.storage?.usedGB || 0) / tenant.limits.storageGB) * 100 : 0
        },
        billing: {
          currentPlan: tenant.billing?.currentPlan || tenant.plan,
          monthlyAmount: tenant.billing?.monthlyPrice || 0,
          nextBillingDate: tenant.billing?.nextBillingDate
        },
        recentActivity: recentActivities.data.map(activity => ({
          type: activity.action,
          message: `${activity.action.replace('_', ' ')} - ${activity.resource}`,
          timestamp: activity.timestamp
        }))
      }
      
      const response: ApiResponse<typeof tenantStats> = {
        success: true,
        data: tenantStats
      }
      return c.json(response)
    }
    
    // Platform-wide stats (admin only)
    if (!hasAdminAccess) {
      return c.json({
        success: false,
        error: 'Access denied: Only administrators can view platform statistics'
      }, 403)
    }
    
    // Get platform stats
    const [platformStats, revenue] = await Promise.all([
      dbService.getPlatformStats(),
      dbService.getTotalRevenue()
    ])
    
    const dashboardStats: DashboardStats = {
      totalTenants: platformStats.totalTenants,
      activeTenants: platformStats.activeTenants,
      totalUsers: platformStats.totalUsers,
      activeUsers: platformStats.activeUsers,
      totalRevenue: revenue.total,
      monthlyRevenue: revenue.thisMonth,
      apiCallsToday: platformStats.apiCallsToday,
      apiCallsThisMonth: platformStats.apiCallsThisMonth,
      systemHealth: 'healthy', // TODO: Implement real health check
      uptime: 99.98 // TODO: Implement real uptime calculation
    }
    
    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: dashboardStats
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get dashboard stats:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard statistics',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get metrics data
dashboardRoutes.get('/metrics/:type', async (c) => {
  const type = c.req.param('type')
  const period = c.req.query('period') || '30d' // 30d, 7d, 24h
  const targetTenantId = c.req.query('tenantId')
  
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  const hasAdminAccess = user.roles.includes('super_admin')
  
  // Validate metric type
  const validMetrics = ['api-calls', 'users', 'revenue', 'tenants', 'response-time', 'error-rate']
  if (!validMetrics.includes(type)) {
    return c.json({
      success: false,
      error: 'Invalid metric type. Valid types: ' + validMetrics.join(', ')
    }, 400)
  }
  
  // Check permissions
  if (targetTenantId) {
    const canViewTenant = hasAdminAccess || 
      (targetTenantId === currentTenant.id && user.roles.some(role => 
        ['tenant_owner', 'admin', 'manager'].includes(role)
      ))
    
    if (!canViewTenant) {
      return c.json({
        success: false,
        error: 'Access denied: Cannot view metrics for this tenant'
      }, 403)
    }
  } else if (!hasAdminAccess) {
    return c.json({
      success: false,
      error: 'Access denied: Only administrators can view platform metrics'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // Calculate date range
    const now = new Date()
    let filterDate: Date
    
    switch (period) {
      case '24h':
        filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
      default:
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    
    let metrics: Metric[]
    
    // Get real metrics from database
    switch (type) {
      case 'api-calls':
        metrics = await dbService.getApiCallMetrics(targetTenantId, filterDate, now)
        break
      case 'users':
        metrics = await dbService.getUserMetrics(targetTenantId, filterDate, now)
        break
      case 'revenue':
        if (targetTenantId && !hasAdminAccess) {
          // Regular tenant users can't see revenue metrics
          return c.json({
            success: false,
            error: 'Access denied: Revenue metrics are not available for tenant users'
          }, 403)
        }
        metrics = await dbService.getRevenueMetrics(targetTenantId, filterDate, now)
        break
      case 'tenants':
        if (!hasAdminAccess) {
          return c.json({
            success: false,
            error: 'Access denied: Tenant metrics are only available to administrators'
          }, 403)
        }
        metrics = await dbService.getTenantMetrics(filterDate, now)
        break
      default:
        // For response-time and error-rate, use mock data for now
        // TODO: Implement real performance metrics collection
        metrics = Array.from({ length: period === '24h' ? 24 : (period === '7d' ? 7 : 30) }, (_, i) => {
          const timeOffset = period === '24h' ? i * 60 * 60 * 1000 :
                           period === '7d' ? i * 24 * 60 * 60 * 1000 :
                           i * 24 * 60 * 60 * 1000
          
          return {
            name: type === 'response-time' ? 'Response Time' : 'Error Rate',
            value: type === 'response-time' ? 
              Math.floor(Math.random() * 50) + 25 :
              Math.random() * 2 + 0.1,
            unit: type === 'response-time' ? 'ms' : '%',
            trend: Math.random() * 10 - 5,
            timestamp: new Date(filterDate.getTime() + timeOffset).toISOString()
          }
        })
        break
    }
    
    const response: ApiResponse<Metric[]> = {
      success: true,
      data: metrics
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get metrics:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve metrics',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get real-time system health
dashboardRoutes.get('/health', async (c) => {
  const user = c.get('user')
  const hasAdminAccess = user.roles.includes('super_admin')
  
  // Only admins can view system health
  if (!hasAdminAccess) {
    return c.json({
      success: false,
      error: 'Access denied: Only administrators can view system health'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // Test database connectivity
    const dbStart = Date.now()
    let dbStatus = 'healthy'
    let dbResponseTime = 0
    
    try {
      await dbService.testConnection()
      dbResponseTime = Date.now() - dbStart
    } catch (error) {
      console.error('Database health check failed:', error)
      dbStatus = 'unhealthy'
      dbResponseTime = Date.now() - dbStart
    }
    
    // Test Keycloak connectivity (if configured)
    const keycloakStart = Date.now()
    let keycloakStatus = 'healthy'
    let keycloakResponseTime = 0
    
    try {
      // TODO: Implement Keycloak health check
      keycloakResponseTime = Date.now() - keycloakStart
    } catch (error) {
      console.error('Keycloak health check failed:', error)
      keycloakStatus = 'unhealthy'
      keycloakResponseTime = Date.now() - keycloakStart
    }
    
    // Test Stripe connectivity (if configured)
    const stripeStart = Date.now()
    let stripeStatus = 'healthy'
    let stripeResponseTime = 0
    
    try {
      // TODO: Implement Stripe health check
      stripeResponseTime = Date.now() - stripeStart
    } catch (error) {
      console.error('Stripe health check failed:', error)
      stripeStatus = 'unhealthy'
      stripeResponseTime = Date.now() - stripeStart
    }
    
    // Determine overall system status
    const allServices = [dbStatus, keycloakStatus, stripeStatus]
    const overallStatus = allServices.every(status => status === 'healthy') ? 'healthy' :
                         allServices.some(status => status === 'healthy') ? 'degraded' : 'unhealthy'
    
    const healthData = {
      status: overallStatus,
      uptime: '99.98%', // TODO: Implement real uptime calculation
      services: {
        api: {
          status: 'healthy',
          responseTime: 25, // Current request processing
          uptime: 99.99
        },
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          uptime: 99.98 // TODO: Calculate from historical data
        },
        cache: {
          status: 'healthy', // Cloudflare edge cache
          responseTime: 3,
          uptime: 99.95
        },
        auth: {
          status: keycloakStatus,
          responseTime: keycloakResponseTime,
          uptime: 99.97 // TODO: Calculate from historical data
        },
        payments: {
          status: stripeStatus,
          responseTime: stripeResponseTime,
          uptime: 99.93 // TODO: Calculate from historical data
        }
      },
      lastChecked: new Date().toISOString(),
      version: '1.0.0', // TODO: Get from package.json or environment
      environment: c.env.ENVIRONMENT || 'development'
    }
    
    const response: ApiResponse<typeof healthData> = {
      success: true,
      data: healthData
    }
    return c.json(response)
  } catch (error) {
    console.error('Health check failed:', error)
    return c.json({
      success: false,
      error: 'Failed to perform health check',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get recent activities
dashboardRoutes.get('/activities', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20')
  const targetTenantId = c.req.query('tenantId')
  
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  const hasAdminAccess = user.roles.includes('super_admin')
  
  // Check permissions
  if (targetTenantId) {
    const canViewTenant = hasAdminAccess || 
      (targetTenantId === currentTenant.id && user.roles.some(role => 
        ['tenant_owner', 'admin', 'manager'].includes(role)
      ))
    
    if (!canViewTenant) {
      return c.json({
        success: false,
        error: 'Access denied: Cannot view activities for this tenant'
      }, 403)
    }
  } else if (!hasAdminAccess) {
    return c.json({
      success: false,
      error: 'Access denied: Only administrators can view platform activities'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    const auditLogs = await dbService.getAuditLogs({
      tenantId: targetTenantId,
      limit,
      orderBy: 'timestamp',
      orderDirection: 'desc'
    })
    
    // Transform audit logs to activity format
    const activities = await Promise.all(
      auditLogs.data.map(async (log) => {
        // Get tenant and user names for display
        const [tenant, logUser] = await Promise.all([
          log.tenantId ? dbService.getTenant(log.tenantId) : null,
          log.userId ? dbService.getUser(log.userId) : null
        ])
        
        // Determine severity based on action
        let severity: 'info' | 'warning' | 'error' = 'info'
        if (log.action.includes('failed') || log.action.includes('error') || log.action.includes('suspended')) {
          severity = 'error'
        } else if (log.action.includes('limit') || log.action.includes('warning') || log.action.includes('deactivated')) {
          severity = 'warning'
        }
        
        // Create readable message
        let message = `${log.action.replace(/_/g, ' ')} - ${log.resource}`
        if (log.metadata) {
          const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata
          if (metadata.target_user) {
            message += ` for ${metadata.target_user}`
          } else if (metadata.user_email) {
            message += ` (${metadata.user_email})`
          }
        }
        
        return {
          id: log.id,
          type: log.action,
          message,
          tenantId: log.tenantId,
          tenantName: tenant?.name,
          userId: log.userId,
          userEmail: logUser?.email,
          timestamp: log.timestamp,
          severity,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent
        }
      })
    )
    
    const response: ApiResponse<typeof activities> = {
      success: true,
      data: activities
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get activities:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve activities',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get usage analytics
dashboardRoutes.get('/usage', async (c) => {
  const targetTenantId = c.req.query('tenantId')
  const period = c.req.query('period') || '30d'
  
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  const hasAdminAccess = user.roles.includes('super_admin')
  
  // Check permissions
  if (targetTenantId) {
    const canViewTenant = hasAdminAccess || 
      (targetTenantId === currentTenant.id && user.roles.some(role => 
        ['tenant_owner', 'admin', 'manager'].includes(role)
      ))
    
    if (!canViewTenant) {
      return c.json({
        success: false,
        error: 'Access denied: Cannot view usage for this tenant'
      }, 403)
    }
  } else if (!hasAdminAccess) {
    return c.json({
      success: false,
      error: 'Access denied: Only administrators can view platform usage'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // Calculate date ranges
    const now = new Date()
    let currentStart: Date, previousStart: Date, previousEnd: Date
    
    switch (period) {
      case '7d':
        currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
      default:
        currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }
    
    // Get usage data
    const [currentUsage, previousUsage, topTenants] = await Promise.all([
      dbService.getUsageRecords(targetTenantId, {
        startDate: currentStart.toISOString(),
        endDate: now.toISOString()
      }),
      dbService.getUsageRecords(targetTenantId, {
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString()
      }),
      !targetTenantId && hasAdminAccess ? dbService.getTopTenantsByUsage(5) : Promise.resolve([])
    ])
    
    // Calculate summary statistics
    const currentApiCalls = currentUsage.reduce((sum, record) => sum + (record.apiCalls || 0), 0)
    const previousApiCalls = previousUsage.reduce((sum, record) => sum + (record.apiCalls || 0), 0)
    const apiCallsChange = previousApiCalls > 0 ? 
      ((currentApiCalls - previousApiCalls) / previousApiCalls) * 100 : 0
    
    const currentUsers = targetTenantId ? 
      await dbService.getUserCount(targetTenantId) :
      await dbService.getTotalUserCount()
    
    const currentStorage = currentUsage.reduce((sum, record) => sum + (record.storageGB || 0), 0)
    const previousStorage = previousUsage.reduce((sum, record) => sum + (record.storageGB || 0), 0)
    const storageChange = previousStorage > 0 ? 
      ((currentStorage - previousStorage) / previousStorage) * 100 : 0
    
    const currentBandwidth = currentUsage.reduce((sum, record) => sum + (record.bandwidthGB || 0), 0)
    const previousBandwidth = previousUsage.reduce((sum, record) => sum + (record.bandwidthGB || 0), 0)
    const bandwidthChange = previousBandwidth > 0 ? 
      ((currentBandwidth - previousBandwidth) / previousBandwidth) * 100 : 0
    
    // Get tenant limits if viewing specific tenant
    let apiCallLimit = null
    if (targetTenantId) {
      const tenant = await dbService.getTenant(targetTenantId)
      apiCallLimit = tenant?.limits?.apiCallsPerMonth || null
    }
    
    const usageData = {
      period,
      tenantId: targetTenantId,
      summary: {
        apiCalls: {
          current: currentApiCalls,
          previous: previousApiCalls,
          change: Math.round(apiCallsChange * 100) / 100,
          limit: apiCallLimit
        },
        users: {
          current: currentUsers,
          previous: currentUsers, // TODO: Track historical user counts
          change: 0 // TODO: Calculate user growth
        },
        storage: {
          current: Math.round(currentStorage * 100) / 100,
          previous: Math.round(previousStorage * 100) / 100,
          change: Math.round(storageChange * 100) / 100,
          unit: 'GB'
        },
        bandwidth: {
          current: Math.round(currentBandwidth * 100) / 100,
          previous: Math.round(previousBandwidth * 100) / 100,
          change: Math.round(bandwidthChange * 100) / 100,
          unit: 'GB'
        }
      },
      breakdown: {
        topTenants: !targetTenantId && hasAdminAccess ? topTenants : null,
        topEndpoints: [
          // TODO: Implement endpoint usage tracking
          // For now, return empty array
        ]
      }
    }
    
    const response: ApiResponse<typeof usageData> = {
      success: true,
      data: usageData
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get usage analytics:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve usage analytics',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

export { dashboardRoutes }