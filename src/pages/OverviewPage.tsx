import {
  Alert,
  Button,
  Card,
  DonutChart,
  EmptyState,
  KpiCard,
  KpiRow,
  Page,
  PageHeader,
  RankingBars,
  Skeleton,
  Stat,
  useChartColors,
  useErrorText,
  useUrlState,
} from '@/ui';
import { Building2, HandCoins, Inbox, Sparkles, UserRound, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { MonthlyBarChart } from '../components/MonthlyBarChart';
import { useOverview } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';
import {
  allowedGranularities,
  autoGranularity,
  isValidRange,
  presetRange,
  type Granularity,
} from '../components/dashboard/period';
import { PeriodPicker } from '../components/dashboard/PeriodPicker';
import { MODULES, type PeriodMetric, type Plan, type PlatformOverview } from '../lib/types';

function Kpis({
  overview,
  fetching,
}: {
  overview: PlatformOverview | undefined;
  fetching: boolean;
}) {
  const { t, fmt } = useI18n();
  if (!overview) {
    return (
      <KpiRow>
        {Array.from({ length: 7 }, (_, index) => (
          <KpiCard key={index} label="" value="" loading />
        ))}
      </KpiRow>
    );
  }
  const { totals, periodTotals } = overview;
  return (
    <KpiRow>
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.tenants')}
        value={fmt.number(totals.tenants)}
        hint={t('overview.kpi.tenantsHint', {
          active: totals.activeTenants,
          suspended: totals.suspendedTenants,
        })}
        icon={<Building2 />}
      />
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.newTenantsPeriod')}
        value={fmt.number(periodTotals?.newTenants.value ?? totals.newTenantsThisMonth)}
        delta={change(periodTotals?.newTenants)}
        deltaLabel={t('overview.kpi.vsPrevious')}
        formatPercent={fmt.percent}
        icon={<Sparkles />}
        tone="success"
      />
      <Link to="/requests" className="block rounded-2xl transition hover:-translate-y-0.5">
        <KpiCard
          fetching={fetching}
          label={t('overview.kpi.requests')}
          value={fmt.number(totals.pendingAccessRequests)}
          hint={t('overview.kpi.requestsHint')}
          icon={<Inbox />}
          tone={totals.pendingAccessRequests > 0 ? 'warning' : 'default'}
        />
      </Link>
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.users')}
        value={fmt.number(totals.users)}
        icon={<Users />}
      />
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.customers')}
        value={fmt.number(totals.customers)}
        icon={<UserRound />}
      />
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.outstanding')}
        value={tileMoney(fmt, totals.outstanding)}
        valueTitle={fmt.money(totals.outstanding)}
        hint={t('overview.kpi.outstandingHint', { count: totals.receivables })}
        icon={<Wallet />}
        tone="warning"
      />
      <KpiCard
        fetching={fetching}
        label={t('overview.kpi.collectedPeriod')}
        value={tileMoney(fmt, periodTotals?.collected.value ?? totals.collectedLast30Days)}
        valueTitle={fmt.money(periodTotals?.collected.value ?? totals.collectedLast30Days)}
        delta={change(periodTotals?.collected)}
        deltaLabel={t('overview.kpi.vsPrevious')}
        formatPercent={fmt.percent}
        hint={
          periodTotals
            ? t('overview.kpi.collectedPeriodHint', {
                count: fmt.number(periodTotals.payments.value ?? 0),
              })
            : undefined
        }
        icon={<HandCoins />}
        tone="success"
      />
    </KpiRow>
  );
}

/** Money for a metric tile: abbreviated from one million up so it never gets cut. */
function tileMoney(
  fmt: { money: (v: number) => string; compactMoney: (v: number) => string },
  value: number,
) {
  return Math.abs(value) >= 1_000_000 ? fmt.compactMoney(value) : fmt.money(value);
}

/** Relative change against the previous period (null when there is nothing to compare). */
function change(metric: PeriodMetric | undefined): number | null {
  if (!metric || metric.value === null || metric.previous === null || metric.previous === 0) {
    return null;
  }
  return (metric.value - metric.previous) / Math.abs(metric.previous);
}

function ChartSkeleton() {
  return <Skeleton className="h-[240px] w-full" />;
}

const DEFAULT_PERIOD = { from: '', to: '', g: '' };

/**
 * Optional modules: how many active businesses pay for each one, the extra monthly revenue at
 * reference prices, and how many have none yet (a link to offer them).
 */
function ModulesCard({ overview, loading }: { overview: PlatformOverview; loading: boolean }) {
  const { t, fmt } = useI18n();
  const { modules } = overview;
  return (
    <Card
      loading={loading}
      title={t('overview.modules.title')}
      subtitle={t('overview.modules.subtitle')}
      actions={
        modules.none > 0 && (
          <Link
            to="/tenants?module=none&status=active"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
          >
            <Sparkles className="h-4 w-4" />
            {t('overview.modules.offer', { count: modules.none })}
          </Link>
        )
      }
    >
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {MODULES.map((module) => (
          <Stat
            key={module}
            label={t(`modules.${module}.title`)}
            value={fmt.number(modules[module])}
            hint={t('overview.modules.businesses')}
          />
        ))}
        <Stat
          label={t('overview.modules.none')}
          value={fmt.number(modules.none)}
          hint={t('overview.modules.noneHint')}
        />
        <Stat
          label={t('overview.modules.revenue')}
          value={fmt.money(overview.estimatedMonthlyRevenue)}
          hint={t('overview.modules.revenueHint')}
        />
      </dl>
    </Card>
  );
}

export function OverviewPage() {
  const { t, fmt } = useI18n();
  const errors = useErrorText();
  const colors = useChartColors();
  // The period lives in the URL (?from=&to=&g=). Default: the last 12 months.
  const [periodState, updatePeriod] = useUrlState(DEFAULT_PERIOD);
  const urlRange = { from: periodState.from, to: periodState.to };
  const range = isValidRange(urlRange) ? urlRange : presetRange('last12Months');
  const allowed = allowedGranularities(range);
  const granularity: Granularity = allowed.includes(periodState.g as Granularity)
    ? (periodState.g as Granularity)
    : allowed.includes(autoGranularity(range))
      ? autoGranularity(range)
      : allowed[0]!;
  const overview = useOverview({ ...range, granularity });
  const data = overview.data;
  // Background refresh: shown on each metric and chart.
  const refreshing = overview.isFetching && !overview.isLoading;

  // Categorical slots in fixed order (plan identity never depends on its rank).
  const planColors: Record<Plan, string> = {
    free: colors.series1,
    starter: colors.series2,
    pro: colors.series3,
  };

  return (
    <Page>
      <PageHeader
        title={t('overview.title')}
        description={t('overview.subtitle')}
        actions={
          data && (
            <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
              {t('common.updatedAt', { time: fmt.dateTime(data.generatedAt) })}
            </span>
          )
        }
      />

      <PeriodPicker
        range={range}
        granularity={granularity}
        onRangeChange={(next) => updatePeriod({ from: next.from, to: next.to, g: '' })}
        onGranularityChange={(g) => updatePeriod({ g })}
        previous={data?.period?.previous}
      />

      {overview.error ? (
        <Alert tone="danger">
          <span className="flex flex-wrap items-center justify-between gap-3">
            {errors.message(overview.error)}
            <Button size="sm" variant="secondary" onClick={() => void overview.refetch()}>
              {t('common.retry')}
            </Button>
          </span>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Kpis overview={data} fetching={refreshing} />

          {data && <ModulesCard overview={data} loading={refreshing} />}

          <div className="grid gap-4 xl:grid-cols-3">
            <Card
              loading={refreshing}
              className="min-w-0 xl:col-span-2"
              title={t('overview.collections.title')}
              subtitle={t('overview.collections.subtitle', {
                unit: t(`dashboard.period.granularities.${granularity}`).toLowerCase(),
              })}
            >
              {data ? (
                <MonthlyBarChart
                  granularity={data.periodSeries ? granularity : 'month'}
                  points={
                    data.periodSeries?.map((point) => ({
                      period: point.bucket,
                      value: point.collected,
                    })) ??
                    data.collections.map((point) => ({ period: point.period, value: point.amount }))
                  }
                  seriesLabel={t('overview.collections.series')}
                  formatValue={fmt.money}
                  formatAxis={fmt.compactMoney}
                />
              ) : (
                <ChartSkeleton />
              )}
            </Card>
            <Card className="min-w-0" title={t('overview.plans.title')} loading={refreshing}>
              {data ? (
                <DonutChart
                  centerLabel={t('overview.plans.center')}
                  formatValue={fmt.number}
                  slices={data.tenantsByPlan.map((item) => ({
                    key: item.plan,
                    label: t(`plans.${item.plan}`),
                    value: item.count,
                    color: planColors[item.plan],
                  }))}
                />
              ) : (
                <ChartSkeleton />
              )}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card
              loading={refreshing}
              className="min-w-0"
              title={t('overview.signups.title')}
              subtitle={t('overview.signups.subtitle', {
                unit: t(`dashboard.period.granularities.${granularity}`).toLowerCase(),
              })}
            >
              {data ? (
                <MonthlyBarChart
                  granularity={data.periodSeries ? granularity : 'month'}
                  points={
                    data.periodSeries?.map((point) => ({
                      period: point.bucket,
                      value: point.newTenants,
                    })) ??
                    data.signups.map((point) => ({ period: point.period, value: point.count }))
                  }
                  seriesLabel={t('overview.signups.series')}
                  formatValue={fmt.number}
                />
              ) : (
                <ChartSkeleton />
              )}
            </Card>
            <Card
              loading={refreshing}
              className="min-w-0"
              title={t('overview.top.title')}
              subtitle={t('overview.top.subtitle')}
            >
              {!data ? (
                <ChartSkeleton />
              ) : data.topTenants.length === 0 ? (
                <EmptyState title={t('overview.top.empty')} />
              ) : (
                <RankingBars
                  items={data.topTenants.map((tenant) => ({
                    id: tenant.id,
                    label: tenant.name,
                    href: `/tenants/${tenant.id}`,
                    value: tenant.outstanding,
                  }))}
                  formatValue={fmt.money}
                  baseLabel={t('overview.top.base')}
                  highlightLabel={t('overview.top.highlight')}
                />
              )}
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
