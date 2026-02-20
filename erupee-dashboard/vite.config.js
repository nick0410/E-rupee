import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/mint": "http://localhost:3001",
      "/lock": "http://localhost:3001",
      "/upload": "http://localhost:3001"
    }
  }
});
