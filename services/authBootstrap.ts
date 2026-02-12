import { getSupabaseProjectUrl } from './supabaseClient';

export type StoredAuthUser = {
  id: string;
  email?: string;
};

export type StoredSession = {
  access_token: string;
  refresh_token?: string;
  user: StoredAuthUser;
};

function getProjectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    // <ref>.supabase.co
    const ref = hostname.split('.')[0];
    return ref || null;
  } catch {
    return null;
  }
}

function getAuthStorageKey(projectRef: string): string {
  // supabase-js v2 default key format
  return `sb-${projectRef}-auth-token`;
}

function getCurrentAuthStorageKey(): string | null {
  try {
    const effectiveUrl = getSupabaseProjectUrl();
    const ref = getProjectRefFromUrl(effectiveUrl);
    if (!ref) return null;
    return getAuthStorageKey(ref);
  } catch {
    const rawEnvUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
    const ref = getProjectRefFromUrl(rawEnvUrl);
    if (!ref) return null;
    return getAuthStorageKey(ref);
  }
}

export function readStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getCurrentAuthStorageKey();
    if (!key) return null;
    const value = window.localStorage.getItem(key);
    if (!value) return null;

    const parsed = JSON.parse(value);
    // supabase-js stores { currentSession: {...}, expiresAt: ... } in some versions,
    // and in others it stores the session directly.
    const session = parsed?.currentSession ?? parsed;

    if (!session?.access_token || !session?.user?.id) return null;

    return {
      access_token: String(session.access_token),
      refresh_token: session.refresh_token ? String(session.refresh_token) : undefined,
      user: {
        id: String(session.user.id),
        email: session.user.email ? String(session.user.email) : undefined,
      },
    };
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getCurrentAuthStorageKey();
    if (!key) return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getEffectiveSupabaseBaseUrlForDebug(): string {
  // Helpful when debugging: shows whether we are using proxy (localhost) or real project URL.
  try {
    return getSupabaseProjectUrl();
  } catch {
    return '(unconfigured)';
  }
}
