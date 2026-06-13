import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icon-180.png"],
      manifest: {
        name: "Happy Wife Happy Life",
        short_name: "HWHL",
        description: "Track everything your partner loves — preferences, brands, dates, gifts and reminders.",
        theme_color: "#0b0710",
        background_color: "#0b0710",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-64.png", sizes: "64x64", type: "image/png" },
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            // Google Fonts stylesheets + woff2
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // brand logo sources — stale-while-revalidate keeps the grid fast offline
            urlPattern: /^https:\/\/(img\.logo\.dev|logo\.clearbit\.com|www\.google\.com|icon\.horse)\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "brand-logos", expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
});
