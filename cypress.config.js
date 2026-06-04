import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  // Retry a failed test up to twice in `cypress run` (CI) to absorb genuine
  // flake; never retry in `cypress open` (local dev) so a flake surfaces
  // immediately while authoring instead of being silently papered over.
  retries: {
    runMode: 2,
    openMode: 0,
  },

  e2e: {
    baseUrl: "http://laravel.local:8038",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
