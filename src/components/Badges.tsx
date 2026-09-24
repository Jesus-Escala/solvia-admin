import { Badge, type BadgeTone } from '@/ui';
import { useI18n } from '../i18n/I18nProvider';
import { MODULES, type Plan, type TenantModule, type TenantStatus } from '../lib/types';

const PLAN_TONES: Record<Plan, BadgeTone> = { free: 'neutral', starter: 'info', pro: 'primary' };

export function PlanBadge({ plan }: { plan: Plan }) {
  const { t } = useI18n();
  return <Badge tone={PLAN_TONES[plan]}>{t(`plans.${plan}`)}</Badge>;
}

/** Status always pairs a colored dot with its label (never color alone). */
export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const { t } = useI18n();
  return (
    <Badge tone={status === 'active' ? 'success' : 'danger'} dot>
      {t(`tenantStatus.${status}`)}
    </Badge>
  );
}

/** The optional modules a business has (or asked for), in a fixed order; nothing when none. */
export function ModuleBadges({ modules }: { modules: TenantModule[] }) {
  const { t } = useI18n();
  const shown = MODULES.filter((module) => modules.includes(module));
  if (shown.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((module) => (
        <Badge key={module} tone="primary">
          {t(`modules.${module}.title`)}
        </Badge>
      ))}
    </span>
  );
}
