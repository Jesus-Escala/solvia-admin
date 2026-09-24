import {
  Button,
  InstallAppChip,
  Field,
  Logo,
  Mascot,
  PasswordInput,
  PreferencesControls,
  type MascotMood,
  useErrorToast,
  PaperBackdrop,
} from '@/ui';
import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import { DEMO_ADMIN } from '../lib/config';

export function LoginPage() {
  const { t } = useI18n();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<unknown>(null);
  useErrorToast(error, t('toast.signInFailed'));
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  // Bowl covers its eyes while the password is typed, and peeks when it is shown.
  const mood: MascotMood = visible ? 'peek' : focused ? 'cover' : 'default';
  const demo = DEMO_ADMIN;
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, secret);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      <PaperBackdrop />

      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-8">
        <Logo />
        <PreferencesControls tourTarget={false} />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-14 pb-8">
        <div className="relative w-full max-w-sm rounded-3xl border border-white/50 bg-surface/80 px-6 pt-12 pb-6 shadow-pop backdrop-blur-xl sm:px-8 dark:border-white/10 dark:bg-surface/75">
          <Mascot
            size={84}
            mood={mood}
            title="Bowl"
            className="absolute -top-[68px] left-1/2 -translate-x-1/2 drop-shadow-md"
          />
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-[11px] font-semibold text-info-ink">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('login.restricted')}
            </span>
            <h1 className="text-[1.7rem] leading-tight font-semibold">{t('login.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={(event) => void submit(event)} className="space-y-3.5">
            <Field label={t('login.email')}>
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>
            <Field label={t('login.password')}>
              {(id) => (
                <PasswordInput
                  id={id}
                  autoComplete="current-password"
                  value={secret}
                  onChange={setSecret}
                  showLabel={t('login.showPassword')}
                  hideLabel={t('login.hidePassword')}
                  onFocusChange={setFocused}
                  onVisibilityChange={setVisible}
                />
              )}
            </Field>
            <Button type="submit" className="h-11 w-full" loading={loading}>
              {t('login.submit')}
            </Button>
          </form>

          {demo && (
            <button
              type="button"
              onClick={() => {
                setEmail(demo.email);
                setSecret(demo.password);
              }}
              className="mt-4 w-full rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-xs text-muted transition hover:border-primary hover:text-primary-ink"
            >
              <span className="font-semibold">{t('login.demo')}</span>{' '}
              <span className="font-mono">{demo.email}</span> /{' '}
              <span className="font-mono">{demo.password}</span>
            </button>
          )}
        </div>
      </main>
      <InstallAppChip />
    </div>
  );
}
