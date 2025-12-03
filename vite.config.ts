import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(), // react-router vite plugin expects no arguments
    tsconfigPaths(),
    // netlifyPlugin(), // remove to avoid server handler generation
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["recharts", "@nivo/sankey", "@nivo/core"],
  },
  ssr: {
    noExternal: ["recharts", "@nivo/sankey", "@nivo/core"],
  },
  build: {
    sourcemap: false, // silence sourcemap location errors
    // ...existing code...
  },
});
