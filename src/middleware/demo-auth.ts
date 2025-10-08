// Demo Authentication Middleware - Bypasses real auth for development
import { createMiddleware } from 'hono/factory';

export const demoAuthMiddleware = createMiddleware(async (c, next) => {
  // Demo mode: Create a mock user
  const demoUser = {
    id: 'demo-user-123',
    keycloakUserId: 'demo-keycloak-123',
    tenantId: 'demo-tenant-abc',
    email: 'admin@demo.com',
    name: 'Demo Admin',
    roles: ['super_admin', 'tenant_owner', 'admin'],
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };

  // Mock tenant
  const demoTenant = {
    id: 'demo-tenant-abc',
    name: 'Demo Corporation',
    domain: 'demo.com',
    isActive: true,
    plan: 'enterprise',
    limits: {
      users: 1000,
      apiCalls: 100000,
      storage: 100
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  };

  // Set user and tenant in context
  c.set('user', demoUser);
  c.set('tenant', demoTenant);

  await next();
});