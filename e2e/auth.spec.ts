import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display homepage correctly', async ({ page }) => {
    // Check if homepage loads
    await expect(page).toHaveTitle(/Engineer\.CV/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Engineer.CV')).toBeVisible();
    
    // Check for auth buttons
    await expect(page.getByRole('link', { name: /engineer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /employer/i })).toBeVisible();
  });

  test('should navigate to engineer auth page', async ({ page }) => {
    await page.getByRole('link', { name: /engineer/i }).first().click();
    
    await expect(page).toHaveURL(/\/engineer\/auth/);
    await expect(page.getByText('Engineer Login')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('should navigate to employer auth page', async ({ page }) => {
    await page.getByRole('link', { name: /employer/i }).first().click();
    
    await expect(page).toHaveURL(/\/employer\/auth/);
    await expect(page.getByText('Employer Login')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('should register new engineer', async ({ page }) => {
    await page.goto('/engineer/auth');
    
    // Switch to register mode
    await page.getByText('Register').click();
    
    // Fill registration form
    await page.getByPlaceholder('Full Name').fill('Test Engineer User');
    await page.getByPlaceholder('Email').fill('test-engineer@example.com');
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Confirm Password').fill('TestPass123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/engineer\/dashboard/);
    await expect(page.getByText('Welcome, Test Engineer User')).toBeVisible();
  });

  test('should register new employer', async ({ page }) => {
    await page.goto('/employer/auth');
    
    // Switch to register mode
    await page.getByText('Register').click();
    
    // Fill registration form
    await page.getByPlaceholder('Full Name').fill('Test Employer User');
    await page.getByPlaceholder('Email').fill('test-employer@example.com');
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Confirm Password').fill('TestPass123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/employer\/dashboard/);
    await expect(page.getByText('Welcome, Test Employer User')).toBeVisible();
  });

  test('should login existing engineer', async ({ page }) => {
    await page.goto('/engineer/auth');
    
    // Fill login form
    await page.getByPlaceholder('Email').fill(process.env.E2E_ENGINEER_EMAIL || 'e2e-engineer@example.com');
    await page.getByPlaceholder('Password').fill(process.env.E2E_ENGINEER_PASSWORD || 'E2ETestPass123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/engineer\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should login existing employer', async ({ page }) => {
    await page.goto('/employer/auth');
    
    // Fill login form
    await page.getByPlaceholder('Email').fill(process.env.E2E_EMPLOYER_EMAIL || 'e2e-employer@example.com');
    await page.getByPlaceholder('Password').fill(process.env.E2E_EMPLOYER_PASSWORD || 'E2ETestPass123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/employer\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/engineer/auth');

    // Fill with invalid credentials
    await page.getByPlaceholder('Email').fill('invalid@example.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();

    // Should stay on auth page
    await expect(page).toHaveURL(/\/engineer\/auth/);
  });

  test('should show error when engineer tries to login as employer', async ({ page }) => {
    await page.goto('/employer/auth');

    // Use engineer credentials on employer portal
    await page.getByPlaceholder('Email').fill('engineer@test.com');
    await page.getByPlaceholder('Password').fill('testpass123');

    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show userType mismatch error
    await expect(page.getByText(/this account is registered as an engineer/i)).toBeVisible();

    // Should stay on auth page
    await expect(page).toHaveURL(/\/employer\/auth/);
  });

  test('should show error when employer tries to login as engineer', async ({ page }) => {
    await page.goto('/engineer/auth');

    // Use employer credentials on engineer portal
    await page.getByPlaceholder('Email').fill('employer@test.com');
    await page.getByPlaceholder('Password').fill('testpass123');

    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();

    // Should show userType mismatch error
    await expect(page.getByText(/this account is registered as an employer/i)).toBeVisible();

    // Should stay on auth page
    await expect(page).toHaveURL(/\/engineer\/auth/);
  });

  test('should validate registration form', async ({ page }) => {
    await page.goto('/engineer/auth');
    
    // Switch to register mode
    await page.getByText('Register').click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/engineer/auth');
    
    // Switch to register mode
    await page.getByText('Register').click();
    
    // Fill form with weak password
    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('weak');
    await page.getByPlaceholder('Confirm Password').fill('weak');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should show password strength error
    await expect(page.getByText(/password.*strong/i)).toBeVisible();
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto('/engineer/auth');
    
    // Switch to register mode
    await page.getByText('Register').click();
    
    // Fill form with mismatched passwords
    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('TestPass123!');
    await page.getByPlaceholder('Confirm Password').fill('DifferentPass123!');
    
    // Submit form
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Should show password mismatch error
    await expect(page.getByText(/passwords.*match/i)).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await page.goto('/engineer/auth');
    await page.getByPlaceholder('Email').fill(process.env.E2E_ENGINEER_EMAIL || 'e2e-engineer@example.com');
    await page.getByPlaceholder('Password').fill(process.env.E2E_ENGINEER_PASSWORD || 'E2ETestPass123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/engineer\/dashboard/);
    
    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: /engineer/i })).toBeVisible();
  });

  test('should persist login state on page refresh', async ({ page }) => {
    // Login first
    await page.goto('/engineer/auth');
    await page.getByPlaceholder('Email').fill(process.env.E2E_ENGINEER_EMAIL || 'e2e-engineer@example.com');
    await page.getByPlaceholder('Password').fill(process.env.E2E_ENGINEER_PASSWORD || 'E2ETestPass123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/engineer\/dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/\/engineer\/dashboard/);
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/engineer/dashboard');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/engineer\/auth/);
  });
});
