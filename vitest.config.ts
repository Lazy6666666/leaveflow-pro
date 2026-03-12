import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || process.env.VITEST === "true" || process.env.NODE_ENV === "test";

  return {
    // The React SWC plugin is not needed for these unit tests and has been
    // causing Vitest to hang before collection in this workspace.
    plugins: isTest ? [] : [react()],
    // Loading the full PostCSS/Tailwind pipeline from /mnt/c makes Vite/Vitest
    // stall before test collection in this workspace. Unit tests here don't need
    // CSS transforms, so keep test mode on a no-op PostCSS config.
    css: isTest
      ? {
          postcss: {
            plugins: [],
          },
        }
      : undefined,
    test: {
      // jsdom currently hangs in this workspace. Keep the default environment
      // on node and let any future DOM-dependent tests opt into jsdom per-file.
      environment: "node",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}", "convex/**/*.{test,spec}.{ts,tsx}"],
      pool: "forks",
      maxWorkers: 1,
      minWorkers: 1,
      isolate: true,
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});
