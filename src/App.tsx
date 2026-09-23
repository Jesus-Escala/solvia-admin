import { Button, EmptyState, Page } from '@/ui';
import { Link, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AdminShell } from './components/AdminShell';
import { useI18n } from './i18n/I18nProvider';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { TenantDetailPage } from './pages/TenantDetailPage';
import { TenantsPage } from './pages/TenantsPage';
import { AccessRequestsPage } from './pages/AccessRequestsPage';

function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Page>
      <EmptyState
        title={t('notFound.title')}
        action={
          <Link to="/">
            <Button variant="secondary">{t('notFound.back')}</Button>
          </Link>
        }
      />
    </Page>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AdminShell />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/:id" element={<TenantDetailPage />} />
        <Route path="requests" element={<AccessRequestsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
