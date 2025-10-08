// Authentication Middleware for Platform Gateway
import { createMiddleware } from 'hono/factory';
import { HonoEnv } from '../types/env';
import { KeycloakService } from '../services/keycloak';
import { DatabaseService } from '../services/database';

/**
 * Authentication middleware that validates JWT tokens from Keycloak
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const keycloakService = new KeycloakService(c.env);
    const dbService = new DatabaseService(c.env);
    
    // Verify JWT with Keycloak
    const jwtPayload = await keycloakService.verifyToken(token);
    
    // Get user from database or create if doesn't exist
    let user = await dbService.getUserByKeycloakId(jwtPayload.sub);
    
    if (!user) {
      // Create user if it doesn't exist (first login)
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      user = await dbService.createUser({
        id: userId,
        keycloakUserId: jwtPayload.sub,
        tenantId: jwtPayload.tenant_id,
        email: jwtPayload.email,
        name: jwtPayload.name,
        roles: keycloakService.extractRoles ? keycloakService.extractRoles(jwtPayload) : [],
      });
      
      // Log user creation
      await dbService.createAuditLog({
        action: 'user.created',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        userAgent: c.req.header('User-Agent'),
        metadata: { source: 'keycloak_first_login' },
      });
    } else {
      // Update last login time
      await dbService.updateUserLastLogin(user.id);
    }
    
    // Convert to AuthenticatedUser format
    const authenticatedUser = keycloakService.convertToAuthenticatedUser(
      { email: jwtPayload.email, name: jwtPayload.name },
      jwtPayload,
      user
    );
    
    // Store user in context
    c.set('user', authenticatedUser);
    
    // Log successful login
    await dbService.createAuditLog({
      action: 'user.login',
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      ipAddress: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      userAgent: c.req.header('User-Agent'),
      metadata: { 
        login_method: 'keycloak_jwt',
        token_iat: jwtPayload.iat,
        token_exp: jwtPayload.exp 
      },
    });
    
    await next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return c.json({ 
      success: false, 
      error: 'Authentication failed',
      details: c.env.DEBUG ? error.message : undefined
    }, 401);
  }
});

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const keycloakService = new KeycloakService(c.env);
      const dbService = new DatabaseService(c.env);
      
      const jwtPayload = await keycloakService.verifyToken(token);
      const user = await dbService.getUserByKeycloakId(jwtPayload.sub);
      
      if (user) {
        const authenticatedUser = keycloakService.convertToAuthenticatedUser(
          { email: jwtPayload.email, name: jwtPayload.name },
          jwtPayload,
          user
        );
        c.set('user', authenticatedUser);
      }
    } catch (error) {
      // Silently ignore auth errors in optional middleware
      console.warn('Optional auth failed:', error.message);
    }
  }
  
  await next();
});

/**
 * Tenant resolution middleware - resolves tenant from user or request params
 */
export const tenantMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get('user');
  const dbService = new DatabaseService(c.env);
  
  let tenantId: string | undefined;
  
  // Try to get tenant ID from various sources
  tenantId = c.req.param('tenantId') || 
             c.req.query('tenantId') || 
             user?.tenantId;
  
  if (tenantId) {
    try {
      const tenant = await dbService.getTenantById(tenantId);
      
      if (tenant) {
        // Verify user has access to this tenant
        if (user) {
          const keycloakService = new KeycloakService(c.env);
          const hasAccess = await keycloakService.validateTenantAccess(user, tenantId);
          
          if (!hasAccess) {
            return c.json({ 
              success: false, 
              error: 'Access denied to tenant',
              tenantId 
            }, 403);
          }
        }
        
        c.set('tenant', tenant);
      } else {
        return c.json({ 
          success: false, 
          error: 'Tenant not found',
          tenantId 
        }, 404);
      }
    } catch (error) {
      console.error('Tenant resolution failed:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to resolve tenant' 
      }, 500);
    }
  }
  
  await next();
});

/**
 * Role-based access control middleware
 */
export const requireRole = (...requiredRoles: string[]) => {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: 'Authentication required' 
      }, 401);
    }
    
    const keycloakService = new KeycloakService(c.env);
    
    if (!keycloakService.hasAnyRole(user, requiredRoles)) {
      return c.json({ 
        success: false, 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: user.roles 
      }, 403);
    }
    
    await next();
  });
};

/**
 * Tenant owner or admin access middleware
 */
export const requireTenantAccess = createMiddleware<HonoEnv>(async (c, next) => {
  const user = c.get('user');
  const tenant = c.get('tenant');
  
  if (!user) {
    return c.json({ 
      success: false, 
      error: 'Authentication required' 
    }, 401);
  }
  
  if (!tenant) {
    return c.json({ 
      success: false, 
      error: 'Tenant context required' 
    }, 400);
  }
  
  const keycloakService = new KeycloakService(c.env);
  
  // Platform admins can access any tenant
  if (keycloakService.hasAnyRole(user, ['platform_admin', 'super_admin'])) {
    await next();
    return;
  }
  
  // Tenant owners can access their own tenant
  if (user.tenantId === tenant.id && keycloakService.hasRole(user, 'tenant_owner')) {
    await next();
    return;
  }
  
  // Managers can access their tenant with limited permissions
  if (user.tenantId === tenant.id && keycloakService.hasRole(user, 'manager')) {
    await next();
    return;
  }
  
  return c.json({ 
    success: false, 
    error: 'Access denied to tenant operations' 
  }, 403);
});

/**
 * API key authentication middleware
 */
export const apiKeyAuthMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const apiKey = c.req.header('X-API-Key') || c.req.query('api_key');
  
  if (!apiKey) {
    return c.json({ 
      success: false, 
      error: 'API key required' 
    }, 401);
  }
  
  try {
    const dbService = new DatabaseService(c.env);
    
    // Hash the provided API key (in real implementation)
    const keyHash = await crypto.subtle.digest(
      'SHA-256', 
      new TextEncoder().encode(apiKey)
    ).then(buffer => 
      Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );
    
    const keyRecord = await dbService.getApiKeyByHash(keyHash);
    
    if (!keyRecord || !keyRecord.isActive) {
      return c.json({ 
        success: false, 
        error: 'Invalid or inactive API key' 
      }, 401);
    }
    
    // Check expiration
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return c.json({ 
        success: false, 
        error: 'API key expired' 
      }, 401);
    }
    
    // Update last used timestamp (async, don't wait)
    dbService.db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), keyRecord.id)
      .run()
      .catch(err => console.error('Failed to update API key last_used_at:', err));
    
    // Set API key context (could be used for rate limiting, etc.)
    c.set('apiKey', keyRecord);
    
    await next();
  } catch (error) {
    console.error('API key authentication failed:', error);
    return c.json({ 
      success: false, 
      error: 'API key validation failed' 
    }, 401);
  }
});