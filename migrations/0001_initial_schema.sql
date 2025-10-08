-- Platform Gateway Database Schema v1.0
-- Multi-tenant Platform Management System

-- Tenants table - Core tenant organizations
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
  
  -- Keycloak integration
  keycloak_realm TEXT,
  
  -- Stripe integration  
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  
  -- Billing information
  billing_email TEXT,
  billing_address TEXT,
  billing_country TEXT DEFAULT 'US',
  monthly_price REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  next_billing_date TEXT,
  
  -- Usage limits
  max_users INTEGER DEFAULT 10,
  max_api_calls_per_month INTEGER DEFAULT 10000,
  max_storage_gb REAL DEFAULT 1.0,
  
  -- Settings
  settings TEXT DEFAULT '{}', -- JSON configuration
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users table - Platform users across all tenants
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  
  -- Keycloak integration
  keycloak_user_id TEXT UNIQUE,
  
  -- Basic information
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  
  -- Status and permissions
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  roles TEXT NOT NULL DEFAULT '["user"]', -- JSON array of roles
  
  -- Authentication
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Activity tracking
  last_login_at TEXT,
  login_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- User sessions table - Track active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  
  -- Session data
  token_hash TEXT NOT NULL, -- Hashed JWT token
  refresh_token_hash TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_activity_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- API Keys table - For programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  
  -- Key information
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 characters for identification
  
  -- Permissions and limits
  permissions TEXT NOT NULL DEFAULT '["read"]', -- JSON array
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Usage tracking
  last_used_at TEXT,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT, -- NULL for no expiration
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment methods table - Stripe payment methods for tenants
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY, -- Stripe payment method ID
  tenant_id TEXT NOT NULL,
  
  -- Payment method details
  type TEXT NOT NULL DEFAULT 'card',
  brand TEXT,
  last4 TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  
  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Invoices table - Billing invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, -- Stripe invoice ID
  tenant_id TEXT NOT NULL,
  
  -- Invoice details
  number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  
  -- Amounts (in cents)
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Dates
  created_date TEXT NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  
  -- Stripe data
  stripe_data TEXT, -- JSON metadata from Stripe
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Usage records table - Track resource usage for billing
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  
  -- Usage period
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  
  -- Usage metrics
  api_calls INTEGER DEFAULT 0,
  storage_gb REAL DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  
  -- Additional metrics (JSON format for flexibility)
  custom_metrics TEXT DEFAULT '{}',
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Audit logs table - Security and activity logging
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  
  -- Event details
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  
  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Additional data
  metadata TEXT DEFAULT '{}', -- JSON metadata
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Invitations table - User invitations to tenants
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  
  -- Invitation details
  email TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT '["user"]', -- JSON array
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  -- Security
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  
  -- Acceptance
  accepted_at TEXT,
  accepted_by TEXT, -- user_id who accepted
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Webhooks table - Incoming and outgoing webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  
  -- Webhook configuration
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  
  -- Events to listen for
  events TEXT NOT NULL DEFAULT '[]', -- JSON array of event types
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_success_at TEXT,
  last_failure_at TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for better query performance

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer ON tenants(stripe_customer_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_user_id ON users(keycloak_user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_date ON invoices(created_date);

-- Usage records indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_tenant_id ON usage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(period_start, period_end);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);