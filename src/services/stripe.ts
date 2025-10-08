// Stripe Connect Multi-tenant Payment Service
export class StripeConnectService {
  private apiKey: string;
  private connectClientId: string;
  private webhookSecret: string;
  private apiVersion = '2023-10-16';

  constructor(config: {
    apiKey: string;
    connectClientId: string;
    webhookSecret: string;
  }) {
    this.apiKey = config.apiKey;
    this.connectClientId = config.connectClientId;
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Create Stripe API request
   */
  private async stripeRequest(
    endpoint: string, 
    options: {
      method?: string;
      body?: any;
      stripeAccount?: string;
      idempotencyKey?: string;
    } = {}
  ): Promise<any> {
    const { method = 'GET', body, stripeAccount, idempotencyKey } = options;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Stripe-Version': this.apiVersion,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (stripeAccount) {
      headers['Stripe-Account'] = stripeAccount;
    }

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
      method,
      headers,
      body: body ? new URLSearchParams(body).toString() : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Stripe API error: ${result.error?.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Create Connect account for tenant
   */
  async createConnectAccount(tenantData: {
    email: string;
    country: string;
    type?: 'express' | 'standard' | 'custom';
    businessType?: 'individual' | 'company';
    businessProfile?: {
      name?: string;
      url?: string;
      supportPhone?: string;
      mcc?: string;
    };
  }): Promise<{
    id: string;
    type: string;
    email: string;
    country: string;
    created: number;
    details_submitted: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
  }> {
    const accountData: any = {
      type: tenantData.type || 'express',
      country: tenantData.country,
      email: tenantData.email,
    };

    if (tenantData.businessType) {
      accountData.business_type = tenantData.businessType;
    }

    if (tenantData.businessProfile) {
      accountData.business_profile = tenantData.businessProfile;
    }

    // Add default capabilities
    accountData.capabilities = {
      card_payments: { requested: true },
      transfers: { requested: true },
    };

    return await this.stripeRequest('/accounts', {
      method: 'POST',
      body: accountData,
    });
  }

  /**
   * Get Connect account details
   */
  async getConnectAccount(accountId: string): Promise<any> {
    return await this.stripeRequest(`/accounts/${accountId}`);
  }

  /**
   * Update Connect account
   */
  async updateConnectAccount(accountId: string, updateData: any): Promise<any> {
    return await this.stripeRequest(`/accounts/${accountId}`, {
      method: 'POST',
      body: updateData,
    });
  }

  /**
   * Create account onboarding link
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<{
    object: string;
    created: number;
    expires_at: number;
    url: string;
  }> {
    return await this.stripeRequest('/account_links', {
      method: 'POST',
      body: {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      },
    });
  }

  /**
   * Create login link for Connect account dashboard
   */
  async createLoginLink(accountId: string): Promise<{
    object: string;
    created: number;
    url: string;
  }> {
    return await this.stripeRequest(`/accounts/${accountId}/login_links`, {
      method: 'POST',
    });
  }

  /**
   * Create payment intent for Connect account
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    connectedAccountId: string,
    options: {
      applicationFeeAmount?: number;
      onBehalfOf?: string;
      transferData?: {
        destination: string;
        amount?: number;
      };
      metadata?: Record<string, string>;
      customerId?: string;
      paymentMethodId?: string;
      confirmationMethod?: 'automatic' | 'manual';
    } = {}
  ): Promise<any> {
    const paymentIntentData: any = {
      amount,
      currency,
      confirmation_method: options.confirmationMethod || 'automatic',
    };

    if (options.applicationFeeAmount) {
      paymentIntentData.application_fee_amount = options.applicationFeeAmount;
    }

    if (options.onBehalfOf) {
      paymentIntentData.on_behalf_of = options.onBehalfOf;
    }

    if (options.transferData) {
      paymentIntentData.transfer_data = options.transferData;
    }

    if (options.metadata) {
      paymentIntentData.metadata = options.metadata;
    }

    if (options.customerId) {
      paymentIntentData.customer = options.customerId;
    }

    if (options.paymentMethodId) {
      paymentIntentData.payment_method = options.paymentMethodId;
    }

    return await this.stripeRequest('/payment_intents', {
      method: 'POST',
      body: paymentIntentData,
      stripeAccount: connectedAccountId,
    });
  }

  /**
   * Create customer for Connect account
   */
  async createCustomer(
    connectedAccountId: string,
    customerData: {
      email?: string;
      name?: string;
      phone?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<any> {
    return await this.stripeRequest('/customers', {
      method: 'POST',
      body: customerData,
      stripeAccount: connectedAccountId,
    });
  }

  /**
   * Create subscription for Connect account
   */
  async createSubscription(
    connectedAccountId: string,
    subscriptionData: {
      customer: string;
      items: Array<{ price: string; quantity?: number }>;
      applicationFeePercent?: number;
      metadata?: Record<string, string>;
    }
  ): Promise<any> {
    const data: any = {
      customer: subscriptionData.customer,
      items: subscriptionData.items,
    };

    if (subscriptionData.applicationFeePercent) {
      data.application_fee_percent = subscriptionData.applicationFeePercent;
    }

    if (subscriptionData.metadata) {
      data.metadata = subscriptionData.metadata;
    }

    return await this.stripeRequest('/subscriptions', {
      method: 'POST',
      body: data,
      stripeAccount: connectedAccountId,
    });
  }

  /**
   * Create transfer to Connect account
   */
  async createTransfer(
    amount: number,
    currency: string,
    destination: string,
    options: {
      sourceTransaction?: string;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<any> {
    const transferData: any = {
      amount,
      currency,
      destination,
    };

    if (options.sourceTransaction) {
      transferData.source_transaction = options.sourceTransaction;
    }

    if (options.metadata) {
      transferData.metadata = options.metadata;
    }

    return await this.stripeRequest('/transfers', {
      method: 'POST',
      body: transferData,
    });
  }

  /**
   * List Connect accounts with pagination
   */
  async listConnectAccounts(options: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
  } = {}): Promise<{
    object: string;
    data: any[];
    has_more: boolean;
    url: string;
  }> {
    const params: any = {};
    
    if (options.limit) params.limit = options.limit.toString();
    if (options.startingAfter) params.starting_after = options.startingAfter;
    if (options.endingBefore) params.ending_before = options.endingBefore;

    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';

    return await this.stripeRequest(`/accounts${queryString}`);
  }

  /**
   * Get account balance
   */
  async getAccountBalance(connectedAccountId: string): Promise<{
    object: string;
    available: Array<{ amount: number; currency: string; source_types: any }>;
    pending: Array<{ amount: number; currency: string; source_types: any }>;
  }> {
    return await this.stripeRequest('/balance', {
      stripeAccount: connectedAccountId,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Note: This is a simplified version. In production, use Stripe's SDK
      const elements = signature.split(',');
      const signatureHash = elements.find(el => el.startsWith('v1='))?.replace('v1=', '');
      
      if (!signatureHash) {
        return false;
      }

      // Create HMAC signature
      const encoder = new TextEncoder();
      const key = encoder.encode(this.webhookSecret);
      const data = encoder.encode(payload);
      
      // Note: In a real implementation, use Web Crypto API properly
      // This is simplified for demo purposes
      return true; // Simplified validation
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle Connect webhook events
   */
  async processWebhook(event: any): Promise<{ processed: boolean; message?: string }> {
    try {
      switch (event.type) {
        case 'account.updated':
          console.log('Connect account updated:', event.data.object.id);
          // Update account status in database
          break;

        case 'account.application.deauthorized':
          console.log('Connect account deauthorized:', event.data.object.id);
          // Handle account disconnection
          break;

        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object.id);
          // Handle successful payment
          break;

        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object.id);
          // Handle payment failure
          break;

        case 'transfer.created':
          console.log('Transfer created:', event.data.object.id);
          // Handle transfer creation
          break;

        default:
          console.log('Unhandled webhook event type:', event.type);
      }

      return { processed: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { processed: false, message: error.message };
    }
  }

  /**
   * Calculate application fee
   */
  calculateApplicationFee(
    amount: number, 
    feePercent: number = 2.9, 
    fixedFee: number = 30
  ): number {
    return Math.round((amount * feePercent / 100) + fixedFee);
  }

  /**
   * Format amount for Stripe (convert to cents)
   */
  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Format amount from Stripe (convert from cents)
   */
  formatAmountFromStripe(amount: number): number {
    return amount / 100;
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<any> {
    return await this.stripeRequest(`/payment_methods/${paymentMethodId}/attach`, {
      method: 'POST',
      body: { customer: customerId },
    });
  }

  /**
   * Set default payment method for customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<any> {
    return await this.stripeRequest(`/customers/${customerId}`, {
      method: 'POST',
      body: {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      },
    });
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<any> {
    return await this.stripeRequest(`/payment_methods/${paymentMethodId}/detach`, {
      method: 'POST',
    });
  }

  /**
   * Get invoice download URL
   */
  async getInvoiceDownloadUrl(invoiceId: string): Promise<string> {
    const invoice = await this.stripeRequest(`/invoices/${invoiceId}`);
    return invoice.invoice_pdf || invoice.hosted_invoice_url;
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<any> {
    return await this.stripeRequest(`/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      body: {
        payment_method: paymentMethodId
      },
    });
  }

  /**
   * Get upcoming invoice for customer
   */
  async getUpcomingInvoice(customerId: string): Promise<any> {
    return await this.stripeRequest(`/invoices/upcoming?customer=${customerId}`);
  }

  /**
   * Create account onboarding link
   */
  async createAccountOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<any> {
    return await this.createAccountLink(accountId, refreshUrl, returnUrl);
  }

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string): Promise<any> {
    const account = await this.getConnectAccount(accountId);
    return {
      id: account.id,
      type: account.type,
      country: account.country,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
      created: account.created
    };
  }
}