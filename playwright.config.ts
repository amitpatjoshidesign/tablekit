import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: { baseURL: "http://localhost:4322/tablekit/", trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview -w docs -- --port 4322",
    url: "http://localhost:4322/tablekit/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
