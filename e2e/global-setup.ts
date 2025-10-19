import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Wait for servers to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Create a browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Check if backend is ready
    console.log('⏳ Checking backend health...');
    const backendResponse = await page.request.get('http://localhost:3000/api/health');
    if (!backendResponse.ok()) {
      throw new Error('Backend server is not ready');
    }
    console.log('✅ Backend server is ready');

    // Check if frontend is ready
    console.log('⏳ Checking frontend...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend is ready');

    // Create test users for E2E tests
    console.log('⏳ Creating test users...');
    
    // Create engineer test user
    const engineerResponse = await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        email: 'e2e-engineer@example.com',
        password: 'E2ETestPass123!',
        fullName: 'E2E Test Engineer',
        userType: 'engineer'
      }
    });

    if (engineerResponse.ok()) {
      const engineerData = await engineerResponse.json();
      // Store engineer credentials for tests
      process.env.E2E_ENGINEER_EMAIL = 'e2e-engineer@example.com';
      process.env.E2E_ENGINEER_PASSWORD = 'E2ETestPass123!';
      process.env.E2E_ENGINEER_TOKEN = engineerData.data.token;
      console.log('✅ Engineer test user created');
    }

    // Create employer test user
    const employerResponse = await page.request.post('http://localhost:3000/api/auth/register', {
      data: {
        email: 'e2e-employer@example.com',
        password: 'E2ETestPass123!',
        fullName: 'E2E Test Employer',
        userType: 'employer'
      }
    });

    if (employerResponse.ok()) {
      const employerData = await employerResponse.json();
      // Store employer credentials for tests
      process.env.E2E_EMPLOYER_EMAIL = 'e2e-employer@example.com';
      process.env.E2E_EMPLOYER_PASSWORD = 'E2ETestPass123!';
      process.env.E2E_EMPLOYER_TOKEN = employerData.data.token;
      console.log('✅ Employer test user created');
    }

    console.log('✅ E2E test setup completed successfully');

  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
