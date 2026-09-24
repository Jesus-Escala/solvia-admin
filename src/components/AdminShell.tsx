import {
  Avatar,
  Badge,
  cx,
  Logo,
  MenuItems,
  Popover,
  PreferencesControls,
  ApiError,
  pwaInstall,
  useCanOfferInstall,
} from '@/ui';
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  MonitorDown,
} from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useMe } from '../hooks/queries';
import { useI18n, type TranslationKey } from '../i18n/I18nProvider';
import { APP_URL } from '../lib/config';

const NAV: Array<{ to: string; label: TranslationKey; icon: ReactNode; end?: boolean }> = [
  { to: '/', label: 'nav.overview', icon: <LayoutDashboard />, end: true },
  { to: '/tenants', label: 'nav.tenants', icon: <Building2 /> },
  { to: '/requests', label: 'nav.requests', icon: <Inbox /> },
];

function Sidebar() {
  const { t } = useI18n();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 px-5">
          <NavLink to="/" aria-label="Solvia Admin">
            <Logo />
          </NavLink>
          <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent-ink uppercase">
            {t('common.backoffice')}
          </span>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label={t('nav.section')}>
          <p className="px-3 pt-2 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-muted uppercase">
            {t('nav.section')}
          </p>
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cx(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-active text-sidebar-ink shadow-card ring-1 ring-line'
                        : 'text-sidebar-muted hover:translate-x-0.5 hover:bg-sidebar-active/60 hover:text-sidebar-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-primary"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={cx(
                          '[&>svg]:h-[18px] [&>svg]:w-[18px]',
                          isActive && 'text-primary',
                        )}
                      >
                        {item.icon}
                      </span>
                      {t(item.label)}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="shrink-0 border-t border-line px-5 py-4 text-xs text-sidebar-muted">
          <a
            href={APP_URL}
            target="_blank"
            rel="noreferrer"
            className="mb-2 inline-flex items-center gap-1.5 font-medium text-sidebar-ink hover:text-primary"
          >
            {t('nav.openApp')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p>{t('nav.footer', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { t } = useI18n();
  const { admin, logout } = useAuth();
  const canInstall = useCanOfferInstall();
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Logo />
        <Badge tone="primary">{t('common.backoffice')}</Badge>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <PreferencesControls tourTarget={false} />
        <Popover
          width={240}
          trigger={({ toggle, ref }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-label={t('nav.account')}
              className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 transition hover:bg-surface-3"
            >
              <Avatar name={admin?.name ?? 'Admin'} size="sm" />
              <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
                {admin?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="border-b border-line px-2.5 pt-1 pb-2">
                <p className="truncate text-sm font-semibold">{admin?.name}</p>
                <p className="truncate text-xs text-muted">{admin?.email}</p>
              </div>
              <div className="pt-1">
                <MenuItems
                  close={close}
                  items={[
                    {
                      label: t('pwa.menu'),
                      icon: <MonitorDown />,
                      onSelect: pwaInstall.openGuide,
                      hidden: !canInstall,
                    },
                    {
                      label: t('nav.logout'),
                      icon: <LogOut />,
                      onSelect: logout,
                      danger: true,
                    },
                  ]}
                />
              </div>
            </>
          )}
        </Popover>
      </div>
    </header>
  );
}

/** Phones: the sections as a bottom tab bar. */
function BottomNav() {
  const { t } = useI18n();
  return (
    <nav
      aria-label={t('nav.section')}
      className="grid shrink-0 grid-cols-3 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cx(
              'flex flex-col items-center gap-1 py-2 text-[11px] font-medium [&>svg]:h-5 [&>svg]:w-5',
              isActive ? 'text-primary' : 'text-muted',
            )
          }
        >
          {item.icon}
          {t(item.label)}
        </NavLink>
      ))}
    </nav>
  );
}

/** Backoffice frame: viewport-tall shell where only <main> scrolls (tables use <Page fill>). */
export function AdminShell() {
  const { logout } = useAuth();
  const me = useMe();

  // A token can outlive its admin (e.g. after a data reset): end that session.
  useEffect(() => {
    if (me.error instanceof ApiError && (me.error.status === 401 || me.error.status === 404)) {
      logout();
    }
  }, [me.error, logout]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
