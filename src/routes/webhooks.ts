// Webhook Routes for Platform Gateway
import { Hono } from 'hono';
import { HonoEnv } from '../types/env';
import { StripeConnectService } from '../services/stripe';
import { DatabaseService } from '../services/database';

const webhookRoutes = new Hono<HonoEnv>();

/**
 * Stripe webhook handler
 */
webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  try {
    // Get raw body for webhook verification
    const payload = await c.req.text();
    
    const stripeService = new StripeConnectService(c.env);
    const dbService = new DatabaseService(c.env);
    
    // Process webhook
    const result = await stripeService.processWebhook(payload, signature, dbService);
    
    // Log webhook processing
    await dbService.createAuditLog({
      action: 'webhook.received',
      resource: 'webhook',
      resourceId: result.event?.id || 'unknown',
      metadata: {
        source: 'stripe',
        event_type: result.event?.type,
        processed: result.processed,
        webhook_id: result.event?.id,
      },
    });

    return c.json({ 
      success: true, 
      processed: result.processed,
      event_type: result.event?.type,
      event_id: result.event?.id
    });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    
    // Log webhook failure
    try {
      const dbService = new DatabaseService(c.env);
      await dbService.createAuditLog({
        action: 'webhook.failed',
        resource: 'webhook',
        metadata: {
          source: 'stripe',
          error: error.message,
          signature_present: !!signature,
        },
      });
    } catch (logError) {
      console.error('Failed to log webhook failure:', logError);
    }

    return c.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, 400);
  }
});

/**
 * Keycloak webhook handler (for user events)
 */
webhookRoutes.post('/keycloak', async (c) => {
  try {
    const event = await c.req.json();
    const dbService = new DatabaseService(c.env);
    
    console.log('Keycloak webhook event:', event);
    
    // Process different Keycloak events
    switch (event.type) {
      case 'USER_REGISTER':
        await handleUserRegister(event, dbService);
        break;
      
      case 'USER_UPDATE':
        await handleUserUpdate(event, dbService);
        break;
      
      case 'USER_DELETE':
        await handleUserDelete(event, dbService);
        break;
      
      case 'LOGIN':
        await handleUserLogin(event, dbService);
        break;
      
      case 'LOGOUT':
        await handleUserLogout(event, dbService);
        break;
      
      default:
        console.log(`Unhandled Keycloak event: ${event.type}`);
    }
    
    // Log webhook processing
    await dbService.createAuditLog({
      action: 'webhook.received',
      resource: 'webhook',
      resourceId: event.id || 'unknown',
      metadata: {
        source: 'keycloak',
        event_type: event.type,
        user_id: event.userId,
        realm: event.realmId,
      },
    });

    return c.json({ 
      success: true, 
      event_type: event.type,
      processed: true 
    });
  } catch (error) {
    console.error('Keycloak webhook processing failed:', error);
    
    return c.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, 400);
  }
});

/**
 * Generic webhook handler for tenant-specific webhooks
 */
webhookRoutes.post('/tenant/:tenantId', async (c) => {
  const tenantId = c.req.param('tenantId');
  
  try {
    const payload = await c.req.json();
    const dbService = new DatabaseService(c.env);
    
    // Verify tenant exists
    const tenant = await dbService.getTenantById(tenantId);
    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }
    
    // Log incoming webhook
    await dbService.createAuditLog({
      action: 'webhook.received',
      resource: 'webhook',
      tenantId: tenantId,
      metadata: {
        source: 'tenant_webhook',
        payload: payload,
        headers: Object.fromEntries(c.req.raw.headers.entries()),
      },
    });
    
    // Here you would forward to tenant-specific webhook handlers
    // or process based on tenant configuration
    
    return c.json({ 
      success: true, 
      tenantId: tenantId,
      received_at: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Tenant webhook processing failed:', error);
    
    return c.json({ 
      success: false, 
      error: 'Webhook processing failed' 
    }, 400);
  }
});

// Keycloak event handlers
async function handleUserRegister(event: any, dbService: DatabaseService): Promise<void> {
  try {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create user record in our database
    await dbService.createUser({
      id: userId,
      keycloakUserId: event.userId,
      tenantId: event.details?.tenant_id,
      email: event.details?.email || '',
      name: event.details?.username || '',
      roles: ['user'], // Default role
    });
    
    console.log(`User registered: ${event.userId} -> ${userId}`);
  } catch (error) {
    console.error('Failed to handle user register event:', error);
  }
}

async function handleUserUpdate(event: any, dbService: DatabaseService): Promise<void> {
  try {
    const user = await dbService.getUserByKeycloakId(event.userId);
    if (user) {
      await dbService.updateUser(user.id, {
        email: event.details?.email || user.email,
        name: event.details?.username || user.name,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`User updated: ${event.userId}`);
    }
  } catch (error) {
    console.error('Failed to handle user update event:', error);
  }
}

async function handleUserDelete(event: any, dbService: DatabaseService): Promise<void> {
  try {
    const user = await dbService.getUserByKeycloakId(event.userId);
    if (user) {
      // Mark user as inactive instead of deleting
      await dbService.updateUser(user.id, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`User deactivated: ${event.userId}`);
    }
  } catch (error) {
    console.error('Failed to handle user delete event:', error);
  }
}

async function handleUserLogin(event: any, dbService: DatabaseService): Promise<void> {
  try {
    const user = await dbService.getUserByKeycloakId(event.userId);
    if (user) {
      await dbService.updateUserLastLogin(user.id);
      
      // Create audit log
      await dbService.createAuditLog({
        action: 'user.login',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: event.details?.ip,
        userAgent: event.details?.user_agent,
        metadata: {
          source: 'keycloak_webhook',
          session_id: event.details?.session_id,
        },
      });
    }
  } catch (error) {
    console.error('Failed to handle user login event:', error);
  }
}

async function handleUserLogout(event: any, dbService: DatabaseService): Promise<void> {
  try {
    const user = await dbService.getUserByKeycloakId(event.userId);
    if (user) {
      // Create audit log
      await dbService.createAuditLog({
        action: 'user.logout',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        tenantId: user.tenantId,
        metadata: {
          source: 'keycloak_webhook',
          session_id: event.details?.session_id,
        },
      });
    }
  } catch (error) {
    console.error('Failed to handle user logout event:', error);
  }
}

export { webhookRoutes };