import { Badge, type BadgeTone } from '@/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { Plan, TenantStatus } from '../lib/types';

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
