import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const vendorChunkGroups: Array<[string, string[]]> = [
  ["react-vendor", ["react", "react-dom", "react-router-dom"]],
  ["query-convex", ["@tanstack/react-query", "convex", "convex/react-clerk"]],
  ["clerk", ["@clerk"]],
  ["radix-ui", ["@radix-ui"]],
  ["charts-motion", ["recharts", "framer-motion", "embla-carousel-react"]],
  ["stripe-markdown", ["@stripe", "react-markdown"]],
];

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) {
    return;
  }

  for (const [chunkName, markers] of vendorChunkGroups) {
    if (markers.some((marker) => id.includes(`/node_modules/${marker}`) || id.includes(`/node_modules/${marker}/`))) {
      return chunkName;
    }
  }

  return "vendor";
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
