/** URL of the business web app (linked from the backoffice). */
export const APP_URL =
  (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';

/** Demo credentials shown on the login page in development builds only. */
export const DEMO_ADMIN = import.meta.env.DEV
  ? { email: 'admin@solvia.app', password: 'Password123!' }
  : null;
