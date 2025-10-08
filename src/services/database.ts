// Database Service for Platform Gateway
import { HonoEnv, AuthenticatedUser, TenantContext } from '../types/env';
import { Tenant, User, ApiKey, UsageRecord, PaymentMethod, Invoice, AuditLog } from '../types';

export class DatabaseService {
  private db: D1Database;

  constructor(env: HonoEnv['Bindings']) {
    this.db = env.DB;
  }

  // User operations
  async getUserByKeycloakId(keycloakUserId: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE keycloak_user_id = ?')
      .bind(keycloakUserId)
      .first();

    return result ? this.mapRowToUser(result) : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapRowToUser(result) : null;
  }

  async createUser(userData: {
    id: string;
    keycloakUserId: string;
    tenantId?: string;
    email: string;
    name: string;
    avatar?: string;
    roles: string[];
  }): Promise<User> {
    const user = {
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db
      .prepare(`
        INSERT INTO users (
          id, keycloak_user_id, tenant_id, email, name, avatar, roles, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        user.id,
        user.keycloakUserId,
        user.tenantId || null,
        user.email,
        user.name,
        user.avatar || null,
        JSON.stringify(user.roles),
        user.isActive,
        user.createdAt,
        user.updatedAt
      )
      .run();

    return this.mapRowToUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const setClause = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'roles') {
        setClause.push('roles = ?');
        values.push(JSON.stringify(value));
      } else if (key !== 'id' && key !== 'createdAt') {
        setClause.push(`${this.camelToSnake(key)} = ?`);
        values.push(value);
      }
    }

    if (setClause.length > 0) {
      setClause.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db
        .prepare(`UPDATE users SET ${setClause.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await this.db
      .prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), new Date().toISOString(), id)
      .run();
  }

  // Tenant operations
  async getTenantById(id: string): Promise<TenantContext | null> {
    const result = await this.db
      .prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapRowToTenant(result) : null;
  }

  async getTenantByDomain(domain: string): Promise<TenantContext | null> {
    const result = await this.db
      .prepare('SELECT * FROM tenants WHERE domain = ? OR subdomain = ?')
      .bind(domain, domain)
      .first();

    return result ? this.mapRowToTenant(result) : null;
  }

  async getTenantsByStatus(status: string): Promise<TenantContext[]> {
    const results = await this.db
      .prepare('SELECT * FROM tenants WHERE status = ? ORDER BY created_at DESC')
      .bind(status)
      .all();

    return results.results.map(row => this.mapRowToTenant(row));
  }

  async getAllTenants(limit = 50, offset = 0): Promise<{ tenants: TenantContext[]; total: number }> {
    const [tenantsResult, countResult] = await Promise.all([
      this.db
        .prepare('SELECT * FROM tenants ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .bind(limit, offset)
        .all(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM tenants')
        .first()
    ]);

    return {
      tenants: tenantsResult.results.map(row => this.mapRowToTenant(row)),
      total: countResult?.count as number || 0,
    };
  }

  // Usage tracking
  async recordUsage(record: {
    tenantId: string;
    userId?: string;
    resourceType: string;
    amount: number;
    metadata?: any;
  }): Promise<void> {
    const id = `usage-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await this.db
      .prepare(`
        INSERT INTO usage_records (id, tenant_id, user_id, resource_type, amount, metadata, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        record.tenantId,
        record.userId || null,
        record.resourceType,
        record.amount,
        record.metadata ? JSON.stringify(record.metadata) : null,
        new Date().toISOString()
      )
      .run();
  }

  async getTenantUsage(
    tenantId: string, 
    resourceType?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<UsageRecord[]> {
    let query = 'SELECT * FROM usage_records WHERE tenant_id = ?';
    const bindings = [tenantId];

    if (resourceType) {
      query += ' AND resource_type = ?';
      bindings.push(resourceType);
    }

    if (startDate) {
      query += ' AND recorded_at >= ?';
      bindings.push(startDate);
    }

    if (endDate) {
      query += ' AND recorded_at <= ?';
      bindings.push(endDate);
    }

    query += ' ORDER BY recorded_at DESC';

    const result = await this.db
      .prepare(query)
      .bind(...bindings)
      .all();

    return result.results.map(row => this.mapRowToUsageRecord(row));
  }

  // API Keys
  async createApiKey(keyData: {
    id: string;
    tenantId: string;
    name: string;
    keyHash: string;
    permissions: string[];
    createdBy: string;
    expiresAt?: string;
  }): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO api_keys (
          id, tenant_id, name, key_hash, permissions, created_by, expires_at, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        keyData.id,
        keyData.tenantId,
        keyData.name,
        keyData.keyHash,
        JSON.stringify(keyData.permissions),
        keyData.createdBy,
        keyData.expiresAt || null,
        true,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const result = await this.db
      .prepare('SELECT * FROM api_keys WHERE key_hash = ? AND is_active = true')
      .bind(keyHash)
      .first();

    return result ? this.mapRowToApiKey(result) : null;
  }

  // Audit logging
  async createAuditLog(logData: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<void> {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await this.db
      .prepare(`
        INSERT INTO audit_logs (
          id, action, resource, resource_id, user_id, tenant_id, ip_address, user_agent, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        logData.action,
        logData.resource,
        logData.resourceId || null,
        logData.userId || null,
        logData.tenantId || null,
        logData.ipAddress || null,
        logData.userAgent || null,
        logData.metadata ? JSON.stringify(logData.metadata) : null,
        new Date().toISOString()
      )
      .run();
  }

  // Helper methods for mapping database rows to objects
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      roles: typeof row.roles === 'string' ? JSON.parse(row.roles) : row.roles,
      tenantId: row.tenant_id,
      tenantName: null, // Will be populated by join if needed
      isActive: Boolean(row.is_active),
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToTenant(row: any): TenantContext {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      subdomain: row.subdomain,
      status: row.status,
      plan: row.plan,
      keycloakRealmId: row.keycloak_realm_id,
      stripeAccountId: row.stripe_account_id,
      limits: {
        users: row.limits_users,
        apiCallsMonthly: row.limits_api_calls_monthly,
        storageGb: row.limits_storage_gb,
        requestsPerMinute: row.limits_requests_per_minute,
        customDomains: row.limits_custom_domains,
        ssoConnections: row.limits_sso_connections,
      },
    };
  }

  private mapRowToUsageRecord(row: any): UsageRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      resourceType: row.resource_type,
      amount: row.amount,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      recordedAt: row.recorded_at,
    };
  }

  private mapRowToApiKey(row: any): ApiKey {
    return {
      id: row.id,
      name: row.name,
      key: '***masked***', // Never return the actual key
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
    };
  }

  // Additional methods needed for dashboard and routes

  // User management methods
  async getUser(id: string): Promise<User | null> {
    return this.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    return result ? this.mapRowToUser(result) : null;
  }

  async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    tenantId?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 10, search, tenantId, role, isActive } = options;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let bindings = [];

    if (search) {
      whereClause.push('(name LIKE ? OR email LIKE ?)');
      bindings.push(`%${search}%`, `%${search}%`);
    }

    if (tenantId) {
      whereClause.push('tenant_id = ?');
      bindings.push(tenantId);
    }

    if (role) {
      whereClause.push('roles LIKE ?');
      bindings.push(`%"${role}"%`);
    }

    if (isActive !== undefined) {
      whereClause.push('is_active = ?');
      bindings.push(isActive ? 1 : 0);
    }

    const whereQuery = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      this.db
        .prepare(`SELECT * FROM users ${whereQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...bindings, limit, offset)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM users ${whereQuery}`)
        .bind(...bindings)
        .first()
    ]);

    return {
      data: dataResult.results.map(row => this.mapRowToUser(row)),
      total: countResult?.count as number || 0
    };
  }

  async getUserCount(tenantId?: string): Promise<number> {
    if (tenantId) {
      const result = await this.db
        .prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?')
        .bind(tenantId)
        .first();
      return result?.count as number || 0;
    } else {
      const result = await this.db
        .prepare('SELECT COUNT(*) as count FROM users')
        .first();
      return result?.count as number || 0;
    }
  }

  async getTotalUserCount(): Promise<number> {
    return this.getUserCount();
  }

  async getTenantUserStats(tenantId: string): Promise<{ total: number; active: number }> {
    const [totalResult, activeResult] = await Promise.all([
      this.db
        .prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?')
        .bind(tenantId)
        .first(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND is_active = 1')
        .bind(tenantId)
        .first()
    ]);

    return {
      total: totalResult?.count as number || 0,
      active: activeResult?.count as number || 0
    };
  }

  // Tenant management methods
  async getTenant(id: string): Promise<Tenant | null> {
    const result = await this.db
      .prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapRowToFullTenant(result) : null;
  }

  async getTenants(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  }): Promise<{ data: Tenant[]; total: number }> {
    const { page = 1, limit = 10, search, status, plan } = options;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let bindings = [];

    if (search) {
      whereClause.push('(name LIKE ? OR domain LIKE ?)');
      bindings.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause.push('status = ?');
      bindings.push(status);
    }

    if (plan) {
      whereClause.push('plan = ?');
      bindings.push(plan);
    }

    const whereQuery = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      this.db
        .prepare(`SELECT * FROM tenants ${whereQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(...bindings, limit, offset)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM tenants ${whereQuery}`)
        .bind(...bindings)
        .first()
    ]);

    return {
      data: dataResult.results.map(row => this.mapRowToFullTenant(row)),
      total: countResult?.count as number || 0
    };
  }

  async createTenant(tenantData: {
    id: string;
    name: string;
    domain: string;
    subdomain: string;
    status: string;
    plan: string;
    ownerEmail: string;
    ownerName: string;
  }): Promise<Tenant> {
    const tenant = {
      ...tenantData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.db
      .prepare(`
        INSERT INTO tenants (
          id, name, domain, subdomain, status, plan, owner_email, owner_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        tenant.id,
        tenant.name,
        tenant.domain,
        tenant.subdomain,
        tenant.status,
        tenant.plan,
        tenant.ownerEmail,
        tenant.ownerName,
        tenant.createdAt,
        tenant.updatedAt
      )
      .run();

    return this.mapRowToFullTenant(tenant);
  }

  async updateTenant(id: string, updates: Partial<any>): Promise<Tenant> {
    const setClause = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdAt') {
        setClause.push(`${this.camelToSnake(key)} = ?`);
        values.push(value);
      }
    }

    if (setClause.length > 0) {
      setClause.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db
        .prepare(`UPDATE tenants SET ${setClause.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const updatedTenant = await this.getTenant(id);
    if (!updatedTenant) {
      throw new Error('Failed to retrieve updated tenant');
    }
    
    return updatedTenant;
  }

  // Usage and metrics methods
  async getUsageRecords(tenantId?: string, options?: {
    startDate?: string;
    endDate?: string;
    resourceType?: string;
  }): Promise<any[]> {
    let query = 'SELECT * FROM usage_records';
    const bindings = [];
    const whereClause = [];

    if (tenantId) {
      whereClause.push('tenant_id = ?');
      bindings.push(tenantId);
    }

    if (options?.startDate) {
      whereClause.push('recorded_at >= ?');
      bindings.push(options.startDate);
    }

    if (options?.endDate) {
      whereClause.push('recorded_at <= ?');
      bindings.push(options.endDate);
    }

    if (options?.resourceType) {
      whereClause.push('resource_type = ?');
      bindings.push(options.resourceType);
    }

    if (whereClause.length > 0) {
      query += ` WHERE ${whereClause.join(' AND ')}`;
    }

    query += ' ORDER BY recorded_at DESC';

    const result = await this.db
      .prepare(query)
      .bind(...bindings)
      .all();

    return result.results.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      resourceType: row.resource_type,
      amount: row.amount,
      apiCalls: row.resource_type === 'api_calls' ? row.amount : 0,
      storageGB: row.resource_type === 'storage' ? row.amount : 0,
      bandwidthGB: row.resource_type === 'bandwidth' ? row.amount : 0,
      timestamp: row.recorded_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }));
  }

  // Payment methods
  async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    const result = await this.db
      .prepare('SELECT * FROM payment_methods WHERE tenant_id = ? ORDER BY created_at DESC')
      .bind(tenantId)
      .all();

    return result.results.map(row => this.mapRowToPaymentMethod(row));
  }

  async createPaymentMethod(paymentMethodData: {
    id: string;
    tenantId: string;
    type: 'card' | 'bank_account';
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }): Promise<PaymentMethod> {
    await this.db
      .prepare(`
        INSERT INTO payment_methods (
          id, tenant_id, type, brand, last4, expiry_month, expiry_year, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        paymentMethodData.id,
        paymentMethodData.tenantId,
        paymentMethodData.type,
        paymentMethodData.brand,
        paymentMethodData.last4,
        paymentMethodData.expiryMonth,
        paymentMethodData.expiryYear,
        paymentMethodData.isDefault ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    return paymentMethodData;
  }

  async setDefaultPaymentMethod(tenantId: string, paymentMethodId: string): Promise<void> {
    await this.db.batch([
      this.db
        .prepare('UPDATE payment_methods SET is_default = 0 WHERE tenant_id = ?')
        .bind(tenantId),
      this.db
        .prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ? AND tenant_id = ?')
        .bind(paymentMethodId, tenantId)
    ]);
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM payment_methods WHERE id = ?')
      .bind(paymentMethodId)
      .run();
  }

  // Invoices
  async getInvoices(options: {
    tenantId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ data: Invoice[]; total: number }> {
    const { tenantId, page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let whereClause = [];
    let bindings = [];

    if (tenantId) {
      whereClause.push('tenant_id = ?');
      bindings.push(tenantId);
    }

    if (status) {
      whereClause.push('status = ?');
      bindings.push(status);
    }

    const whereQuery = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      this.db
        .prepare(`SELECT * FROM invoices ${whereQuery} ORDER BY period_start DESC LIMIT ? OFFSET ?`)
        .bind(...bindings, limit, offset)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM invoices ${whereQuery}`)
        .bind(...bindings)
        .first()
    ]);

    return {
      data: dataResult.results.map(row => this.mapRowToInvoice(row)),
      total: countResult?.count as number || 0
    };
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const result = await this.db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(id)
      .first();

    return result ? this.mapRowToInvoice(result) : null;
  }

  // Audit logs
  async getAuditLogs(options: {
    tenantId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<{ data: any[]; total: number }> {
    const { tenantId, userId, action, resource, limit = 50, orderBy = 'timestamp', orderDirection = 'desc' } = options;

    let whereClause = [];
    let bindings = [];

    if (tenantId) {
      whereClause.push('tenant_id = ?');
      bindings.push(tenantId);
    }

    if (userId) {
      whereClause.push('user_id = ?');
      bindings.push(userId);
    }

    if (action) {
      whereClause.push('action = ?');
      bindings.push(action);
    }

    if (resource) {
      whereClause.push('resource = ?');
      bindings.push(resource);
    }

    const whereQuery = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      this.db
        .prepare(`SELECT * FROM audit_logs ${whereQuery} ORDER BY ${orderBy} ${orderDirection.toUpperCase()} LIMIT ?`)
        .bind(...bindings, limit)
        .all(),
      this.db
        .prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereQuery}`)
        .bind(...bindings)
        .first()
    ]);

    return {
      data: dataResult.results.map(row => this.mapRowToAuditLog(row)),
      total: countResult?.count as number || 0
    };
  }

  // Platform statistics
  async getPlatformStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    apiCallsToday: number;
    apiCallsThisMonth: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalTenantsResult,
      activeTenantsResult,
      totalUsersResult,
      activeUsersResult,
      apiCallsTodayResult,
      apiCallsMonthResult
    ] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM tenants').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM tenants WHERE status = ?').bind('active').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM users').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
      this.db.prepare('SELECT SUM(amount) as total FROM usage_records WHERE resource_type = ? AND recorded_at >= ?')
        .bind('api_calls', today.toISOString()).first(),
      this.db.prepare('SELECT SUM(amount) as total FROM usage_records WHERE resource_type = ? AND recorded_at >= ?')
        .bind('api_calls', startOfMonth.toISOString()).first()
    ]);

    return {
      totalTenants: totalTenantsResult?.count as number || 0,
      activeTenants: activeTenantsResult?.count as number || 0,
      totalUsers: totalUsersResult?.count as number || 0,
      activeUsers: activeUsersResult?.count as number || 0,
      apiCallsToday: apiCallsTodayResult?.total as number || 0,
      apiCallsThisMonth: apiCallsMonthResult?.total as number || 0
    };
  }

  async getTotalRevenue(): Promise<{ total: number; thisMonth: number }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalResult, monthResult] = await Promise.all([
      this.db.prepare('SELECT SUM(amount) as total FROM invoices WHERE status = ?').bind('paid').first(),
      this.db.prepare('SELECT SUM(amount) as total FROM invoices WHERE status = ? AND paid_at >= ?')
        .bind('paid', startOfMonth.toISOString()).first()
    ]);

    return {
      total: totalResult?.total as number || 0,
      thisMonth: monthResult?.total as number || 0
    };
  }

