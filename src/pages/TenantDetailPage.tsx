import {
  Alert,
  Avatar,
  Button,
  Card,
  KpiCard,
  KpiRow,
  LoadingState,
  Page,
  SegmentedControl,
  TeamUsers,
  useErrorText,
  useFeedback,
} from '@/ui';
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  HandCoins,
  PauseCircle,
  PlayCircle,
  TriangleAlert,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Link, useParams } from 'react-router';
import { PlanBadge, TenantStatusBadge } from '../components/Badges';
import { useTenant, useTenantUserActions, useUpdateTenant } from '../hooks/queries';
import { APP_URL } from '../lib/config';
import { useI18n } from '../i18n/I18nProvider';
import { PLANS, type Plan, type TenantDetail } from '../lib/types';

function Manage({ tenant }: { tenant: TenantDetail }) {
  const { t } = useI18n();
  const errors = useErrorText();
  const { toast, confirm } = useFeedback();
  const update = useUpdateTenant(tenant.id);
  const suspended = tenant.status === 'suspended';

  const changePlan = async (plan: Plan) => {
    if (plan === tenant.plan) return;
    try {
      await update.mutateAsync({ plan });
      toast.success(t('tenant.manage.planChanged', { plan: t(`plans.${plan}`) }));
    } catch (error) {
      toast.error(errors.message(error));
    }
  };

  const toggleStatus = async () => {
    const confirmed = await confirm({
      title: t(suspended ? 'tenant.manage.activateTitle' : 'tenant.manage.suspendTitle', {
        name: tenant.name,
      }),
      message: t(suspended ? 'tenant.manage.activateMessage' : 'tenant.manage.suspendMessage'),
      confirmLabel: t(suspended ? 'tenant.manage.activate' : 'tenant.manage.suspend'),
      cancelLabel: t('tenant.manage.cancel'),
      tone: suspended ? 'primary' : 'danger',
    });
    if (!confirmed) return;
    try {
      await update.mutateAsync({ status: suspended ? 'active' : 'suspended' });
      toast.success(
        t(suspended ? 'tenant.manage.activated' : 'tenant.manage.suspended', {
          name: tenant.name,
        }),
      );
    } catch (error) {
      toast.error(errors.message(error));
    }
  };

  return (
    <Card title={t('tenant.manage.title')} className="min-w-0">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium">{t('tenant.manage.plan')}</p>
          <p className="mb-2 text-xs text-muted">{t('tenant.manage.planHint')}</p>
          <SegmentedControl
            label={t('tenant.manage.plan')}
            value={tenant.plan}
            onChange={(plan) => void changePlan(plan)}
            options={PLANS.map((plan) => ({ value: plan, label: t(`plans.${plan}`) }))}
          />
        </div>
        <div className="border-t border-line pt-4">
          <p className="text-sm font-medium">{t('tenant.manage.status')}</p>
          <p className="mb-3 text-xs text-muted">{t('tenant.manage.suspendHint')}</p>
          <Button
            variant={suspended ? 'primary' : 'danger'}
            icon={
              suspended ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />
            }
            loading={update.isPending && update.variables?.status !== undefined}
            onClick={() => void toggleStatus()}
          >
            {t(suspended ? 'tenant.manage.activate' : 'tenant.manage.suspend')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Users({ tenant }: { tenant: TenantDetail }) {
  const actions = useTenantUserActions(tenant.id);
  return (
    <TeamUsers
      users={tenant.users}
      loginUrl={`${APP_URL}/login`}
      onCreate={actions.create}
      onUpdate={actions.update}
      onResetPassword={actions.resetPassword}
    />
  );
}

export function TenantDetailPage() {
  const { id = '' } = useParams();
  const { t, fmt } = useI18n();
  const errors = useErrorText();
  const query = useTenant(id);
  const tenant = query.data;

  return (
    <Page>
      <Link
        to="/tenants"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('tenant.back')}
      </Link>

      {query.error ? (
        <Alert tone="danger">{errors.message(query.error)}</Alert>
      ) : !tenant ? (
        <LoadingState label={t('common.loading')} />
      ) : (
        <div className="space-y-4">
          <header className="flex flex-wrap items-center gap-4">
            <Avatar name={tenant.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {tenant.name}
                </h1>
                <PlanBadge plan={tenant.plan} />
                <TenantStatusBadge status={tenant.status} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {tenant.industry ?? t('tenant.noIndustry')} ·{' '}
                {t('tenant.since', { date: fmt.date(tenant.createdAt) })}
              </p>
            </div>
          </header>

          <KpiRow>
            <KpiCard
              label={t('tenant.kpi.outstanding')}
              value={fmt.money(tenant.outstanding)}
              icon={<Wallet />}
            />
            <KpiCard
              label={t('tenant.kpi.overdue')}
              value={fmt.money(tenant.overdue)}
              icon={<TriangleAlert />}
              tone={tenant.overdue > 0 ? 'danger' : 'default'}
            />
            <KpiCard
              label={t('tenant.kpi.collected')}
              value={fmt.money(tenant.collectedLast30Days)}
              icon={<HandCoins />}
              tone="success"
            />
            <KpiCard
              label={t('tenant.kpi.customers')}
              value={fmt.number(tenant.customers)}
              icon={<UserRound />}
            />
            <KpiCard
              label={t('tenant.kpi.receivables')}
              value={fmt.number(tenant.receivables)}
              icon={<FileText />}
            />
            <KpiCard
              label={t('tenant.kpi.lastActivity')}
              value={tenant.lastActivityAt ? fmt.date(tenant.lastActivityAt) : t('common.never')}
              icon={<CalendarClock />}
            />
          </KpiRow>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <Users tenant={tenant} />
            </div>
            <Manage tenant={tenant} />
          </div>
        </div>
      )}
    </Page>
  );
}
