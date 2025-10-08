// Frontend Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  tenantId?: string;
  tenantName?: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  users?: { total: number; active: number };
  apiCalls?: { thisMonth: number; usagePercent: number };
  storage?: { used: number; usagePercent: number };
  billing?: { monthlyAmount: number; currentPlan: string };
  totalTenants?: number;
  activeTenants?: number;
  totalUsers?: number;
  activeUsers?: number;
  monthlyRevenue?: number;
  totalRevenue?: number;
  apiCallsToday?: number;
}

export interface Activity {
  type: string;
  message: string;
  tenantName?: string;
  timestamp: string;
}

export interface MetricData {
  timestamp: string;
  value: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  managerOnly?: boolean;
  children?: NavItem[];
}

export interface AppState {
  currentUser: User | null;
  currentTenant: string | null;
  currentPage: string;
  apiBaseUrl: string;
}

// Payment & Billing Types
export interface PaymentMethod {
  id: string;
  tenantId: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  description?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}

export interface BillingSummary {
  currentPeriod: {
    start: string;
    end: string;
    amount: number;
    currency: string;
  };
  nextBillingDate?: string;
  paymentMethod?: PaymentMethod;
  upcomingInvoice?: Invoice;
  usageThisMonth: {
    apiCalls: number;
    users: number;
    storage: number;
  };
  tenant: {
    plan: string;
    limits?: any;
  };
}

export interface StripeConnectAccount {
  id: string;
  hasAccount: boolean;
  status: 'not_created' | 'pending' | 'restricted' | 'enabled';
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  requirements?: {
    currently_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  description?: string;
  metadata?: Record<string, string>;
}

// ✅ Tenant Management Types
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  description?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  country?: string;
  website?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
  createdAt: string;
  updatedAt: string;
}

// ✅ Advanced Payment Management Types
export interface PaymentSchedule {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  scheduledDate: string;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'auto_debit';
  status: 'pending' | 'processed' | 'failed';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  description: string;
  type: 'transaction' | 'subscription' | 'setup' | 'withdrawal';
  rate?: number; // percentage
  flatFee?: number; // fixed amount
  minAmount?: number;
  maxAmount?: number;
  applicableTo: string[]; // tenant IDs or 'all'
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTransaction {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  platformFee: number;
  currency: string;
  type: 'payment' | 'refund' | 'chargeback' | 'withdrawal';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFinancials {
  tenantId: string;
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  monthlyRevenue: number;
  currency: string;
  lastUpdated: string;
}

export interface PayoutRequest {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankAccount: {
    accountNumber: string;
    routingNumber: string;
    accountName: string;
    bankName: string;
  };
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface UserPaymentProfile {
  userId: string;
  defaultPaymentMethodId?: string;
  paymentMethods: PaymentMethod[];
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxInfo?: {
    taxId: string;
    taxType: string;
    isExempt: boolean;
  };
  connectedServices: ConnectedService[];
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedService {
  id: string;
  serviceName: string;
  serviceType: 'subscription' | 'marketplace' | 'api' | 'integration';
  isActive: boolean;
  monthlyFee?: number;
  usageBasedPricing?: {
    unit: string;
    pricePerUnit: number;
    includedUnits: number;
  };
  connectedAt: string;
  lastBilledAt?: string;
}