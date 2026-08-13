import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/** @type {import('vite').UserConfig} */
export default defineConfig({
  server: {
    host: true,
    port: Number(process.env.PORT || 3000),
    allowedHosts: true,
    cors: {
      preflightContinue: true,
    },
    warmup: {
      clientFiles: ["./app/entry.client.jsx"],
    },
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  ssr: {
    noExternal: ["@shopify/polaris", "@shopify/app-bridge-react"],
  },
  optimizeDeps: {
    include: ["@shopify/polaris", "@shopify/app-bridge-react"],
  },
});
