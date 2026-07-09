import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Look for tests inside the tests folder.
  testDir: './tests',

  // Recognise JavaScript files ending in .spec.js.
  testMatch: '**/*.spec.js',

  // Maximum time allowed for each test.
  timeout: 60000,

  // Run one test at a time.
  fullyParallel: false,
  workers: 1,

  reporter: [
    ['list'],

    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never'
      }
    ]
  ],

  use: {
    // Display the browser while the test runs.
    headless: false,

    viewport: {
      width: 1280,
      height: 720
    },

    // Record every test for your portfolio.
    video: {
      mode: 'on',

      size: {
        width: 1280,
        height: 720
      }
    },

    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',

      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