  async getTopTenantsByUsage(limit: number): Promise<any[]> {
    const result = await this.db
      .prepare(`
        SELECT 
          u.tenant_id,
          t.name,
          SUM(u.amount) as usage,
          (SUM(u.amount) * 100.0 / (SELECT SUM(amount) FROM usage_records WHERE resource_type = 'api_calls')) as percentage
        FROM usage_records u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        WHERE u.resource_type = 'api_calls'
        GROUP BY u.tenant_id, t.name
        ORDER BY usage DESC
        LIMIT ?
      `)
      .bind(limit)
      .all();

    return result.results.map(row => ({
      tenantId: row.tenant_id,
      name: row.name || 'Unknown',
      usage: row.usage || 0,
      percentage: Math.round((row.percentage || 0) * 100) / 100
    }));
  }

  // Metrics methods for dashboard
  async getApiCallMetrics(tenantId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Implementation for API call metrics over time
    // This would aggregate usage_records by day/hour/month depending on the period
    return []; // TODO: Implement based on your specific needs
  }

  async getUserMetrics(tenantId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Implementation for user metrics over time
    return []; // TODO: Implement based on your specific needs
  }

  async getRevenueMetrics(tenantId?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Implementation for revenue metrics over time
    return []; // TODO: Implement based on your specific needs
  }

