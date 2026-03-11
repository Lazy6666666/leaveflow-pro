import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // The React SWC plugin is not needed for these unit tests and has been
  // causing Vitest to hang before collection in this workspace.
  plugins: mode === "test" ? [] : [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
    isolate: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
