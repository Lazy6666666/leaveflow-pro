// vite.config.ts
import { defineConfig } from "file:///mnt/c/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///mnt/c/Users/NeilEdwardBaja/Desktop/New%20folder/leaveflow-pro/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/mnt/c/Users/NeilEdwardBaja/Desktop/New folder/leaveflow-pro";
var vendorChunkGroups = [
  ["react-vendor", ["react", "react-dom", "react-router-dom"]],
  ["query-convex", ["@tanstack/react-query", "convex", "convex/react-clerk"]],
  ["clerk", ["@clerk"]],
  ["radix-ui", ["@radix-ui"]],
  ["charts-motion", ["recharts", "framer-motion", "embla-carousel-react"]],
  ["stripe-markdown", ["@stripe", "react-markdown"]],
  ["remotion", ["remotion", "@remotion"]],
  ["date-lucide", ["date-fns", "lucide-react"]]
];
var getNodeModulePackageName = (id) => {
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
var manualChunks = (id) => {
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
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3e3,
    hmr: {
      overlay: false
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvTmVpbEVkd2FyZEJhamEvRGVza3RvcC9OZXcgZm9sZGVyL2xlYXZlZmxvdy1wcm9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9tbnQvYy9Vc2Vycy9OZWlsRWR3YXJkQmFqYS9EZXNrdG9wL05ldyBmb2xkZXIvbGVhdmVmbG93LXByby92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vbW50L2MvVXNlcnMvTmVpbEVkd2FyZEJhamEvRGVza3RvcC9OZXclMjBmb2xkZXIvbGVhdmVmbG93LXByby92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xyXG5cclxuY29uc3QgdmVuZG9yQ2h1bmtHcm91cHM6IEFycmF5PFtzdHJpbmcsIHN0cmluZ1tdXT4gPSBbXHJcbiAgW1wicmVhY3QtdmVuZG9yXCIsIFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXV0sXHJcbiAgW1wicXVlcnktY29udmV4XCIsIFtcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLCBcImNvbnZleFwiLCBcImNvbnZleC9yZWFjdC1jbGVya1wiXV0sXHJcbiAgW1wiY2xlcmtcIiwgW1wiQGNsZXJrXCJdXSxcclxuICBbXCJyYWRpeC11aVwiLCBbXCJAcmFkaXgtdWlcIl1dLFxyXG4gIFtcImNoYXJ0cy1tb3Rpb25cIiwgW1wicmVjaGFydHNcIiwgXCJmcmFtZXItbW90aW9uXCIsIFwiZW1ibGEtY2Fyb3VzZWwtcmVhY3RcIl1dLFxyXG4gIFtcInN0cmlwZS1tYXJrZG93blwiLCBbXCJAc3RyaXBlXCIsIFwicmVhY3QtbWFya2Rvd25cIl1dLFxyXG4gIFtcInJlbW90aW9uXCIsIFtcInJlbW90aW9uXCIsIFwiQHJlbW90aW9uXCJdXSxcclxuICBbXCJkYXRlLWx1Y2lkZVwiLCBbXCJkYXRlLWZuc1wiLCBcImx1Y2lkZS1yZWFjdFwiXV0sXHJcbl07XHJcblxyXG5jb25zdCBnZXROb2RlTW9kdWxlUGFja2FnZU5hbWUgPSAoaWQ6IHN0cmluZykgPT4ge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWRJZCA9IGlkLnJlcGxhY2VBbGwoXCJcXFxcXCIsIFwiL1wiKTtcclxuICBjb25zdCBub2RlTW9kdWxlc1BhdGggPSBcIi9ub2RlX21vZHVsZXMvXCI7XHJcbiAgY29uc3Qgbm9kZU1vZHVsZXNJbmRleCA9IG5vcm1hbGl6ZWRJZC5sYXN0SW5kZXhPZihub2RlTW9kdWxlc1BhdGgpO1xyXG5cclxuICBpZiAobm9kZU1vZHVsZXNJbmRleCA9PT0gLTEpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcGFja2FnZVBhdGggPSBub3JtYWxpemVkSWQuc2xpY2Uobm9kZU1vZHVsZXNJbmRleCArIG5vZGVNb2R1bGVzUGF0aC5sZW5ndGgpO1xyXG4gIGNvbnN0IFtzY29wZU9yTmFtZSwgc2NvcGVkTmFtZV0gPSBwYWNrYWdlUGF0aC5zcGxpdChcIi9cIik7XHJcblxyXG4gIGlmICghc2NvcGVPck5hbWUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgaWYgKHNjb3BlT3JOYW1lLnN0YXJ0c1dpdGgoXCJAXCIpICYmIHNjb3BlZE5hbWUpIHtcclxuICAgIHJldHVybiBgJHtzY29wZU9yTmFtZX0vJHtzY29wZWROYW1lfWA7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gc2NvcGVPck5hbWU7XHJcbn07XHJcblxyXG5jb25zdCBtYW51YWxDaHVua3MgPSAoaWQ6IHN0cmluZykgPT4ge1xyXG4gIGlmICghaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IHBhY2thZ2VOYW1lID0gZ2V0Tm9kZU1vZHVsZVBhY2thZ2VOYW1lKGlkKTtcclxuXHJcbiAgaWYgKCFwYWNrYWdlTmFtZSkge1xyXG4gICAgcmV0dXJuIFwidmVuZG9yXCI7XHJcbiAgfVxyXG5cclxuICBmb3IgKGNvbnN0IFtjaHVua05hbWUsIG1hcmtlcnNdIG9mIHZlbmRvckNodW5rR3JvdXBzKSB7XHJcbiAgICBpZiAobWFya2Vycy5zb21lKChtYXJrZXIpID0+IHBhY2thZ2VOYW1lID09PSBtYXJrZXIgfHwgcGFja2FnZU5hbWUuc3RhcnRzV2l0aChgJHttYXJrZXJ9L2ApKSkge1xyXG4gICAgICByZXR1cm4gY2h1bmtOYW1lO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGB2ZW5kb3ItJHtwYWNrYWdlTmFtZS5yZXBsYWNlKFwiQFwiLCBcIlwiKS5yZXBsYWNlKFwiL1wiLCBcIi1cIil9YDtcclxufTtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3MsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3VyxTQUFTLG9CQUFvQjtBQUNyWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBS3pDLElBQU0sb0JBQStDO0FBQUEsRUFDbkQsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCLENBQUM7QUFBQSxFQUMzRCxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixVQUFVLG9CQUFvQixDQUFDO0FBQUEsRUFDMUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQUEsRUFDcEIsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO0FBQUEsRUFDMUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLGlCQUFpQixzQkFBc0IsQ0FBQztBQUFBLEVBQ3ZFLENBQUMsbUJBQW1CLENBQUMsV0FBVyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2pELENBQUMsWUFBWSxDQUFDLFlBQVksV0FBVyxDQUFDO0FBQUEsRUFDdEMsQ0FBQyxlQUFlLENBQUMsWUFBWSxjQUFjLENBQUM7QUFDOUM7QUFFQSxJQUFNLDJCQUEyQixDQUFDLE9BQWU7QUFDL0MsUUFBTSxlQUFlLEdBQUcsV0FBVyxNQUFNLEdBQUc7QUFDNUMsUUFBTSxrQkFBa0I7QUFDeEIsUUFBTSxtQkFBbUIsYUFBYSxZQUFZLGVBQWU7QUFFakUsTUFBSSxxQkFBcUIsSUFBSTtBQUMzQixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sY0FBYyxhQUFhLE1BQU0sbUJBQW1CLGdCQUFnQixNQUFNO0FBQ2hGLFFBQU0sQ0FBQyxhQUFhLFVBQVUsSUFBSSxZQUFZLE1BQU0sR0FBRztBQUV2RCxNQUFJLENBQUMsYUFBYTtBQUNoQixXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksWUFBWSxXQUFXLEdBQUcsS0FBSyxZQUFZO0FBQzdDLFdBQU8sR0FBRyxXQUFXLElBQUksVUFBVTtBQUFBLEVBQ3JDO0FBRUEsU0FBTztBQUNUO0FBRUEsSUFBTSxlQUFlLENBQUMsT0FBZTtBQUNuQyxNQUFJLENBQUMsR0FBRyxTQUFTLGNBQWMsR0FBRztBQUNoQztBQUFBLEVBQ0Y7QUFFQSxRQUFNLGNBQWMseUJBQXlCLEVBQUU7QUFFL0MsTUFBSSxDQUFDLGFBQWE7QUFDaEIsV0FBTztBQUFBLEVBQ1Q7QUFFQSxhQUFXLENBQUMsV0FBVyxPQUFPLEtBQUssbUJBQW1CO0FBQ3BELFFBQUksUUFBUSxLQUFLLENBQUMsV0FBVyxnQkFBZ0IsVUFBVSxZQUFZLFdBQVcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHO0FBQzVGLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUVBLFNBQU8sVUFBVSxZQUFZLFFBQVEsS0FBSyxFQUFFLEVBQUUsUUFBUSxLQUFLLEdBQUcsQ0FBQztBQUNqRTtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBLElBQ1g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ047QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
