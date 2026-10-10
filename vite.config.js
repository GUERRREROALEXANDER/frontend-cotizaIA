import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Through the dev proxy the browser only ever talks to the Vite origin, so the
// backend call is same-origin. Forwarding the browser's Origin header made
// Spring reject any host other than localhost:5173 (127.0.0.1, a LAN IP...)
// with "Invalid CORS request"; dropping it keeps backend CORS strict for real
// cross-origin deployments while dev works from any host.
const backendProxy = {
  target: "http://localhost:8080",
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": backendProxy,
      "/actuator": backendProxy,
    },
  },
});
