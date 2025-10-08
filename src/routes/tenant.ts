import { Hono } from 'hono'
import { Tenant, ApiResponse, PaginatedResponse, CreateTenantForm } from '../types'
import { HonoEnv } from '../types/env'
import { DatabaseService } from '../services/database'
import { authMiddleware } from '../middleware/auth'

const tenantRoutes = new Hono<HonoEnv>()

// Apply authentication middleware to all routes
tenantRoutes.use('/*', authMiddleware)


// Get all tenants with pagination
tenantRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const search = c.req.query('search') || ''
  const status = c.req.query('status') || ''
  const plan = c.req.query('plan') || ''
  
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Only super_admin can see all tenants, others see only their own
  const hasAdminAccess = user.roles.includes('super_admin')
  
  try {
    const dbService = new DatabaseService(c.env)
    
    let tenants: Tenant[]
    let total: number
    
    if (hasAdminAccess) {
      // Admin can see all tenants
      const result = await dbService.getTenants({
        page,
        limit,
        search,
        status,
        plan
      })
      tenants = result.data
      total = result.total
    } else {
      // Regular users see only their own tenant
      const tenant = await dbService.getTenant(currentTenant.id)
      tenants = tenant ? [tenant] : []
      total = tenants.length
    }
    
    const totalPages = Math.ceil(total / limit)
    
    const response: PaginatedResponse<Tenant> = {
      success: true,
      data: tenants,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Failed to get tenants:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve tenants',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get single tenant
tenantRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check if user has access to this tenant
  const hasAdminAccess = user.roles.includes('super_admin')
  if (!hasAdminAccess && currentTenant.id !== id) {
    return c.json({
      success: false,
      error: 'Access denied: You can only view your own tenant'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const tenant = await dbService.getTenant(id)
    
    if (!tenant) {
      const response: ApiResponse = {
        success: false,
        error: 'Tenant not found'
      }
      return c.json(response, 404)
    }
    
    const response: ApiResponse<Tenant> = {
      success: true,
      data: tenant
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get tenant:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve tenant',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Create new tenant (admin only)
tenantRoutes.post('/', async (c) => {
  const user = c.get('user')
  
  // Only super_admin can create tenants
  if (!user.roles.includes('super_admin')) {
    return c.json({
      success: false,
      error: 'Access denied: Only super administrators can create tenants'
    }, 403)
  }
  
  try {
    const body: CreateTenantForm = await c.req.json()
    const dbService = new DatabaseService(c.env)
    
    // Create tenant in database
    const tenantId = `tenant-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const newTenant = await dbService.createTenant({
      id: tenantId,
      name: body.name,
      domain: body.domain,
      subdomain: body.domain.split('.')[0] || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      status: 'pending',
      plan: body.plan as any,
      ownerEmail: body.ownerEmail,
      ownerName: body.ownerName
    })
    
    // Log tenant creation
    await dbService.createAuditLog({
      action: 'tenant.created',
      resource: 'tenant',
      resourceId: newTenant.id,
      userId: user.id,
      tenantId: newTenant.id,
      metadata: {
        created_by: user.email,
        tenant_name: newTenant.name,
        owner_email: body.ownerEmail
      }
    })
    
    const response: ApiResponse<Tenant> = {
      success: true,
      data: newTenant,
      message: 'Tenant created successfully'
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create tenant:', error)
    return c.json({
      success: false,
      error: 'Failed to create tenant',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Update tenant
tenantRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions: super_admin or tenant_owner of the same tenant
  const hasAdminAccess = user.roles.includes('super_admin')
  const isTenantOwner = user.roles.includes('tenant_owner') && currentTenant.id === id
  
  if (!hasAdminAccess && !isTenantOwner) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const dbService = new DatabaseService(c.env)
    
    // Get existing tenant
    const existingTenant = await dbService.getTenant(id)
    if (!existingTenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404)
    }
    
    // Update tenant
    const updatedTenant = await dbService.updateTenant(id, body)
    
    // Log tenant update
    await dbService.createAuditLog({
      action: 'tenant.updated',
      resource: 'tenant',
      resourceId: id,
      userId: user.id,
      tenantId: id,
      metadata: {
        updated_by: user.email,
        changes: Object.keys(body)
      }
    })
    
    const response: ApiResponse<Tenant> = {
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to update tenant:', error)
    return c.json({
      success: false,
      error: 'Failed to update tenant',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Suspend tenant (admin only)
tenantRoutes.post('/:id/suspend', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  
  // Only super_admin can suspend tenants
  if (!user.roles.includes('super_admin')) {
    return c.json({
      success: false,
      error: 'Access denied: Only super administrators can suspend tenants'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // Check if tenant exists
    const existingTenant = await dbService.getTenant(id)
    if (!existingTenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404)
    }
    
    // Update tenant status
    await dbService.updateTenant(id, { status: 'suspended' })
    
    // Log tenant suspension
    await dbService.createAuditLog({
      action: 'tenant.suspended',
      resource: 'tenant',
      resourceId: id,
      userId: user.id,
      tenantId: id,
      metadata: {
        suspended_by: user.email,
        previous_status: existingTenant.status
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'Tenant suspended successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to suspend tenant:', error)
    return c.json({
      success: false,
      error: 'Failed to suspend tenant',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Activate tenant (admin only)
tenantRoutes.post('/:id/activate', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  
  // Only super_admin can activate tenants
  if (!user.roles.includes('super_admin')) {
    return c.json({
      success: false,
      error: 'Access denied: Only super administrators can activate tenants'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    // Check if tenant exists
    const existingTenant = await dbService.getTenant(id)
    if (!existingTenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404)
    }
    
    // Update tenant status
    await dbService.updateTenant(id, { status: 'active' })
    
    // Log tenant activation
    await dbService.createAuditLog({
      action: 'tenant.activated',
      resource: 'tenant',
      resourceId: id,
      userId: user.id,
      tenantId: id,
      metadata: {
        activated_by: user.email,
        previous_status: existingTenant.status
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'Tenant activated successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to activate tenant:', error)
    return c.json({
      success: false,
      error: 'Failed to activate tenant',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

export { tenantRoutes }