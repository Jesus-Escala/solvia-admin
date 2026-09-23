import { createApiClient, createTokenStore } from '@/ui';
import type { PlatformAdmin } from './types';

/**
 * Backoffice session, stored under `solvia.admin.*` so it never mixes with a business session.
 * Platform tokens are rejected by the business API (and vice versa).
 */
export const tokenStorage = createTokenStore<PlatformAdmin>('solvia.admin');

/** API client of the backoffice (platform admin session, refreshed through `/admin/auth/refresh`). */
export const api = createApiClient({ tokens: tokenStorage, refreshPath: '/admin/auth/refresh' });
