import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Keep chunking conservative. Over-aggressive manual chunk splitting can create
// circular chunk dependencies (e.g. vendor <-> react-vendor), which can break
// ESM evaluation order on some CDNs/browsers.
const manualChunks = (id: string) => {
  if (id.includes("node_modules")) {
    return "vendor";
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        // Ensure new deployments take control quickly so clients don't get a stale
        // precached index.html that points at old hashed chunks.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Our app ships a large shared vendor chunk. Workbox defaults to a 2 MiB
        // precache cap, which can fail builds. Raise the cap so staging/prod
        // builds remain deployable while keeping offline installability.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "BALANCE",
        short_name: "BALANCE",
        description: "Mobile Attendance and HR Platform",
        theme_color: "#14b8a6",
        background_color: "#000000",
        display: "standalone",
        start_url: "/attendance",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Our app intentionally has a moderately large shared vendor chunk; keep the
    // warning meaningful by raising the threshold a bit above the default 500kB.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
