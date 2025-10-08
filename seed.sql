-- Platform Gateway Seed Data
-- Demo data for testing and development

-- Insert demo tenants
INSERT OR IGNORE INTO tenants (
  id, name, domain, status, plan, 
  billing_email, billing_country, monthly_price, currency,
  max_users, max_api_calls_per_month, max_storage_gb,
  created_at, updated_at
) VALUES 
  (
    'tenant-abc-corp', 
    'ABC Corporation', 
    'abc-corp.com', 
    'active', 
    'enterprise',
    'billing@abc-corp.com',
    'US',
    299.00,
    'USD',
    100,
    1000000,
    50.0,
    '2025-09-01T10:00:00Z',
    '2025-09-01T10:00:00Z'
  ),
  (
    'tenant-xyz-inc', 
    'XYZ Inc', 
    'xyz-inc.com', 
    'active', 
    'professional',
    'finance@xyz-inc.com',
    'US',
    99.00,
    'USD',
    25,
    100000,
    10.0,
    '2025-09-15T14:30:00Z',
    '2025-09-15T14:30:00Z'
  ),
  (
    'tenant-demo-company', 
    'Demo Company', 
    'demo.com', 
    'trial', 
    'starter',
    'demo@demo.com',
    'US',
    0.00,
    'USD',
    5,
    10000,
    1.0,
    '2025-10-01T09:00:00Z',
    '2025-10-01T09:00:00Z'
  );

-- Insert demo users
INSERT OR IGNORE INTO users (
  id, tenant_id, keycloak_user_id, email, name, avatar, 
  status, roles, email_verified, last_login_at, login_count,
  created_at, updated_at
) VALUES 
  (
    'user-123',
    'tenant-abc-corp',
    'keycloak-user-abc-123',
    'admin@abc-corp.com',
    'John Doe',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face&auto=format',
    'active',
    '["admin", "tenant_owner"]',
    true,
    '2025-10-03T07:00:00Z',
    45,
    '2025-09-01T10:00:00Z',
    '2025-10-03T07:00:00Z'
  ),
  (
    'user-456',
    'tenant-abc-corp',
    'keycloak-user-abc-456',
    'manager@abc-corp.com',
    'Jane Smith',
    'https://images.unsplash.com/photo-1494790108755-2616b612b714?w=40&h=40&fit=crop&crop=face&auto=format',
    'active',
    '["manager"]',
    true,
    '2025-10-02T16:30:00Z',
    28,
    '2025-09-05T11:15:00Z',
    '2025-10-02T16:30:00Z'
  ),
  (
    'user-789',
    'tenant-abc-corp',
    'keycloak-user-abc-789',
    'dev@abc-corp.com',
    'Mike Johnson',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format',
    'active',
    '["developer"]',
    true,
    '2025-10-03T06:45:00Z',
    67,
    '2025-09-10T09:30:00Z',
    '2025-10-03T06:45:00Z'
  ),
  (
    'user-xyz-001',
    'tenant-xyz-inc',
    'keycloak-user-xyz-001',
    'owner@xyz-inc.com',
    'Sarah Wilson',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face&auto=format',
    'active',
    '["tenant_owner", "admin"]',
    true,
    '2025-10-01T14:20:00Z',
    12,
    '2025-09-15T14:30:00Z',
    '2025-10-01T14:20:00Z'
  ),
  (
    'user-demo-001',
    'tenant-demo-company',
    'keycloak-user-demo-001',
    'demo@demo.com',
    'Demo User',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face&auto=format',
    'active',
    '["tenant_owner"]',
    true,
    '2025-10-03T08:00:00Z',
    3,
    '2025-10-01T09:00:00Z',
    '2025-10-03T08:00:00Z'
  );

-- Insert demo API keys
INSERT OR IGNORE INTO api_keys (
  id, tenant_id, user_id, name, key_hash, key_prefix,
  permissions, rate_limit_per_hour, is_active,
  last_used_at, usage_count, created_at
) VALUES 
  (
    'api-key-001',
    'tenant-abc-corp',
    'user-123',
    'Production API Key',
    'hashed_key_production_123',
    'pk_live_',
    '["read", "write", "admin"]',
    5000,
    true,
    '2025-10-03T06:55:00Z',
    1247,
    '2025-09-01T10:00:00Z'
  ),
  (
    'api-key-002',
    'tenant-abc-corp',
    'user-789',
    'Development Key',
    'hashed_key_development_789',
    'pk_test_',
    '["read", "write"]',
    1000,
    true,
    '2025-10-03T05:30:00Z',
    856,
    '2025-09-10T09:30:00Z'
  ),
  (
    'api-key-003',
    'tenant-xyz-inc',
    'user-xyz-001',
    'Main API Key',
    'hashed_key_xyz_001',
    'pk_live_',
    '["read", "write"]',
    2000,
    true,
    '2025-10-01T12:15:00Z',
    234,
    '2025-09-15T14:30:00Z'
  );

