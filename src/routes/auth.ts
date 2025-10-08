import { Hono } from 'hono'
import { User, ApiResponse } from '../types'
import { HonoEnv } from '../types/env'
import { KeycloakService } from '../services/keycloak'
import { DatabaseService } from '../services/database'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'

const authRoutes = new Hono<HonoEnv>()



// Keycloak login redirect
authRoutes.get('/login', async (c) => {
  const redirectUri = c.req.query('redirect_uri') || `${c.req.url.split('/api')[0]}/auth/callback`
  const state = c.req.query('state') || crypto.randomUUID()
  
  // For demo mode, return mock login URL
  if (c.env?.ENVIRONMENT === 'demo' || !c.env?.KEYCLOAK_SERVER_URL) {
    return c.json({
      success: true,
      data: {
        login_url: '/auth/demo-login',
        redirect_uri: redirectUri,
        demo_mode: true
      }
    })
  }
  
  const keycloakService = new KeycloakService({
    serverUrl: c.env.KEYCLOAK_SERVER_URL,
    clientId: c.env.KEYCLOAK_CLIENT_ID,
    clientSecret: c.env.KEYCLOAK_CLIENT_SECRET,
    realm: c.env.KEYCLOAK_REALM,
    redirectUri: redirectUri
  })
  
  const loginUrl = keycloakService.getAuthorizationUrl(state)
  
  return c.json({
    success: true,
    data: {
      login_url: loginUrl,
      redirect_uri: redirectUri,
      state: state
    }
  })
})

// Keycloak callback handler
authRoutes.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  
  if (error) {
    return c.json({
      success: false,
      error: `Authentication failed: ${error}`
    }, 400)
  }
  
  if (!code) {
    return c.json({
      success: false,
      error: 'Missing authorization code'
    }, 400)
  }
  
  try {
    const keycloakService = new KeycloakService({
      serverUrl: c.env.KEYCLOAK_SERVER_URL,
      clientId: c.env.KEYCLOAK_CLIENT_ID,
      clientSecret: c.env.KEYCLOAK_CLIENT_SECRET,
      realm: c.env.KEYCLOAK_REALM,
      redirectUri: `${c.req.url.split('/api')[0]}/auth/callback`
    })
    
    const dbService = new DatabaseService(c.env)
    
    // Exchange code for tokens
    const tokens = await keycloakService.exchangeCodeForToken(code)
    
    // Verify and get user info
    const jwtPayload = await keycloakService.validateToken(tokens.access_token)
    const userInfo = await keycloakService.getUserInfo(tokens.access_token)
    
    // Get or create user in database
    let user = await dbService.getUserByKeycloakId(jwtPayload.sub)
    
    if (!user) {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`
      user = await dbService.createUser({
        id: userId,
        keycloakUserId: jwtPayload.sub,
        tenantId: keycloakService.getTenantId(jwtPayload),
        email: jwtPayload.email || userInfo.email,
        name: jwtPayload.name || userInfo.name,
        avatar: userInfo.picture,
        roles: keycloakService.extractRolesFromToken(jwtPayload)
      })
      
      // Log user creation
      await dbService.createAuditLog({
        action: 'user.created',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        metadata: { source: 'keycloak_oauth_callback' }
      })
    } else {
      await dbService.updateUserLastLogin(user.id)
    }
    
    // Log successful login
    await dbService.createAuditLog({
      action: 'user.login',
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress: c.req.header('CF-Connecting-IP'),
      userAgent: c.req.header('User-Agent'),
      metadata: {
        login_method: 'keycloak_oauth',
        token_expires_in: tokens.expires_in
      }
    })
    
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          roles: user.roles,
          tenantId: user.tenantId,
          keycloakUserId: user.keycloakUserId
        },
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in
        }
      },
      message: 'Login successful'
    })
  } catch (error) {
    console.error('OAuth callback failed:', error)
    return c.json({
      success: false,
      error: 'Authentication failed',
      details: c.env.DEBUG ? error.message : undefined
    }, 400)
  }
})

// Get current user (with JWT validation)
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const tenant = c.get('tenant')
  
  const response: ApiResponse<any> = {
    success: true,
    data: {
      ...user,
      tenant: tenant
    }
  }
  return c.json(response)
})

// Logout endpoint
authRoutes.post('/logout', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  const refreshToken = c.req.header('X-Refresh-Token')
  
  try {
    const keycloakService = new KeycloakService(c.env)
    const dbService = new DatabaseService(c.env)
    
    // Logout from Keycloak if refresh token provided
    if (refreshToken) {
      await keycloakService.logout(refreshToken)
    }
    
    // Log logout event
    if (user) {
      await dbService.createAuditLog({
        action: 'user.logout',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: c.req.header('CF-Connecting-IP'),
        userAgent: c.req.header('User-Agent'),
        metadata: { logout_method: 'api_endpoint' }
      })
    }
    
    const keycloakLogoutUrl = keycloakService.getLogoutUrl(
      c.req.query('redirect_uri') || `${c.req.url.split('/api')[0]}`
    )
    
    return c.json({
      success: true,
      message: 'Logout successful',
      data: {
        keycloak_logout_url: keycloakLogoutUrl
      }
    })
  } catch (error) {
    console.error('Logout failed:', error)
    return c.json({
      success: false,
      error: 'Logout failed',
      details: c.env.DEBUG ? error.message : undefined
    }, 500)
  }
})

// Refresh token endpoint
authRoutes.post('/refresh', async (c) => {
  const body = await c.req.json()
  const { refresh_token } = body
  
  if (!refresh_token) {
    return c.json({
      success: false,
      error: 'Refresh token required'
    }, 400)
  }
  
  try {
    const keycloakService = new KeycloakService(c.env)
    const tokens = await keycloakService.refreshToken(refresh_token)
    
    return c.json({
      success: true,
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in
      }
    })
  } catch (error) {
    console.error('Token refresh failed:', error)
    return c.json({
      success: false,
      error: 'Token refresh failed',
      details: c.env.DEBUG ? error.message : undefined
    }, 401)
  }
})

// Password reset request
authRoutes.post('/password-reset', async (c) => {
  const body = await c.req.json()
  const { email } = body
  
  // Mock password reset logic
  const response: ApiResponse = {
    success: true,
    message: `Password reset instructions sent to ${email}`
  }
  return c.json(response)
})

// Verify email endpoint
authRoutes.post('/verify-email', async (c) => {
  const body = await c.req.json()
  const { token } = body
  
  const response: ApiResponse = {
    success: true,
    message: 'Email verified successfully'
  }
  return c.json(response)
})

export { authRoutes }