import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TeamUser, TeamUserChanges, TeamUserInput } from '@/ui';
import type {
  AccessRequest,
  AccessRequestStatus,
  NewTenantInput,
  Paginated,
  Plan,
  PlatformAdmin,
  PlatformOverview,
  SortDir,
  TenantDetail,
  TenantRow,
  TenantSortBy,
  TenantModule,
  TenantStatus,
} from '../lib/types';

export const queryKeys = {
  me: ['admin', 'me'] as const,
  overview: ['admin', 'overview'] as const,
  tenants: (params: TenantListParams) => ['admin', 'tenants', params] as const,
  tenant: (id: string) => ['admin', 'tenant', id] as const,
  accessRequests: ['admin', 'access-requests'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<{ admin: PlatformAdmin }>('/admin/auth/me').then((body) => body.admin),
  });
}

export function useOverview(params: {
  from: string;
  to: string;
  granularity: 'day' | 'week' | 'month';
}) {
  return useQuery({
    queryKey: [...queryKeys.overview, params],
    queryFn: () => api.get<PlatformOverview>('/admin/overview', { ...params }),
    // Keep the current numbers on screen (with spinners) while another period loads.
    placeholderData: keepPreviousData,
  });
}

export interface TenantListParams {
  search?: string;
  plan?: Plan | '';
  status?: TenantStatus | '';
  /** A module the business has, or `none`. */
  module?: TenantModule | 'none' | '';
  page: number;
  pageSize: number;
  /** Omitted: the API's default order (newest first). */
  sortBy?: TenantSortBy;
  sortDir?: SortDir;
}

export function useTenants(params: TenantListParams) {
  return useQuery({
    queryKey: queryKeys.tenants(params),
    queryFn: () => api.get<Paginated<TenantRow>>('/admin/tenants', { ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenant(id),
    queryFn: () => api.get<TenantDetail>(`/admin/tenants/${id}`),
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: { plan?: Plan; status?: TenantStatus; modules?: TenantModule[] }) =>
      api.patch<TenantDetail>(`/admin/tenants/${id}`, changes),
    onSuccess: (detail) => {
      queryClient.setQueryData(queryKeys.tenant(id), detail);
      // Lists and totals depend on plan/status.
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.overview });
    },
  });
}

/** Lists and totals that change when businesses or requests change. */
function useInvalidatePlatform() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accessRequests }),
    ]);
}

export function useCreateTenant() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: (input: NewTenantInput) =>
      api.post<{ tenant: TenantDetail; temporaryPassword: string }>('/admin/tenants', input),
    onSuccess: () => invalidate(),
  });
}

/** User management of one business, from the backoffice. */
export function useTenantUserActions(tenantId: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.tenant(tenantId) });
  const base = `/admin/tenants/${tenantId}/users`;
  return {
    create: async (input: TeamUserInput) => {
      const result = await api.post<{ user: TeamUser; temporaryPassword: string }>(base, input);
      await refresh();
      return result;
    },
    update: async (userId: string, changes: TeamUserChanges) => {
      const user = await api.patch<TeamUser>(`${base}/${userId}`, changes);
      await refresh();
      return user;
    },
    resetPassword: async (userId: string) => {
      const result = await api.post<{ temporaryPassword: string }>(
        `${base}/${userId}/reset-password`,
      );
      await refresh();
      return result;
    },
  };
}

export interface AccessRequestParams {
  status?: AccessRequestStatus | '';
  search?: string;
  sortBy?: 'businessName' | 'contactName' | 'message' | 'status' | 'createdAt';
  sortDir?: SortDir;
  page: number;
  pageSize: number;
}

export function useAccessRequests(params: AccessRequestParams) {
  return useQuery({
    queryKey: [...queryKeys.accessRequests, params],
    queryFn: () => api.get<Paginated<AccessRequest>>('/admin/access-requests', { ...params }),
    placeholderData: keepPreviousData,
  });
}

export function useUpdateAccessRequest() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'dismissed' }) =>
      api.patch<AccessRequest>(`/admin/access-requests/${id}`, { status }),
    onSuccess: () => invalidate(),
  });
}
