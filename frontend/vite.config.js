import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    // Get rid of the CORS error
    proxy: {
      '/api': {
        target: 'https://threads-eu3f.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },
  },
  // Add this to specify the loader for JSX files

  esbuild: {
    jsxInject: "",
  },
});
