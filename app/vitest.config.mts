import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        inline: [
          "@base-ui/react",
          "@base-ui/utils",
          "react",
          "react-dom",
          "lucide-react",
          "recharts",
          "framer-motion",
          "motion",
          "motion-dom",
          "motion-utils",
        ],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // Use mocks that return lightweight stubs (no React.useContext)
      "lucide-react": path.resolve(__dirname, "./__mocks__/lucide-react.tsx"),
      "recharts": path.resolve(__dirname, "./__mocks__/recharts.tsx"),
      "react": path.resolve(__dirname, "../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
});
