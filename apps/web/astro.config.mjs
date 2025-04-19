// @ts-check
import { defineConfig, envField } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: import.meta.env.PUBLIC_SITE_URL,
  devToolbar: { enabled: false },
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      enabled: true,
      environment: "local",
      persist: {
        path: "../api/.wrangler/state/v3",
      },
    },
  }),

  output: "server",

  vite: {
    ssr: {
      external: ["node:buffer", "node:events", "node:stream"],
    },
    resolve: {
      // @ts-ignore
      alias: import.meta.env.PROD && {
        "react-dom/server": "react-dom/server.edge",
      },
    },
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
