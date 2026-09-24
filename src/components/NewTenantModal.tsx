import {
  Alert,
  Button,
  Field,
  IndustrySelect,
  Modal,
  SegmentedControl,
  TemporaryPasswordDialog,
  useErrorText,
  useFeedback,
  useErrorToast,
} from '@/ui';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateTenant } from '../hooks/queries';
import { useI18n } from '../i18n/I18nProvider';
import { APP_URL } from '../lib/config';
import { PLANS, type AccessRequest, type Plan, type TenantModule } from '../lib/types';
import { ModuleSwitches } from './ModuleSwitches';

/** Plan names as the landing writes them ("Plan de interés: anual · Cobranza + Ventas · …"). */
const PLAN_NAMES: Record<string, Plan> = {
  free: 'free',
  gratis: 'free',
  starter: 'starter',
  mensual: 'starter',
  básico: 'starter',
  basico: 'starter',
  pro: 'pro',
  anual: 'pro',
  negocio: 'pro',
};

/** Plan mentioned in a landing request message ("Plan de interés: Básico"), if any. */
function planFromMessage(message: string | null): Plan {
  const match = message
    ?.match(/(?:plan de inter[eé]s|plan of interest)\s*:\s*([a-záéíóú]+)/i)?.[1]
    ?.toLowerCase();
  return PLAN_NAMES[match ?? ''] ?? 'free';
}

function NewTenantForm({
  request,
  onClose,
  onCreated,
}: {
  request?: AccessRequest;
  onClose: () => void;
  onCreated: (result: {
    tenantId: string;
    tenantName: string;
    admin: { name: string; email: string };
    temporaryPassword: string;
  }) => void;
}) {
  const { t } = useI18n();
  const errors = useErrorText();
  const create = useCreateTenant();
  const [name, setName] = useState(request?.businessName ?? '');
  const [industry, setIndustry] = useState(request?.industry ?? '');
  const [plan, setPlan] = useState<Plan>(() => planFromMessage(request?.message ?? null));
  const [modules, setModules] = useState<TenantModule[]>(request?.modules ?? []);
  const [adminName, setAdminName] = useState(request?.contactName ?? '');
  const [adminEmail, setAdminEmail] = useState(request?.email ?? '');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const admin = { name: adminName.trim(), email: adminEmail.trim() };
    const result = await create
      .mutateAsync({
        name: name.trim(),
        industry: industry || undefined,
        plan,
        modules,
        admin,
        accessRequestId: request?.id,
      })
      .catch(() => null);
    if (!result) return;
    onCreated({
      tenantId: result.tenant.id,
      tenantName: result.tenant.name,
      admin,
      temporaryPassword: result.temporaryPassword,
    });
  };

  const error = create.error;
  useErrorToast(error);

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      {request && (
        <Alert tone="info">{t('newTenant.fromRequest', { name: request.contactName })}</Alert>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
          {t('newTenant.business')}
        </legend>
        <Field label={t('newTenant.name')} error={errors.field(error, 'name')}>
          {(id) => (
            <input
              id={id}
              className="input"
              required
              minLength={2}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Field label={t('newTenant.industry')} optionalLabel={t('newTenant.optional')}>
          {(id) => (
            <IndustrySelect id={id} defaultValue={request?.industry ?? ''} onChange={setIndustry} />
          )}
        </Field>
        <div>
          <p className="label">{t('newTenant.plan')}</p>
          <SegmentedControl
            label={t('newTenant.plan')}
            value={plan}
            onChange={setPlan}
            options={PLANS.map((value) => ({ value, label: t(`plans.${value}`) }))}
          />
        </div>
        <div>
          <p className="label">{t('newTenant.modules')}</p>
          <p className="mb-2 text-xs text-muted">{t('newTenant.modulesHint')}</p>
          <ModuleSwitches
            value={modules}
            requested={request?.modules ?? []}
            onToggle={(module) =>
              setModules((current) =>
                current.includes(module)
                  ? current.filter((item) => item !== module)
                  : [...current, module],
              )
            }
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-line pt-4">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-subtle uppercase">
          {t('newTenant.admin')}
        </legend>
        <Field label={t('newTenant.adminName')} error={errors.field(error, 'admin.name')}>
          {(id) => (
            <input
              id={id}
              className="input"
              required
              minLength={2}
              value={adminName}
              onChange={(event) => setAdminName(event.target.value)}
            />
          )}
        </Field>
        <Field
          label={t('newTenant.adminEmail')}
          hint={t('newTenant.adminHint')}
          error={errors.field(error, 'admin.email')}
        >
          {(id, describedBy) => (
            <input
              id={id}
              aria-describedby={describedBy}
              className="input"
              type="email"
              required
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          )}
        </Field>
      </fieldset>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('newTenant.cancel')}
        </Button>
        <Button type="submit" loading={create.isPending}>
          {t('newTenant.create')}
        </Button>
      </div>
    </form>
  );
}

/**
 * Creates a business with its first admin (optionally from an access request), then shows the
 * admin's temporary password once and opens the new business.
 */
export function NewTenantModal({
  open,
  request,
  onClose,
}: {
  open: boolean;
  request?: AccessRequest;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    tenantId: string;
  } | null>(null);

  return (
    <>
      <Modal
        open={open}
        title={t('newTenant.title')}
        description={t('newTenant.subtitle')}
        onClose={onClose}
      >
        <NewTenantForm
          request={request}
          onClose={onClose}
          onCreated={(result) => {
            onClose();
            toast.success(t('newTenant.created', { name: result.tenantName }));
            setCredentials({
              name: result.admin.name,
              email: result.admin.email,
              password: result.temporaryPassword,
              tenantId: result.tenantId,
            });
          }}
        />
      </Modal>
      <TemporaryPasswordDialog
        credentials={credentials}
        appUrl={`${APP_URL}/login`}
        onClose={() => {
          const tenantId = credentials?.tenantId;
          setCredentials(null);
          if (tenantId) navigate(`/tenants/${tenantId}`);
        }}
      />
    </>
  );
}
