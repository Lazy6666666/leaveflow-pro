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
  ["remotion", ["remotion", "@remotion"]],
  ["date-lucide", ["date-fns", "lucide-react"]],
];

const getNodeModulePackageName = (id: string) => {
  const normalizedId = id.replaceAll("\\", "/");
  const nodeModulesPath = "/node_modules/";
  const nodeModulesIndex = normalizedId.lastIndexOf(nodeModulesPath);

  if (nodeModulesIndex === -1) {
    return null;
  }

  const packagePath = normalizedId.slice(nodeModulesIndex + nodeModulesPath.length);
  const [scopeOrName, scopedName] = packagePath.split("/");

  if (!scopeOrName) {
    return null;
  }

  if (scopeOrName.startsWith("@") && scopedName) {
    return `${scopeOrName}/${scopedName}`;
  }

  return scopeOrName;
};

const manualChunks = (id: string) => {
  if (!id.includes("node_modules")) {
    return;
  }

  const packageName = getNodeModulePackageName(id);

  if (!packageName) {
    return "vendor";
  }

  for (const [chunkName, markers] of vendorChunkGroups) {
    if (markers.some((marker) => packageName === marker || packageName.startsWith(`${marker}/`))) {
      return chunkName;
    }
  }

  return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
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
