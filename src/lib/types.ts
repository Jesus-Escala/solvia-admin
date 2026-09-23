/** API contracts of the platform admin endpoints (`/api/admin/*`). */
import type { TeamUser } from '@/ui';

export type Plan = 'free' | 'starter' | 'pro';
export type TenantStatus = 'active' | 'suspended';
export type SortDir = 'asc' | 'desc';

export const PLANS: Plan[] = ['free', 'starter', 'pro'];
export const TENANT_STATUSES: TenantStatus[] = ['active', 'suspended'];

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  admin: PlatformAdmin;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface PlatformOverview {
  totals: {
    tenants: number;
    activeTenants: number;
    suspendedTenants: number;
    users: number;
    customers: number;
    receivables: number;
    outstanding: number;
    collectedLast30Days: number;
    newTenantsThisMonth: number;
    pendingAccessRequests: number;
  };
  /** Always the three plans, 0 when none. */
  tenantsByPlan: Array<{ plan: Plan; count: number }>;
  /** Last 12 months, oldest first, zero-filled. */
  signups: Array<{ period: string; count: number }>;
  /** Last 6 months, oldest first, zero-filled. */
  collections: Array<{ period: string; amount: number }>;
  topTenants: Array<{ id: string; name: string; outstanding: number; customers: number }>;
  generatedAt: string;
  /** Present when the overview is requested for a period (`from`/`to`). */
  period?: {
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
    previous: { from: string; to: string };
  };
  periodTotals?: { collected: PeriodMetric; newTenants: PeriodMetric; payments: PeriodMetric };
  periodSeries?: Array<{ bucket: string; collected: number; newTenants: number }>;
}

/** Value of a period and of the previous equal-length period (null when not computable). */
export interface PeriodMetric {
  value: number | null;
  previous: number | null;
}

export interface TenantRow {
  id: string;
  name: string;
  industry: string | null;
  plan: Plan;
  status: TenantStatus;
  createdAt: string;
  users: number;
  customers: number;
  receivables: number;
  outstanding: number;
  collectedLast30Days: number;
  lastActivityAt: string | null;
}

export type TenantSortBy = 'name' | 'createdAt' | 'outstanding' | 'customers' | 'users';

/** Detail of one business: the list row plus overdue amount and its users (instead of a count). */
export interface TenantDetail extends Omit<TenantRow, 'users'> {
  overdue: number;
  users: TeamUser[];
}

export type AccessRequestStatus = 'pending' | 'converted' | 'dismissed';
export const ACCESS_REQUEST_STATUSES: AccessRequestStatus[] = ['pending', 'converted', 'dismissed'];

/** Someone who asked for access from the landing page. */
export interface AccessRequest {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string | null;
  message: string | null;
  status: AccessRequestStatus;
  tenantId: string | null;
  createdAt: string;
}

export interface NewTenantInput {
  name: string;
  industry?: string;
  plan: Plan;
  admin: { name: string; email: string };
  accessRequestId?: string;
}
