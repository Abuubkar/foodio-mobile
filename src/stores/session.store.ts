import { create } from 'zustand';

import { clearQueryCache } from '@/api/queryCache';
import { fetchMe, refreshSession, signOutSession } from '@/features/identity/api/identity.api';
import type { ActiveRole, Person, Session } from '@/features/identity/types/identity.types';
import { CUSTOMER_ROLE, resolveRole } from '@/features/identity/types/identity.types';
import { deregisterPushToken } from '@/features/notifications/api/pushToken.api';
import {
  clearCachedPushToken,
  getCachedPushToken,
} from '@/features/notifications/lib/pushTokenCache';
import {
  getAccessToken,
  getRefreshToken,
  getStoredRole,
  setAccessToken,
  setRefreshToken,
  setStoredRole,
} from '@/services/storage/session.storage';

import { useSavedStore } from './saved.store';

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  person: Person | null;
  role: ActiveRole;
  /** Splash until this is true, so no screen renders against an unknown identity. */
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: ActiveRole) => Promise<void>;
  /**
   * Rotates the token pair. Called by the API client's 401 handler — see
   * `setUnauthorizedHandler` in `@/api/client`. Returns the new access token,
   * or null after signing out if the refresh token is gone or dead.
   */
  refreshTokens: () => Promise<string | null>;
  /**
   * Re-reads who this person is and what they hold. Entitlements are resolved
   * per request (ADR-0007), so the app only learns about a new one by asking —
   * which is what redeeming a joining code needs before the new role can appear
   * in the switcher.
   */
  refreshPerson: () => Promise<void>;
};

const encodeRole = (role: ActiveRole): string =>
  role.kind === 'customer' ? 'customer' : `${role.kind}:${role.restaurantId}`;

/**
 * Tolerates anything: a malformed value simply means customer. That also
 * absorbs the kitchen/delivery rename — a device still holding `serve:rest-1`
 * decodes to nothing and lands on the customer surface, which is where an
 * unrecognised role belongs anyway.
 */
export function decodeRole(value: string | null): ActiveRole | null {
  if (!value) return null;
  if (value === 'customer') return CUSTOMER_ROLE;

  const [kind, restaurantId] = value.split(':');
  if (!restaurantId) return null;
  if (kind !== 'kitchen' && kind !== 'delivery') return null;

  return { kind, restaurantId };
}

const clearStoredSession = () =>
  Promise.all([setAccessToken(null), setRefreshToken(null), setStoredRole(null)]);

export const useSessionStore = create<SessionState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  person: null,
  role: CUSTOMER_ROLE,
  isHydrated: false,

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);

    if (!accessToken || !refreshToken) {
      set({ accessToken: null, refreshToken: null, person: null, isHydrated: true });
      return;
    }

    // Set before fetching: the API client reads the store for the bearer
    // token, and an expired one still lets the client's own 401 handler
    // recover via `refreshTokens` below — this call does not special-case it.
    set({ accessToken, refreshToken });

    const person = await fetchMe().catch(() => null);

    if (!person) {
      await clearStoredSession();
      set({ accessToken: null, refreshToken: null, person: null, isHydrated: true });
      return;
    }

    const role = resolveRole(person, decodeRole(await getStoredRole()));
    set({ person, role, isHydrated: true });
  },

  signIn: async (session) => {
    // Every cached response is keyed by content, not by who asked — without
    // this, a second person on the same device inherits whatever the first
    // person's queries had already cached (see issue: empty Orders tab after
    // switching accounts).
    clearQueryCache();

    await Promise.all([
      setAccessToken(session.accessToken),
      setRefreshToken(session.refreshToken),
      setStoredRole(null),
    ]);
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      person: session.person,
      role: CUSTOMER_ROLE,
    });
  },

  signOut: async () => {
    const refreshToken = get().refreshToken;
    // Best-effort: local sign-out must not wait on, or fail because of, the network.
    if (refreshToken) void signOutSession(refreshToken).catch(() => {});

    // Also fires before state clears below: deregistration needs the still-valid
    // access token the API client's interceptor reads from this store.
    const pushToken = getCachedPushToken();
    if (pushToken) void deregisterPushToken(pushToken).catch(() => {});
    clearCachedPushToken();

    await clearStoredSession();
    clearQueryCache();
    // Saved clips belong to the person, not the device.
    useSavedStore.getState().clear();
    set({ accessToken: null, refreshToken: null, person: null, role: CUSTOMER_ROLE });
  },

  setRole: async (role) => {
    // Never trust a role the person no longer holds.
    const allowed = resolveRole(get().person, role);
    await setStoredRole(encodeRole(allowed));
    set({ role: allowed });
  },

  refreshPerson: async () => {
    const person = await fetchMe().catch(() => null);
    if (person) set({ person });
  },

  refreshTokens: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return null;

    try {
      const session = await refreshSession(refreshToken);
      await Promise.all([
        setAccessToken(session.accessToken),
        setRefreshToken(session.refreshToken),
      ]);
      set({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        person: session.person,
      });
      return session.accessToken;
    } catch {
      // A dead or reused refresh token: the session is over, not retryable.
      await get().signOut();
      return null;
    }
  },
}));

export const selectIsSignedIn = (state: SessionState): boolean => state.person !== null;
