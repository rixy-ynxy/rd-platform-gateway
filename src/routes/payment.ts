import { Hono } from 'hono'
import { PaymentMethod, Invoice, ApiResponse, PaginatedResponse } from '../types'
import { HonoEnv } from '../types/env'
import { DatabaseService } from '../services/database'
import { StripeConnectService } from '../services/stripe'
import { demoAuthMiddleware } from '../middleware/demo-auth'

const paymentRoutes = new Hono<HonoEnv>()

// Apply demo authentication middleware to all routes (for development)
paymentRoutes.use('/*', demoAuthMiddleware)


// Get payment methods for a tenant
paymentRoutes.get('/methods', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  const targetTenantId = c.req.query('tenantId') || currentTenant.id
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canViewPayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  ) && targetTenantId === currentTenant.id
  
  if (!hasAdminAccess && !canViewPayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to view payment methods'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant payment methods from database
    const paymentMethods = await dbService.getPaymentMethods(targetTenantId)
    
    const response: ApiResponse<PaymentMethod[]> = {
      success: true,
      data: paymentMethods
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get payment methods:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve payment methods',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Add new payment method
paymentRoutes.post('/methods', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canManagePayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canManagePayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to add payment methods'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const { paymentMethodId, isDefault } = body
    
    if (!paymentMethodId) {
      return c.json({
        success: false,
        error: 'Payment method ID is required'
      }, 400)
    }
    
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant's Stripe customer
    const tenant = await dbService.getTenant(currentTenant.id)
    if (!tenant || !tenant.stripeCustomerId) {
      return c.json({
        success: false,
        error: 'Tenant Stripe customer not found'
      }, 404)
    }
    
    // Attach payment method to customer in Stripe
    const paymentMethod = await stripeService.attachPaymentMethod(
      paymentMethodId,
      tenant.stripeCustomerId
    )
    
    // Save to database
    const newPaymentMethod = await dbService.createPaymentMethod({
      id: paymentMethod.id,
      tenantId: currentTenant.id,
      type: paymentMethod.type as any,
      brand: paymentMethod.card?.brand || 'unknown',
      last4: paymentMethod.card?.last4 || '0000',
      expiryMonth: paymentMethod.card?.exp_month || 12,
      expiryYear: paymentMethod.card?.exp_year || 2099,
      isDefault: isDefault || false
    })
    
    // Set as default if requested
    if (isDefault) {
      await stripeService.setDefaultPaymentMethod(tenant.stripeCustomerId, paymentMethodId)
      await dbService.setDefaultPaymentMethod(currentTenant.id, paymentMethod.id)
    }
    
    // Log payment method addition
    await dbService.createAuditLog({
      action: 'payment_method.added',
      resource: 'payment_method',
      resourceId: paymentMethod.id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        added_by: user.email,
        payment_method_type: paymentMethod.type,
        is_default: isDefault || false
      }
    })
    
    const response: ApiResponse<PaymentMethod> = {
      success: true,
      data: newPaymentMethod,
      message: 'Payment method added successfully'
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to add payment method:', error)
    return c.json({
      success: false,
      error: 'Failed to add payment method',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Set default payment method
paymentRoutes.post('/methods/:id/set-default', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canManagePayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canManagePayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to manage payment methods'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant
    const tenant = await dbService.getTenant(currentTenant.id)
    if (!tenant || !tenant.stripeCustomerId) {
      return c.json({
        success: false,
        error: 'Tenant Stripe customer not found'
      }, 404)
    }
    
    // Verify payment method exists and belongs to tenant
    const paymentMethods = await dbService.getPaymentMethods(currentTenant.id)
    const paymentMethod = paymentMethods.find(pm => pm.id === id)
    
    if (!paymentMethod) {
      return c.json({
        success: false,
        error: 'Payment method not found'
      }, 404)
    }
    
    // Set as default in Stripe
    await stripeService.setDefaultPaymentMethod(tenant.stripeCustomerId, id)
    
    // Update in database
    await dbService.setDefaultPaymentMethod(currentTenant.id, id)
    
    // Log action
    await dbService.createAuditLog({
      action: 'payment_method.set_default',
      resource: 'payment_method',
      resourceId: id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        updated_by: user.email,
        payment_method_last4: paymentMethod.last4
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'Default payment method updated'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to set default payment method:', error)
    return c.json({
      success: false,
      error: 'Failed to set default payment method',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Remove payment method
paymentRoutes.delete('/methods/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canManagePayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canManagePayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to remove payment methods'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get payment methods for tenant
    const paymentMethods = await dbService.getPaymentMethods(currentTenant.id)
    const paymentMethod = paymentMethods.find(pm => pm.id === id)
    
    if (!paymentMethod) {
      return c.json({
        success: false,
        error: 'Payment method not found'
      }, 404)
    }
    
    // Check if it's the default method
    if (paymentMethod.isDefault && paymentMethods.length > 1) {
      return c.json({
        success: false,
        error: 'Cannot remove default payment method. Please set another method as default first.'
      }, 400)
    }
    
    // Detach from Stripe
    await stripeService.detachPaymentMethod(id)
    
    // Remove from database
    await dbService.deletePaymentMethod(id)
    
    // Log action
    await dbService.createAuditLog({
      action: 'payment_method.removed',
      resource: 'payment_method',
      resourceId: id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        removed_by: user.email,
        payment_method_last4: paymentMethod.last4,
        was_default: paymentMethod.isDefault
      }
    })
    
    const response: ApiResponse = {
      success: true,
      message: 'Payment method removed successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to remove payment method:', error)
    return c.json({
      success: false,
      error: 'Failed to remove payment method',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get invoices for a tenant
paymentRoutes.get('/invoices', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  const targetTenantId = c.req.query('tenantId') || currentTenant.id
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const status = c.req.query('status')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canViewInvoices = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  ) && targetTenantId === currentTenant.id
  
  if (!hasAdminAccess && !canViewInvoices) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to view invoices'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    
    const result = await dbService.getInvoices({
      tenantId: targetTenantId,
      page,
      limit,
      status
    })
    
    const response: PaginatedResponse<Invoice> = {
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
    console.error('Failed to get invoices:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve invoices',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get single invoice
paymentRoutes.get('/invoices/:id', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const invoice = await dbService.getInvoice(id)
    
    if (!invoice) {
      return c.json({
        success: false,
        error: 'Invoice not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = user.roles.includes('super_admin')
    const canViewInvoice = user.roles.some(role => 
      ['tenant_owner', 'admin'].includes(role)
    ) && invoice.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !canViewInvoice) {
      return c.json({
        success: false,
        error: 'Access denied: You can only view invoices for your tenant'
      }, 403)
    }
    
    const response: ApiResponse<Invoice> = {
      success: true,
      data: invoice
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get invoice:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve invoice',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Download invoice PDF
paymentRoutes.get('/invoices/:id/download', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    const invoice = await dbService.getInvoice(id)
    if (!invoice) {
      return c.json({
        success: false,
        error: 'Invoice not found'
      }, 404)
    }
    
    // Check permissions
    const hasAdminAccess = user.roles.includes('super_admin')
    const canDownloadInvoice = user.roles.some(role => 
      ['tenant_owner', 'admin'].includes(role)
    ) && invoice.tenantId === currentTenant.id
    
    if (!hasAdminAccess && !canDownloadInvoice) {
      return c.json({
        success: false,
        error: 'Access denied: You can only download invoices for your tenant'
      }, 403)
    }
    
    // Get download URL from Stripe
    const downloadUrl = await stripeService.getInvoiceDownloadUrl(id)
    
    // Log download action
    await dbService.createAuditLog({
      action: 'invoice.downloaded',
      resource: 'invoice',
      resourceId: id,
      userId: user.id,
      tenantId: invoice.tenantId,
      metadata: {
        downloaded_by: user.email,
        invoice_number: invoice.number
      }
    })
    
    const response: ApiResponse<{ downloadUrl: string }> = {
      success: true,
      data: {
        downloadUrl
      },
      message: 'Invoice download URL generated'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get invoice download URL:', error)
    return c.json({
      success: false,
      error: 'Failed to generate download URL',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Create payment intent (for immediate payments)
paymentRoutes.post('/intents', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canCreatePayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canCreatePayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to create payment intents'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const { amount, currency = 'USD', description, applicationFeeAmount } = body
    
    if (!amount || amount <= 0) {
      return c.json({
        success: false,
        error: 'Valid amount is required'
      }, 400)
    }
    
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant
    const tenant = await dbService.getTenant(currentTenant.id)
    if (!tenant || !tenant.stripeCustomerId) {
      return c.json({
        success: false,
        error: 'Tenant Stripe customer not found'
      }, 404)
    }
    
    // Create payment intent with platform fee
    const paymentIntent = await stripeService.createPaymentIntent(
      Math.round(amount * 100), // Convert to cents
      currency.toLowerCase(),
      tenant.stripeCustomerId,
      {
        description,
        applicationFeeAmount: applicationFeeAmount ? Math.round(applicationFeeAmount * 100) : undefined,
        metadata: {
          tenant_id: currentTenant.id,
          created_by: user.id
        }
      }
    )
    
    // Log payment intent creation
    await dbService.createAuditLog({
      action: 'payment_intent.created',
      resource: 'payment_intent',
      resourceId: paymentIntent.id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        created_by: user.email,
        amount: amount,
        currency: currency,
        description: description
      }
    })
    
    const response: ApiResponse<typeof paymentIntent> = {
      success: true,
      data: paymentIntent,
      message: 'Payment intent created successfully'
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    return c.json({
      success: false,
      error: 'Failed to create payment intent',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Confirm payment intent
paymentRoutes.post('/intents/:id/confirm', async (c) => {
  const id = c.req.param('id')
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canConfirmPayments = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canConfirmPayments) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to confirm payments'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const { paymentMethodId } = body
    
    if (!paymentMethodId) {
      return c.json({
        success: false,
        error: 'Payment method ID is required'
      }, 400)
    }
    
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Confirm payment intent
    const confirmedIntent = await stripeService.confirmPaymentIntent(id, paymentMethodId)
    
    // Log payment confirmation
    await dbService.createAuditLog({
      action: 'payment_intent.confirmed',
      resource: 'payment_intent',
      resourceId: id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        confirmed_by: user.email,
        payment_method_id: paymentMethodId,
        amount: confirmedIntent.amount,
        status: confirmedIntent.status
      }
    })
    
    const response: ApiResponse<typeof confirmedIntent> = {
      success: true,
      data: confirmedIntent,
      message: 'Payment confirmed successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to confirm payment intent:', error)
    return c.json({
      success: false,
      error: 'Failed to confirm payment',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get billing summary for a tenant
paymentRoutes.get('/billing-summary', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  const targetTenantId = c.req.query('tenantId') || currentTenant.id
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canViewBilling = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  ) && targetTenantId === currentTenant.id
  
  if (!hasAdminAccess && !canViewBilling) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to view billing information'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant
    const tenant = await dbService.getTenant(targetTenantId)
    if (!tenant) {
      return c.json({
        success: false,
        error: 'Tenant not found'
      }, 404)
    }
    
    // Get payment methods
    const paymentMethods = await dbService.getPaymentMethods(targetTenantId)
    const defaultPaymentMethod = paymentMethods.find(pm => pm.isDefault)
    
    // Get usage records for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const usageRecords = await dbService.getUsageRecords(targetTenantId, {
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString()
    })
    
    // Calculate usage totals
    const usageThisMonth = {
      apiCalls: usageRecords.reduce((sum, record) => sum + (record.apiCalls || 0), 0),
      users: await dbService.getUserCount(targetTenantId),
      storage: usageRecords.reduce((sum, record) => sum + (record.storageGB || 0), 0)
    }
    
    // Get upcoming invoice if available
    let upcomingInvoice = null
    if (tenant.stripeCustomerId) {
      try {
        upcomingInvoice = await stripeService.getUpcomingInvoice(tenant.stripeCustomerId)
      } catch (error) {
        console.log('No upcoming invoice found:', error.message)
      }
    }
    
    const billingSummary = {
      currentPeriod: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
        amount: tenant.billing?.monthlyPrice || 0,
        currency: tenant.billing?.currency || 'USD'
      },
      nextBillingDate: tenant.billing?.nextBillingDate,
      paymentMethod: defaultPaymentMethod,
      upcomingInvoice,
      usageThisMonth,
      tenant: {
        plan: tenant.plan,
        limits: tenant.limits
      }
    }
    
    const response: ApiResponse<typeof billingSummary> = {
      success: true,
      data: billingSummary
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get billing summary:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve billing summary',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Create Stripe Connect Account for tenant
paymentRoutes.post('/connect-account', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions - only tenant owners can create connect accounts
  if (!user.roles.includes('super_admin') && !user.roles.includes('tenant_owner')) {
    return c.json({
      success: false,
      error: 'Access denied: Only tenant owners can create Stripe Connect accounts'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const { country = 'US', type = 'express' } = body
    
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Check if tenant already has a connect account
    const tenant = await dbService.getTenant(currentTenant.id)
    if (tenant?.stripeConnectAccountId) {
      return c.json({
        success: false,
        error: 'Tenant already has a Stripe Connect account'
      }, 400)
    }
    
    // Create Stripe Connect account
    const connectAccount = await stripeService.createConnectAccount({
      type,
      country,
      email: user.email,
      business_profile: {
        name: tenant?.name || currentTenant.name
      },
      metadata: {
        tenant_id: currentTenant.id,
        created_by: user.id
      }
    })
    
    // Update tenant with connect account ID
    await dbService.updateTenant(currentTenant.id, {
      stripeConnectAccountId: connectAccount.id
    })
    
    // Log account creation
    await dbService.createAuditLog({
      action: 'stripe_connect_account.created',
      resource: 'stripe_connect_account',
      resourceId: connectAccount.id,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        created_by: user.email,
        account_type: type,
        country: country
      }
    })
    
    const response: ApiResponse<typeof connectAccount> = {
      success: true,
      data: connectAccount,
      message: 'Stripe Connect account created successfully'
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create Stripe Connect account:', error)
    return c.json({
      success: false,
      error: 'Failed to create Stripe Connect account',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Create account onboarding link
paymentRoutes.post('/connect-account/onboarding-link', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  if (!user.roles.includes('super_admin') && !user.roles.includes('tenant_owner')) {
    return c.json({
      success: false,
      error: 'Access denied: Only tenant owners can manage Stripe Connect onboarding'
    }, 403)
  }
  
  try {
    const body = await c.req.json()
    const { refreshUrl, returnUrl } = body
    
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant
    const tenant = await dbService.getTenant(currentTenant.id)
    if (!tenant?.stripeConnectAccountId) {
      return c.json({
        success: false,
        error: 'No Stripe Connect account found for this tenant'
      }, 404)
    }
    
    // Create onboarding link
    const onboardingLink = await stripeService.createAccountOnboardingLink(
      tenant.stripeConnectAccountId,
      refreshUrl,
      returnUrl
    )
    
    // Log onboarding link creation
    await dbService.createAuditLog({
      action: 'stripe_connect_onboarding.link_created',
      resource: 'stripe_connect_account',
      resourceId: tenant.stripeConnectAccountId,
      userId: user.id,
      tenantId: currentTenant.id,
      metadata: {
        created_by: user.email,
        refresh_url: refreshUrl,
        return_url: returnUrl
      }
    })
    
    const response: ApiResponse<typeof onboardingLink> = {
      success: true,
      data: onboardingLink,
      message: 'Onboarding link created successfully'
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to create onboarding link:', error)
    return c.json({
      success: false,
      error: 'Failed to create onboarding link',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Get Connect Account status
paymentRoutes.get('/connect-account/status', async (c) => {
  const user = c.get('user')
  const currentTenant = c.get('tenant')
  
  // Check permissions
  const hasAdminAccess = user.roles.includes('super_admin')
  const canViewAccount = user.roles.some(role => 
    ['tenant_owner', 'admin'].includes(role)
  )
  
  if (!hasAdminAccess && !canViewAccount) {
    return c.json({
      success: false,
      error: 'Access denied: Insufficient permissions to view Connect account status'
    }, 403)
  }
  
  try {
    const dbService = new DatabaseService(c.env)
    const stripeService = new StripeConnectService(c.env)
    
    // Get tenant
    const tenant = await dbService.getTenant(currentTenant.id)
    if (!tenant?.stripeConnectAccountId) {
      return c.json({
        success: true,
        data: {
          hasAccount: false,
          status: 'not_created'
        }
      })
    }
    
    // Get account status from Stripe
    const accountStatus = await stripeService.getAccountStatus(tenant.stripeConnectAccountId)
    
    const response: ApiResponse<typeof accountStatus> = {
      success: true,
      data: {
        hasAccount: true,
        ...accountStatus
      }
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to get Connect account status:', error)
    return c.json({
      success: false,
      error: 'Failed to retrieve Connect account status',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

export { paymentRoutes }