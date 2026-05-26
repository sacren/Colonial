import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "http://laravel.local:8038",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
