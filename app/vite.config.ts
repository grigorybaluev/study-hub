import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Installable, offline web app (#189). The service worker precaches the app shell, the KaTeX
    // woff2 fonts and all data (graph, derived, unit bodies per course); the heavy lazy chunks
    // (Plotly and the language engines in Sim-*, sql.js) are cached the first time they load.
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        id: "./",
        name: "Study Hub",
        short_name: "Study Hub",
        description: "A CS Data Science curriculum as a concept graph, with units, maps and review.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "any",
        theme_color: "#0f0e23",
        background_color: "#0f0e23",
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,svg,png,ico,json}"],
        globIgnores: ["**/assets/Sim-*.js"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // hashed file names never change content, so the first copy is good until the next release
            urlPattern: ({ url }) => url.pathname.includes("/assets/"),
            handler: "CacheFirst",
            options: { cacheName: "lazy-assets", expiration: { maxEntries: 80 } },
          },
        ],
      },
    }),
  ],
  base: "./",
});