-- Insert demo usage records (last 30 days)
INSERT OR IGNORE INTO usage_records (
  id, tenant_id, period_start, period_end,
  api_calls, storage_gb, active_users,
  created_at
) VALUES 
  -- ABC Corp usage for September 2025
  (
    'usage-abc-sep-2025',
    'tenant-abc-corp',
    '2025-09-01T00:00:00Z',
    '2025-09-30T23:59:59Z',
    125000,
    12.5,
    15,
    '2025-10-01T00:00:00Z'
  ),
  -- XYZ Inc usage for September 2025
  (
    'usage-xyz-sep-2025',
    'tenant-xyz-inc',
    '2025-09-01T00:00:00Z',
    '2025-09-30T23:59:59Z',
    34000,
    3.2,
    8,
    '2025-10-01T00:00:00Z'
  ),
  -- Demo Company usage (partial October)
  (
    'usage-demo-oct-2025',
    'tenant-demo-company',
    '2025-10-01T00:00:00Z',
    '2025-10-31T23:59:59Z',
    150,
    0.1,
    1,
    '2025-10-03T00:00:00Z'
  );

-- Insert demo audit logs (recent activity)
INSERT OR IGNORE INTO audit_logs (
  id, tenant_id, user_id, action, resource, resource_id,
  ip_address, user_agent, metadata, created_at
) VALUES 
  (
    'log-001',
    'tenant-abc-corp',
    'user-123',
    'user.login',
    'user',
    'user-123',
    '192.168.1.100',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    '{"login_method": "keycloak_oauth", "success": true}',
    '2025-10-03T07:00:00Z'
  ),
  (
    'log-002',
    'tenant-abc-corp',
    'user-456',
    'api_key.created',
    'api_key',
    'api-key-new-001',
    '10.0.1.50',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    '{"key_name": "Mobile App Key", "permissions": ["read"]}',
    '2025-10-02T15:30:00Z'
  ),
  (
    'log-003',
    'tenant-xyz-inc',
    'user-xyz-001',
    'invoice.paid',
    'invoice',
    'inv_xyz_september_2025',
    '203.45.67.89',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    '{"invoice_amount": 99.00, "payment_method": "card_****4242"}',
    '2025-10-01T14:20:00Z'
  ),
  (
    'log-004',
    'tenant-demo-company',
    'user-demo-001',
    'tenant.created',
    'tenant',
    'tenant-demo-company',
    '172.16.0.10',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    '{"plan": "starter", "trial_days": 14}',
    '2025-10-01T09:00:00Z'
  ),
  (
    'log-005',
    'tenant-abc-corp',
    'user-789',
    'api.call',
    'api_endpoint',
    '/api/users',
    '192.168.1.101',
    'curl/7.68.0',
    '{"method": "GET", "response_time_ms": 95, "status_code": 200}',
    '2025-10-03T06:45:00Z'
  );

-- Insert demo invitations
INSERT OR IGNORE INTO invitations (
  id, tenant_id, invited_by, email, roles,
  status, token, expires_at, created_at
) VALUES 
  (
    'invite-001',
    'tenant-abc-corp',
    'user-123',
    'newdev@abc-corp.com',
    '["developer"]',
    'pending',
    'invite_token_abc_newdev_123',
    '2025-10-10T10:00:00Z',
    '2025-10-03T10:00:00Z'
  ),
  (
    'invite-002',
    'tenant-xyz-inc',
    'user-xyz-001',
    'support@xyz-inc.com',
    '["support"]',
    'pending',
    'invite_token_xyz_support_456',
    '2025-10-08T14:30:00Z',
    '2025-10-01T14:30:00Z'
  );

-- Insert demo webhooks
INSERT OR IGNORE INTO webhooks (
  id, tenant_id, name, url, secret, events,
  is_active, success_count, failure_count,
  last_success_at, created_at, updated_at
) VALUES 
  (
    'webhook-001',
    'tenant-abc-corp',
    'Payment Notifications',
    'https://api.abc-corp.com/webhooks/payments',
    'webhook_secret_abc_payments_123',
    '["payment.succeeded", "payment.failed", "invoice.created"]',
    true,
    127,
    3,
    '2025-10-03T06:30:00Z',
    '2025-09-01T10:00:00Z',
    '2025-10-03T06:30:00Z'
  ),
  (
    'webhook-002',
    'tenant-xyz-inc',
    'User Events',
    'https://hooks.xyz-inc.com/users',
    'webhook_secret_xyz_users_456',
    '["user.created", "user.updated", "user.deleted"]',
    true,
    45,
    1,
    '2025-10-01T12:00:00Z',
    '2025-09-15T14:30:00Z',
    '2025-10-01T12:00:00Z'
  );