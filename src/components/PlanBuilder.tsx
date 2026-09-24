import { Check, Lock, MessageCircle, UserRound, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx, SegmentedControl, Skeleton, WhatsAppIcon } from '@/ui';
import { usePricing } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';
import { quotePlan } from '../lib/pricing';
import { MODULES, PLANS, type Plan, type TenantModule } from '../lib/types';

/**
 * The plan of a business, built like on the landing: free, monthly or yearly billing, Cobranza
 * always in plus the optional modules, and a live summary of what it pays (with the module
 * discount) and what it includes. Used when creating a business and in its detail page.
 */
export function PlanBuilder({
  plan,
  modules,
  onPlanChange,
  onToggleModule,
  requested = [],
  disabled = false,
}: {
  plan: Plan;
  modules: TenantModule[];
  onPlanChange: (plan: Plan) => void;
  onToggleModule: (module: TenantModule) => void;
  /** Modules the business asked for on the landing (marked "Lo pidió"). */
  requested?: TenantModule[];
  disabled?: boolean;
}) {
  const { t, fmt } = useI18n();
  const pricing = usePricing();
  const catalog = pricing.data;
  const money = (value: number) => fmt.money(value).replace(/[.,]00$/, '');

  if (!catalog) return <Skeleton className="h-72 rounded-2xl" />;
  const quote = quotePlan(catalog, plan, modules);

  const row = (
    key: 'collections' | TenantModule,
    selected: boolean,
    locked: boolean,
    onClick: (() => void) | null,
  ) => (
    <li key={key}>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-disabled={locked || disabled}
        disabled={disabled}
        onClick={() => onClick?.()}
        className={cx(
          'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60',
          selected
            ? 'border-primary/40 bg-primary-soft/50'
            : 'border-line bg-surface hover:bg-surface-2',
          locked && 'cursor-default',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold">
            {t(`builder.modules.${key}.name`)}
            <span className="text-xs font-medium text-primary-ink">
              {t('builder.perMonth', { amount: money(catalog.modules[key]) })}
            </span>
            {locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-ink">
                <Lock className="h-3 w-3" />
                {t('builder.always')}
              </span>
            )}
            {key !== 'collections' && requested.includes(key) && (
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-ink">
                {t('modules.requested')}
              </span>
            )}
          </span>
          <span className="block text-xs text-muted">
            {t(`builder.modules.${key}.description`)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cx(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
            selected ? 'border-primary bg-primary text-on-primary' : 'border-line-strong',
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" />}
        </span>
      </button>
    </li>
  );

  const stat = (icon: ReactNode, value: string, label: string) => (
    <li className="rounded-xl border border-line bg-surface/80 px-2 py-2.5 text-center">
      <span className="flex justify-center text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="mt-0.5 block text-base font-bold tabular-nums">{value}</span>
      <span className="block text-[11px] leading-tight text-muted">{label}</span>
    </li>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="label">{t('builder.billing')}</p>
        <SegmentedControl
          label={t('builder.billing')}
          value={plan}
          onChange={(value) => !disabled && onPlanChange(value)}
          options={PLANS.map((value) => ({ value, label: t(`plans.${value}`) }))}
        />
        {plan === 'pro' && <p className="mt-1 text-xs text-muted">{t('builder.annualHint')}</p>}
      </div>

      <div>
        <p className="label">{t('builder.modulesLabel')}</p>
        <ul className="space-y-2">
          {row('collections', true, true, null)}
          {MODULES.map((module) =>
            row(module, modules.includes(module), false, () => onToggleModule(module)),
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary-soft to-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-muted">
            {t('builder.summary', { count: Number(quote.count) })}
          </span>
          {quote.price ? (
            <span className="flex items-baseline gap-1.5">
              {quote.price.discount > 0 && (
                <span className="text-sm text-subtle tabular-nums line-through">
                  {money(quote.price.list)}
                </span>
              )}
              <span className="font-display text-2xl font-bold tabular-nums">
                {money(quote.price.perMonth)}
              </span>
              <span className="text-xs text-muted">{t('builder.month')}</span>
            </span>
          ) : (
            <span className="font-display text-2xl font-bold">{t('builder.free')}</span>
          )}
        </div>
        {quote.price && (
          <p className="mt-0.5 text-right text-xs text-success-ink">
            {[
              quote.price.discount > 0 &&
                t('builder.discount', { percent: fmt.percent(quote.price.discount) }),
              quote.price.yearly !== null &&
                t('builder.yearly', { amount: money(quote.price.yearly) }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {stat(
            <MessageCircle />,
            fmt.number(quote.allowance.automaticMessages),
            t('builder.automatic'),
          )}
          {stat(<UserRound />, fmt.number(quote.allowance.users), t('builder.users'))}
          {stat(
            <Users />,
            quote.allowance.customers === null
              ? t('builder.unlimited')
              : fmt.number(quote.allowance.customers),
            t('builder.customers'),
          )}
        </ul>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
          <WhatsAppIcon className="h-3.5 w-3.5" />
          {t('builder.manual')}
        </p>
      </div>
    </div>
  );
}
