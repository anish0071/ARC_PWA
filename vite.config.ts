import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const supabaseTarget = env.VITE_SUPABASE_URL;

    const supabaseProxies = supabaseTarget
      ? {
          // Proxy the standard Supabase endpoints in dev so the browser only talks to localhost.
          // This avoids browser-side blocking of *.supabase.co.
          '/auth': {
            target: supabaseTarget,
            changeOrigin: true,
            secure: true,
          },
          '/rest': {
            target: supabaseTarget,
            changeOrigin: true,
            secure: true,
          },
          '/storage': {
            target: supabaseTarget,
            changeOrigin: true,
            secure: true,
          },
          '/functions': {
            target: supabaseTarget,
            changeOrigin: true,
            secure: true,
          },
          // Realtime is usually WebSocket-based; keep it here for completeness.
          '/realtime': {
            target: supabaseTarget,
            changeOrigin: true,
            secure: true,
            ws: true,
          },
        }
      : undefined;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: supabaseProxies,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
