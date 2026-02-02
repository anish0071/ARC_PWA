import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

export function getSupabaseProjectUrl(): string {
  // In dev, proxy Supabase through Vite so the browser only talks to localhost.
  // (vite.config.ts proxies /auth, /rest, etc.)
  if (import.meta.env.DEV && typeof window !== "undefined") {
    if (!rawSupabaseUrl) {
      throw new Error(
        "VITE_SUPABASE_URL is missing. In dev you must set VITE_SUPABASE_URL so Vite can proxy /rest to Supabase, or adjust supabaseClient to point directly to your Supabase URL."
      );
    }

    // Provide an escape hatch to bypass the Vite proxy and call Supabase
    // directly from the browser. Useful for debugging when the proxy
    // appears to be returning 404/400 responses.
    const bypass =
      String(import.meta.env.VITE_SUPABASE_BYPASS_PROXY ?? "").toLowerCase() ===
      "true";
    const base = bypass ? rawSupabaseUrl : window.location.origin;
    console.debug("[supabaseClient] dev base URL:", base, {
      bypassProxy: bypass,
    });
    return base;
  }
  if (!rawSupabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
  return rawSupabaseUrl;
}

function withTimeoutFetch(timeoutMs: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (init?.signal) {
        if (init.signal.aborted) {
          controller.abort();
        } else {
          init.signal.addEventListener("abort", () => controller.abort(), {
            once: true,
          });
        }
      }

      const mergedInit: RequestInit = {
        ...init,
        signal: controller.signal,
      };

      return await fetch(input, mergedInit);
    } finally {
      clearTimeout(timeout);
    }
  };
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(getSupabaseProjectUrl(), supabaseAnonKey, {
  auth: {
    // Keep defaults explicit so behavior is predictable.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: withTimeoutFetch(15000),
  },
});
