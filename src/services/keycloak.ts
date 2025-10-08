// Keycloak OIDC Authentication Service
export class KeycloakService {
  private serverUrl: string;
  private clientId: string;
  private clientSecret: string;
  private realm: string;
  private redirectUri: string;

  constructor(config: {
    serverUrl: string;
    clientId: string;
    clientSecret: string;
    realm: string;
    redirectUri: string;
  }) {
    this.serverUrl = config.serverUrl;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.realm = config.realm;
    this.redirectUri = config.redirectUri;
  }

  /**
   * Generate Keycloak authorization URL for OIDC flow
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: state || crypto.randomUUID(),
    });

    return `${this.serverUrl}/protocol/openid-connect/auth?${params}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const response = await fetch(`${this.serverUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user info from Keycloak using access token
   */
  async getUserInfo(accessToken: string): Promise<{
    sub: string;
    email: string;
    email_verified: boolean;
    name: string;
    preferred_username: string;
    given_name?: string;
    family_name?: string;
    roles?: string[];
    groups?: string[];
  }> {
    const response = await fetch(`${this.serverUrl}/protocol/openid-connect/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }> {
    const response = await fetch(`${this.serverUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Logout user from Keycloak
   */
  async logout(refreshToken: string): Promise<void> {
    await fetch(`${this.serverUrl}/protocol/openid-connect/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      // Get Keycloak's public key for JWT verification
      const jwksResponse = await fetch(`${this.serverUrl}/protocol/openid-connect/certs`);
      const jwks = await jwksResponse.json();
      
      // Note: In production, you should use a proper JWT library like jose
      // For demo purposes, we'll do basic validation
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        throw new Error('Invalid JWT format');
      }

      // Decode payload (base64url decode)
      const decodedPayload = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      );

      // Basic validation
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      if (decodedPayload.iss !== this.serverUrl) {
        throw new Error('Invalid token issuer');
      }

      return decodedPayload;
    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Get user roles from Keycloak token
   */
  extractRolesFromToken(decodedToken: any): string[] {
    const roles: string[] = [];
    
    // Realm roles
    if (decodedToken.realm_access?.roles) {
      roles.push(...decodedToken.realm_access.roles);
    }
    
    // Resource roles
    if (decodedToken.resource_access?.[this.clientId]?.roles) {
      roles.push(...decodedToken.resource_access[this.clientId].roles);
    }
    
    // Custom roles from groups
    if (decodedToken.groups) {
      roles.push(...decodedToken.groups);
    }
    
    return roles.filter(role => 
      !['offline_access', 'uma_authorization', 'default-roles-master'].includes(role)
    );
  }

  /**
   * Check if user has specific role
   */
  hasRole(decodedToken: any, role: string): boolean {
    const roles = this.extractRolesFromToken(decodedToken);
    return roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(decodedToken: any, roles: string[]): boolean {
    const userRoles = this.extractRolesFromToken(decodedToken);
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Get tenant ID from token (custom claim)
   */
  getTenantId(decodedToken: any): string | null {
    return decodedToken.tenant_id || decodedToken.org_id || null;
  }

  /**
   * Create authentication middleware for Hono
   */
  createAuthMiddleware() {
    return async (c: any, next: any) => {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid authorization header' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      
      try {
        const decodedToken = await this.validateToken(token);
        
        // Add user info to context
        c.set('user', {
          id: decodedToken.sub,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.preferred_username,
          roles: this.extractRolesFromToken(decodedToken),
          tenantId: this.getTenantId(decodedToken),
          token: decodedToken
        });
        
        await next();
      } catch (error) {
        return c.json({ error: `Authentication failed: ${error.message}` }, 401);
      }
    };
  }

  /**
   * Create role-based authorization middleware
   */
  createRoleMiddleware(requiredRoles: string[]) {
    return async (c: any, next: any) => {
      const user = c.get('user');
      
      if (!user) {
        return c.json({ error: 'User not authenticated' }, 401);
      }

      if (!this.hasAnyRole(user.token, requiredRoles)) {
        return c.json({ 
          error: 'Insufficient permissions', 
          required: requiredRoles,
          userRoles: user.roles 
        }, 403);
      }

      await next();
    };
  }
}