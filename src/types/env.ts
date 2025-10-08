// Environment and Cloudflare bindings type definitions

export interface CloudflareBindings {
  // D1 Database
  DB: D1Database;
  
  // KV Namespace for caching
  CACHE: KVNamespace;
  
  // Environment variables
  ENVIRONMENT: string;
  API_BASE_URL: string;
  AUTH_PROVIDER: string;
  
  // Keycloak Configuration
  KEYCLOAK_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  JWT_ISSUER: string;
  JWT_SECRET: string;
  JWT_EXPIRATION_MINUTES: string;
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PLATFORM_ACCOUNT_ID: string;
  
  // Security
  DATABASE_ENCRYPTION_KEY: string;
  BCRYPT_ROUNDS: string;
  API_RATE_LIMIT_PER_MINUTE: string;
  
  // Development
  DEBUG?: string;
  LOG_LEVEL?: string;
}

export interface HonoEnv {
  Bindings: CloudflareBindings;
  Variables: {
    user?: AuthenticatedUser;
    tenant?: TenantContext;
    requestId: string;
    startTime: number;
  };
}

export interface AuthenticatedUser {
  id: string;
  keycloakUserId: string;
  tenantId?: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  isActive: boolean;
  lastLoginAt?: string;
}

export interface TenantContext {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'pending' | 'cancelled';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  keycloakRealmId?: string;
  stripeAccountId?: string;
  limits: TenantLimits;
}

export interface TenantLimits {
  users: number;
  apiCallsMonthly: number;
  storageGb: number;
  requestsPerMinute: number;
  customDomains: number;
  ssoConnections: number;
}

export interface JWTPayload {
  sub: string; // Keycloak user ID
  iss: string; // JWT issuer
  aud: string | string[]; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at
  jti: string; // JWT ID
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  tenant_id?: string;
  tenant_name?: string;
  realm_access: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}