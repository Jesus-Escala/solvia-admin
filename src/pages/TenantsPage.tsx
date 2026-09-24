import {
  Alert,
  Avatar,
  Button,
  DataTable,
  Page,
  PageHeader,
  SearchInput,
  SegmentedControl,
  useErrorText,
  useUrlState,
  type DataTableColumn,
} from '@/ui';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NewTenantModal } from '../components/NewTenantModal';
import { PlanBadge, TenantStatusBadge } from '../components/Badges';
import { useTenants } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';
import {
  PLANS,
  TENANT_STATUSES,
  type Plan,
  type SortDir,
  type TenantRow,
  type TenantSortBy,
  type TenantStatus,
} from '../lib/types';

const DEFAULTS = {
  search: '',
  plan: '',
  status: '',
  page: '1',
  pageSize: '20',
  // Empty = the API's default order, shown as "not sorted" in the headers.
  sortBy: '',
  sortDir: '',
};

export function TenantsPage() {
  const { t, fmt } = useI18n();
  const navigate = useNavigate();
  const errors = useErrorText();
  const [state, update] = useUrlState(DEFAULTS);
  const [creating, setCreating] = useState(false);

  const query = useTenants({
    search: state.search || undefined,
    plan: state.plan as Plan | '',
    status: state.status as TenantStatus | '',
    page: Number(state.page) || 1,
    pageSize: Number(state.pageSize) || 20,
    sortBy: (state.sortBy || undefined) as TenantSortBy | undefined,
    sortDir: (state.sortDir || undefined) as SortDir | undefined,
  });
  const filtered = Boolean(state.search || state.plan || state.status);

  const columns: Array<DataTableColumn<TenantRow>> = [
    {
      id: 'name',
      header: t('tenants.columns.name'),
      sortable: true,
      hideable: false,
      minWidth: 240,
      mobile: 'title',
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name}</p>
            <p className="truncate text-xs text-subtle">{row.industry ?? t('tenant.noIndustry')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'plan',
      sortable: true,
      header: t('tenants.columns.plan'),
      mobile: 'subtitle',
      cell: (row) => <PlanBadge plan={row.plan} />,
    },
    {
      id: 'status',
      sortable: true,
      header: t('tenants.columns.status'),
      mobile: 'aside',
      cell: (row) => <TenantStatusBadge status={row.status} />,
    },
    {
      id: 'users',
      header: t('tenants.columns.users'),
      sortable: true,
      align: 'right',
      cell: (row) => fmt.number(row.users),
    },
    {
      id: 'customers',
      header: t('tenants.columns.customers'),
      sortable: true,
      align: 'right',
      cell: (row) => fmt.number(row.customers),
    },
    {
      id: 'outstanding',
      header: t('tenants.columns.outstanding'),
      sortable: true,
      align: 'right',
      mobile: 'aside',
      cell: (row) => <span className="font-semibold">{fmt.money(row.outstanding)}</span>,
    },
    {
      id: 'collected',
      sortable: true,
      header: t('tenants.columns.collected'),
      align: 'right',
      cell: (row) => fmt.money(row.collectedLast30Days),
    },
    {
      id: 'lastActivity',
      sortable: true,
      header: t('tenants.columns.lastActivity'),
      cell: (row) =>
        row.lastActivityAt ? (
          fmt.date(row.lastActivityAt)
        ) : (
          <span className="text-subtle">{t('common.never')}</span>
        ),
    },
    {
      id: 'createdAt',
      header: t('tenants.columns.createdAt'),
      sortable: true,
      cell: (row) => fmt.date(row.createdAt),
    },
  ];

  return (
    <Page fill>
      <PageHeader
        title={t('tenants.title')}
        description={t('tenants.subtitle')}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            {t('tenants.new')}
          </Button>
        }
      />
      <DataTable
        columnsStorageKey="admin-tenants"
        caption={t('tenants.title')}
        toolbar={
          <>
            <SearchInput
              value={state.search}
              onChange={(search) => update({ search })}
              placeholder={t('tenants.search')}
            />
            <SegmentedControl
              label={t('tenants.filterPlan')}
              value={state.plan}
              onChange={(plan) => update({ plan })}
              options={[
                { value: '', label: t('common.all') },
                ...PLANS.map((plan) => ({ value: plan, label: t(`plans.${plan}`) })),
              ]}
            />
            <SegmentedControl
              label={t('tenants.filterStatus')}
              value={state.status}
              onChange={(status) => update({ status })}
              options={[
                { value: '', label: t('common.all') },
                ...TENANT_STATUSES.map((status) => ({
                  value: status,
                  label: t(`tenantStatus.${status}`),
                })),
              ]}
            />
          </>
        }
        columns={columns}
        rows={query.data?.data}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        fetching={query.isFetching && !query.isLoading}
        error={query.error ? <Alert tone="danger">{errors.message(query.error)}</Alert> : undefined}
        onRowClick={(row) => navigate(`/tenants/${row.id}`)}
        sort={state.sortBy ? { id: state.sortBy, dir: state.sortDir as SortDir } : undefined}
        onSortChange={(sort) =>
          // No sort (third click): back to the page's default order.
          update({
            sortBy: sort?.id ?? '',
            sortDir: sort?.dir ?? '',
            page: '1',
          })
        }
        rowClassName={(row) => (row.status === 'suspended' ? 'opacity-70' : undefined)}
        empty={{
          title: t('tenants.empty'),
          description: filtered ? t('tenants.emptyHint') : undefined,
        }}
        pagination={
          query.data && {
            ...query.data.meta,
            onPageChange: (page) => update({ page: String(page) }),
            onPageSizeChange: (pageSize) => update({ pageSize: String(pageSize) }),
          }
        }
      />
      <NewTenantModal open={creating} onClose={() => setCreating(false)} />
    </Page>
  );
}
