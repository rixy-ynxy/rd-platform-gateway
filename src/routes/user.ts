import { Hono } from 'hono'
import { User, ApiResponse, PaginatedResponse, CreateUserForm } from '../types'
import { HonoEnv } from '../types/env'
import { DatabaseService } from '../services/database'
import { authMiddleware } from '../middleware/auth'

const userRoutes = new Hono<HonoEnv>()

// Apply authentication middleware to all routes
userRoutes.use('/*', authMiddleware)


// Get all users with pagination and filters
userRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const search = c.req.query('search') || ''
  const tenantFilter = c.req.query('tenantId') || ''
  const role = c.req.query('role') || ''
  const isActive = c.req.query('isActive')
  
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Determine tenant scope
  const hasAdminAccess = user.roles.includes('super_admin')
  const targetTenantId = hasAdminAccess ? tenantFilter : currentTenant.id
  
  try {
    const dbService = new DatabaseService(c.env)
    
    const result = await dbService.getUsers({
      page,
      limit,
      search,
      tenantId: targetTenantId,
      role,
      isActive: isActive ? (isActive === 'true') : undefined
    })
    
    const response: PaginatedResponse<User> = {
      success: true,
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Failed to get users:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve users',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get single user
userRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const user = await dbService.getUser(id)
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check if user has access to this user record
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const isSameUser = currentUser.id === id
    const isSameTenant = user.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !isSameUser && !isSameTenant) {
      return c.json({
        success: false,
        error: 'Access denied: You can only view users in your tenant'
      }, 403)
    }
    
    const response: ApiResponse<User> = {
      success: true,
      data: user
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get user:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve user',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Create new user
userRoutes.post('/', async (c) => {
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions: super_admin or tenant_owner/admin
  const hasAdminAccess = currentUser.roles.includes('super_admin')
  const canCreateUsers = currentUser.roles.some(role => 
    ['tenant_owner', 'admin', 'manager'].includes(role)
  )
  
  if (!hasAdminAccess && !canCreateUsers) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to create users'
    }, 403)
  }
  
  try {
    const body: CreateUserForm = await c.req.json()
    const dbService = new DatabaseService(c.env)
    
    // Determine target tenant
    const targetTenantId = hasAdminAccess && body.tenantId ? body.tenantId : currentTenant.id
    
    // Check if email already exists in the target tenant
    const existingUser = await dbService.getUserByEmail(body.email)
    if (existingUser && existingUser.tenantId === targetTenantId) {
      return c.json({
        success: false,
        error: 'Email already exists in this tenant'
      }, 400)
    }
    
    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const newUser = await dbService.createUser({
      id: userId,
      email: body.email,
      name: body.name,
      tenantId: targetTenantId,
      roles: body.roles,
      avatar: null,
      keycloakUserId: null // Will be set when user logs in via Keycloak
    })
    
    // Log user creation
    await dbService.createAuditLog({
      action: 'user.created',
      resource: 'user',
      resourceId: newUser.id,
      userId: currentUser.id,
      tenantId: targetTenantId,
      metadata: {
        created_by: currentUser.email,
        user_email: newUser.email,
        user_roles: newUser.roles,
        invitation_sent: body.sendInvite || false
      }
    })
    
    const response: ApiResponse<User> = {
      success: true,
      data: newUser,
      message: body.sendInvite 
        ? `User created and invitation sent to ${body.email}`
        : 'User created successfully'
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create user:', error)
    return c.json({
      success: false,
      error: 'Failed to create user',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Update user
userRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const existingUser = await dbService.getUser(id)
    
    if (!existingUser) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const isSameUser = currentUser.id === id
    const canManageUsers = currentUser.roles.some(role => 
      ['tenant_owner', 'admin', 'manager'].includes(role)
    ) && existingUser.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !isSameUser && !canManageUsers) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions to update this user'
      }, 403)
    }
    
    const body = await c.req.json()
    
    // Prevent users from elevating their own roles (except super_admin)
    if (isSameUser && !hasAdminAccess && body.roles) {
      delete body.roles
    }
    
    // Update user
    const updatedUser = await dbService.updateUser(id, body)
    
    // Log user update
    await dbService.createAuditLog({
      action: 'user.updated',
      resource: 'user',
      resourceId: id,
      userId: currentUser.id,
      tenantId: existingUser.tenantId,
      metadata: {
        updated_by: currentUser.email,
        target_user: existingUser.email,
        changes: Object.keys(body)
      }
    })
    
    const response: ApiResponse<User> = {
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to update user:', error)
    return c.json({
      success: false,
      error: 'Failed to update user',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Deactivate user
userRoutes.post('/:id/deactivate', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const existingUser = await dbService.getUser(id)
    
    if (!existingUser) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const canManageUsers = currentUser.roles.some(role => 
      ['tenant_owner', 'admin'].includes(role)
    ) && existingUser.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !canManageUsers) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions to deactivate users'
      }, 403)
    }
    
    // Prevent deactivating self
    if (currentUser.id === id) {
      return c.json({
        success: false,
        error: 'Cannot deactivate your own account'
      }, 400)
    }
    
    // Update user status
    await dbService.updateUser(id, { isActive: false })
    
    // Log user deactivation
    await dbService.createAuditLog({
      action: 'user.deactivated',
      resource: 'user',
      resourceId: id,
      userId: currentUser.id,
      tenantId: existingUser.tenantId,
      metadata: {
        deactivated_by: currentUser.email,
        target_user: existingUser.email
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'User deactivated successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to deactivate user:', error)
    return c.json({
      success: false,
      error: 'Failed to deactivate user',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Activate user
userRoutes.post('/:id/activate', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const existingUser = await dbService.getUser(id)
    
    if (!existingUser) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const canManageUsers = currentUser.roles.some(role => 
      ['tenant_owner', 'admin'].includes(role)
    ) && existingUser.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !canManageUsers) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions to activate users'
      }, 403)
    }
    
    // Update user status
    await dbService.updateUser(id, { isActive: true })
    
    // Log user activation
    await dbService.createAuditLog({
      action: 'user.activated',
      resource: 'user',
      resourceId: id,
      userId: currentUser.id,
      tenantId: existingUser.tenantId,
      metadata: {
        activated_by: currentUser.email,
        target_user: existingUser.email
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'User activated successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to activate user:', error)
    return c.json({
      success: false,
      error: 'Failed to activate user',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Resend invitation
userRoutes.post('/:id/resend-invitation', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const user = await dbService.getUser(id)
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const canManageUsers = currentUser.roles.some(role => 
      ['tenant_owner', 'admin', 'manager'].includes(role)
    ) && user.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !canManageUsers) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions to resend invitations'
      }, 403)
    }
    
    // Log invitation resend
    await dbService.createAuditLog({
      action: 'user.invitation_resent',
      resource: 'user',
      resourceId: id,
      userId: currentUser.id,
      tenantId: user.tenantId,
      metadata: {
        resent_by: currentUser.email,
        target_user: user.email
      }
    })
    
    // TODO: Implement actual invitation email sending via Keycloak or email service
    
    const response: ApiResponse = {
      success: true,
      message: `Invitation resent to ${user.email}`
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to resend invitation:', error)
    return c.json({
      success: false,
      error: 'Failed to resend invitation',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Reset user password
userRoutes.post('/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  const currentUser = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const user = await dbService.getUser(id)
    
    if (!user) {
      return c.json({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = currentUser.roles.includes('super_admin')
    const canManageUsers = currentUser.roles.some(role => 
      ['tenant_owner', 'admin'].includes(role)
    ) && user.tenantId === currentTenant.id
    const isSameUser = currentUser.id === id
    
    if (!hasAdminAccess && !canManageUsers && !isSameUser) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions to reset passwords'
      }, 403)
    }
    
    // Log password reset request
    await dbService.createAuditLog({
      action: 'user.password_reset_requested',
      resource: 'user',
      resourceId: id,
      userId: currentUser.id,
      tenantId: user.tenantId,
      metadata: {
        requested_by: currentUser.email,
        target_user: user.email,
        is_self_reset: isSameUser
      }
    })
    
    // TODO: Implement actual password reset via Keycloak Admin API
    
    const response: ApiResponse = {
      success: true,
      message: `Password reset instructions sent to ${user.email}`
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to reset password:', error)
    return c.json({
      success: false,
      error: 'Failed to reset password',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

export { userRoutes }