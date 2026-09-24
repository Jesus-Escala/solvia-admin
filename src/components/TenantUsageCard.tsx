import { MessageCirclePlus } from 'lucide-react';
import { Button, Card, cx, Skeleton, useFeedback } from '@/ui';
import { useAddMessagePack, useTenantUsage } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const { t, fmt } = useI18n();
  const ratio = limit === null || limit === 0 ? 0 : Math.min(1, used / limit);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums">
          {limit === null
            ? t('usage.unlimited', { used: fmt.number(used) })
            : t('usage.usedOf', { used: fmt.number(used), limit: fmt.number(limit) })}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cx(
            'h-full rounded-full',
            limit === null
              ? 'bg-success'
              : ratio >= 1
                ? 'bg-danger'
                : ratio >= 0.8
                  ? 'bg-warning'
                  : 'bg-primary',
          )}
          style={{ width: `${limit === null ? 100 : Math.max(2, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** A business's plan use this month, with the button to add a pack of automatic messages. */
export function TenantUsageCard({ tenantId }: { tenantId: string }) {
  const { t, fmt } = useI18n();
  const { toast } = useFeedback();
  const usage = useTenantUsage(tenantId);
  const addPack = useAddMessagePack(tenantId);
  const data = usage.data;

  const add = async () => {
    try {
      const updated = await addPack.mutateAsync();
      toast.success(
        t('usage.packAdded', { size: fmt.number(updated.packSize) }),
        t('usage.packAddedHint', { limit: fmt.number(updated.automaticMessages.limit) }),
      );
    } catch (error) {
      toast.apiError(error);
    }
  };

  return (
    <Card
      title={t('usage.title')}
      subtitle={data ? t('usage.month', { month: data.month }) : undefined}
      loading={usage.isFetching && !usage.isLoading}
    >
      {!data ? (
        <Skeleton className="h-28 rounded-xl" />
      ) : (
        <div className="space-y-4">
          <Meter
            label={t('usage.automatic')}
            used={data.automaticMessages.used}
            limit={data.automaticMessages.limit}
          />
          {data.automaticMessages.extra > 0 && (
            <p className="-mt-2 text-xs text-muted">
              {t('usage.extra', { extra: fmt.number(data.automaticMessages.extra) })}
            </p>
          )}
          <Meter label={t('usage.users')} used={data.users.used} limit={data.users.limit} />
          <Meter
            label={t('usage.customers')}
            used={data.customers.used}
            limit={data.customers.limit}
          />
          <Button
            variant="secondary"
            className="w-full"
            icon={<MessageCirclePlus className="h-4 w-4" />}
            loading={addPack.isPending}
            onClick={() => void add()}
          >
            {t('usage.addPack', { size: fmt.number(data.packSize) })}
          </Button>
        </div>
      )}
    </Card>
  );
}
