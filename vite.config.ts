import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [vue()],
    base: `/ccm/${env.VITE_KEY || "wne"}/`,
    server: {
      proxy: env.VITE_BASE_URL
        ? { "/api": { target: env.VITE_BASE_URL, changeOrigin: true } }
        : undefined,
    },
  };
});
