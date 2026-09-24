import { cx } from '@/ui';
import { useI18n } from '../i18n/I18nProvider';
import { MODULE_PRICES, MODULES, type TenantModule } from '../lib/types';

/**
 * One switch per optional module, with what it adds and its extra monthly price. Used when
 * creating a business and in its detail page.
 */
export function ModuleSwitches({
  value,
  onToggle,
  disabled = false,
  requested = [],
}: {
  value: TenantModule[];
  onToggle: (module: TenantModule) => void;
  disabled?: boolean;
  /** Modules the business asked for (marked "Lo pidió"). */
  requested?: TenantModule[];
}) {
  const { t, fmt } = useI18n();
  return (
    <ul className="space-y-2">
      {MODULES.map((module) => {
        const enabled = value.includes(module);
        return (
          <li key={module}>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={disabled}
              onClick={() => onToggle(module)}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60',
                enabled
                  ? 'border-primary/40 bg-primary-soft/50'
                  : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold">
                  {t(`modules.${module}.title`)}
                  <span className="text-xs font-medium text-primary-ink">
                    {t('modules.price', {
                      amount: fmt.money(MODULE_PRICES[module]).replace(/[.,]00$/, ''),
                    })}
                  </span>
                  {requested.includes(module) && (
                    <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning-ink">
                      {t('modules.requested')}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted">
                  {t(`modules.${module}.description`)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={cx(
                  'relative h-6 w-11 shrink-0 rounded-full transition',
                  enabled ? 'bg-primary' : 'bg-line-strong',
                )}
              >
                <span
                  className={cx(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    enabled ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
