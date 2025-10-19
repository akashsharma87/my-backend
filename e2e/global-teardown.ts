import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting E2E test cleanup...');

  const browser = await chromium.launch();
  const context = await browser.newContext();

  try {
    // Clean up test data if needed
    console.log('⏳ Cleaning up test data...');

    // You could add cleanup logic here, such as:
    // - Deleting test users
    // - Cleaning up uploaded files
    // - Resetting database state

    console.log('✅ E2E test cleanup completed');

  } catch (error) {
    console.error('❌ E2E test cleanup failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalTeardown;