  async getTenantMetrics(startDate?: Date, endDate?: Date): Promise<any[]> {
    // Implementation for tenant growth metrics over time
    return []; // TODO: Implement based on your specific needs
  }

  // Database connection test
  async testConnection(): Promise<boolean> {
    try {
      await this.db.prepare('SELECT 1').first();
      return true;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Additional mapping methods
  private mapRowToFullTenant(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      subdomain: row.subdomain,
      logo: row.logo,
      status: row.status,
      plan: row.plan,
      limits: {
        users: row.limits_users || 0,
        apiCallsPerMonth: row.limits_api_calls_monthly || 0,
        storageGB: row.limits_storage_gb || 0,
        requestsPerMinute: row.limits_requests_per_minute || 0,
        customDomains: row.limits_custom_domains || 0,
        ssoConnections: row.limits_sso_connections || 0
      },
      usage: {
        users: { current: 0, limit: row.limits_users || 0 },
        apiCalls: { currentMonth: 0, limit: row.limits_api_calls_monthly || 0, trend: 0 },
        storage: { usedGB: 0, limit: row.limits_storage_gb || 0 },
        bandwidth: { currentMonthGB: 0, trend: 0 }
      },
      billing: {
        currentPlan: row.plan || 'free',
        monthlyPrice: row.monthly_price || 0,
        currency: row.currency || 'USD',
        billingCycle: row.billing_cycle || 'monthly',
        nextBillingDate: row.next_billing_date,
        invoices: []
      },
      owner: {
        id: row.owner_id || `owner-${row.id}`,
        email: row.owner_email,
        name: row.owner_name,
        roles: ['tenant_owner'],
        isActive: true,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      settings: {
        allowUserRegistration: Boolean(row.allow_user_registration),
        requireEmailVerification: Boolean(row.require_email_verification),
        enableSSO: Boolean(row.enable_sso),
        enableMFA: Boolean(row.enable_mfa),
        sessionTimeout: row.session_timeout || 480,
        passwordPolicy: {
          minLength: row.password_min_length || 8,
          requireUppercase: Boolean(row.password_require_uppercase),
          requireLowercase: Boolean(row.password_require_lowercase),
          requireNumbers: Boolean(row.password_require_numbers),
          requireSymbols: Boolean(row.password_require_symbols),
          maxAge: row.password_max_age || 90
        },
        branding: {
          primaryColor: row.brand_primary_color || '#0ea5e9',
          secondaryColor: row.brand_secondary_color || '#0284c7'
        },
        notifications: {
          emailNotifications: Boolean(row.email_notifications),
          notifyOnUserRegistration: Boolean(row.notify_on_user_registration),
          notifyOnUsageThreshold: Boolean(row.notify_on_usage_threshold),
          usageThresholdPercent: row.usage_threshold_percent || 80
        }
      },
      stripeCustomerId: row.stripe_customer_id,
      stripeConnectAccountId: row.stripe_connect_account_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToPaymentMethod(row: any): PaymentMethod {
    return {
      id: row.id,
      type: row.type,
      brand: row.brand,
      last4: row.last4,
      expiryMonth: row.expiry_month,
      expiryYear: row.expiry_year,
      isDefault: Boolean(row.is_default)
    };
  }

  private mapRowToInvoice(row: any): Invoice {
    return {
      id: row.id,
      number: row.number,
      tenantId: row.tenant_id,
      status: row.status,
      amount: row.amount,
      currency: row.currency,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      downloadUrl: `/api/payments/invoices/${row.id}/download`
    };
  }

  private mapRowToAuditLog(row: any): any {
    return {
      id: row.id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      timestamp: row.timestamp
    };
  }

  // Helper to convert camelCase to snake_case
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}