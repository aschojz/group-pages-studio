import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [vue()],
    base: `/ccm/${env.VITE_KEY || "group-pages-studio"}/`,
    server: {
      proxy: env.VITE_BASE_URL
        ? {
            "/logo": {
              target: env.VITE_BASE_URL,
              changeOrigin: true,
            },
            "/api": {
              target: env.VITE_BASE_URL,
              changeOrigin: true,
              cookieDomainRewrite: "",
            },
          }
        : undefined,
    },
  };
});
