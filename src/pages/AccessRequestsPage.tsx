import {
  Alert,
  Avatar,
  Badge,
  DataTable,
  IconButton,
  MenuItems,
  Page,
  PageHeader,
  Popover,
  SearchInput,
  SegmentedControl,
  useErrorText,
  useFeedback,
  useUrlState,
  type BadgeTone,
  type DataTableColumn,
} from '@/ui';
import {
  Building2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  SquareArrowOutUpRight,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NewTenantModal } from '../components/NewTenantModal';
import { useAccessRequests, useUpdateAccessRequest } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';
import {
  ACCESS_REQUEST_STATUSES,
  type AccessRequest,
  type AccessRequestStatus,
  type SortDir,
} from '../lib/types';

const DEFAULTS = {
  status: 'pending',
  search: '',
  page: '1',
  pageSize: '20',
  sortBy: 'createdAt',
  sortDir: 'desc',
};

/** Table column id → API sort field. */
const SORT_FIELDS = {
  business: 'businessName',
  contact: 'contactName',
  message: 'message',
  status: 'status',
  createdAt: 'createdAt',
} as const;

const STATUS_TONES: Record<AccessRequestStatus, BadgeTone> = {
  pending: 'warning',
  converted: 'success',
  dismissed: 'neutral',
};

/** WhatsApp chat link for a Peruvian phone (adds the +51 country code when missing). */
function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 9 ? `51${digits}` : digits}`;
}

export function AccessRequestsPage() {
  const { t, fmt } = useI18n();
  const navigate = useNavigate();
  const errors = useErrorText();
  const { toast } = useFeedback();
  const [state, update] = useUrlState(DEFAULTS);
  const [converting, setConverting] = useState<AccessRequest | null>(null);
  const changeStatus = useUpdateAccessRequest();

  const query = useAccessRequests({
    status: state.status as AccessRequestStatus | '',
    search: state.search || undefined,
    page: Number(state.page) || 1,
    pageSize: Number(state.pageSize) || 20,
    sortBy: SORT_FIELDS[state.sortBy as keyof typeof SORT_FIELDS] ?? 'createdAt',
    sortDir: state.sortDir as SortDir,
  });

  const setStatus = async (row: AccessRequest, status: 'pending' | 'dismissed') => {
    try {
      await changeStatus.mutateAsync({ id: row.id, status });
      toast.success(t(status === 'dismissed' ? 'requests.dismissed' : 'requests.restored'));
    } catch (error) {
      toast.apiError(error);
    }
  };

  const columns: Array<DataTableColumn<AccessRequest>> = [
    {
      id: 'business',
      sortable: true,
      header: t('requests.columns.business'),
      hideable: false,
      minWidth: 220,
      mobile: 'title',
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.businessName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.businessName}</p>
            <p className="truncate text-xs text-subtle">{row.industry ?? t('tenant.noIndustry')}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'contact',
      sortable: true,
      header: t('requests.columns.contact'),
      minWidth: 220,
      mobile: 'subtitle',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate">{row.contactName}</p>
          <p className="truncate text-xs text-subtle">
            {row.email} · <span className="tabular-nums">{row.phone}</span>
          </p>
        </div>
      ),
    },
    {
      id: 'message',
      sortable: true,
      header: t('requests.columns.message'),
      minWidth: 260,
      cell: (row) =>
        row.message ? (
          <p className="line-clamp-2 max-w-md text-sm text-muted" title={row.message}>
            {row.message}
          </p>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      id: 'status',
      sortable: true,
      header: t('requests.columns.status'),
      mobile: 'aside',
      cell: (row) => (
        <Badge tone={STATUS_TONES[row.status]} dot>
          {t(`requests.status.${row.status}`)}
        </Badge>
      ),
    },
    {
      id: 'createdAt',
      sortable: true,
      header: t('requests.columns.createdAt'),
      cell: (row) => fmt.dateTime(row.createdAt),
    },
  ];

  return (
    <Page fill>
      <PageHeader title={t('requests.title')} description={t('requests.subtitle')} />
      <DataTable
        columnsStorageKey="admin-requests"
        caption={t('requests.title')}
        toolbar={
          <>
            <SearchInput
              value={state.search}
              onChange={(search) => update({ search })}
              placeholder={t('requests.search')}
            />
            <SegmentedControl
              label={t('requests.filterStatus')}
              value={state.status}
              onChange={(status) => update({ status })}
              options={[
                ...ACCESS_REQUEST_STATUSES.map((status) => ({
                  value: status,
                  label: t(`requests.status.${status}`),
                })),
                { value: '', label: t('common.all') },
              ]}
            />
          </>
        }
        columns={columns}
        sort={{ id: state.sortBy, dir: state.sortDir as SortDir }}
        onSortChange={(sort) => update({ sortBy: sort.id, sortDir: sort.dir, page: '1' })}
        rows={query.data?.data}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        fetching={query.isFetching && !query.isLoading}
        error={query.error ? <Alert tone="danger">{errors.message(query.error)}</Alert> : undefined}
        empty={{
          title:
            state.status === 'pending' && !state.search
              ? t('requests.emptyPending')
              : t('requests.empty'),
        }}
        rowActions={(row) => (
          <Popover
            trigger={({ toggle, ref }) => (
              <IconButton ref={ref} size="sm" label={t('requests.actions')} onClick={toggle}>
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            )}
          >
            {(close) => (
              <MenuItems
                close={close}
                items={[
                  {
                    label: t('requests.convert'),
                    icon: <Building2 />,
                    onSelect: () => setConverting(row),
                    hidden: row.status === 'converted',
                  },
                  {
                    label: t('requests.openTenant'),
                    icon: <SquareArrowOutUpRight />,
                    onSelect: () => navigate(`/tenants/${row.tenantId}`),
                    hidden: !row.tenantId,
                  },
                  {
                    label: t('requests.whatsapp'),
                    icon: <MessageCircle />,
                    onSelect: () => window.open(whatsappUrl(row.phone), '_blank', 'noopener'),
                  },
                  {
                    label: t('requests.email'),
                    icon: <Mail />,
                    onSelect: () => window.open(`mailto:${row.email}`, '_self'),
                  },
                  {
                    label: t('requests.dismiss'),
                    icon: <XCircle />,
                    onSelect: () => void setStatus(row, 'dismissed'),
                    hidden: row.status !== 'pending',
                    danger: true,
                  },
                  {
                    label: t('requests.restore'),
                    icon: <RotateCcw />,
                    onSelect: () => void setStatus(row, 'pending'),
                    hidden: row.status !== 'dismissed',
                  },
                ]}
              />
            )}
          </Popover>
        )}
        pagination={
          query.data && {
            ...query.data.meta,
            onPageChange: (page) => update({ page: String(page) }),
            onPageSizeChange: (pageSize) => update({ pageSize: String(pageSize) }),
          }
        }
      />
      <NewTenantModal
        open={converting !== null}
        request={converting ?? undefined}
        onClose={() => setConverting(null)}
      />
    </Page>
  );
}
