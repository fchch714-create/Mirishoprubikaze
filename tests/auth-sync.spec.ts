import { test, expect } from '@playwright/test';

test.describe('Supabase Client-Server Cookie Synchronization & Profile Verification', () => {
  const TEST_EMAIL = 'rubikshopaz@gmail.com';
  const TEST_PASSWORD = 'SecurePassword123!';

  test('should successfully sign in, sync cookies, auto-create admin profile, and access admin dashboard', async ({ page }) => {
    // 1. Go to the login page
    await page.goto('/az/account');

    // 2. Ensure login modal/form is visible
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    // If on signup view, switch to login view
    const switchButton = page.locator('text=Artıq hesabınız var? Daxil olun');
    if (await switchButton.isVisible()) {
      await switchButton.click();
    }

    // 3. Fill in the login credentials
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // 4. Submit login and monitor background API synchronization
    const syncResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/sync') && response.status() === 200
    );
    const meResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/me') && response.status() === 200
    );

    await submitButton.click();

    // 5. Verify backend session sync and profile creation endpoints were successfully called
    const syncResponse = await syncResponsePromise;
    const syncResult = await syncResponse.json();
    expect(syncResult.success).toBe(true);
    expect(syncResult.user.email).toBe(TEST_EMAIL);

    // 6. Verify URL is updated to account dashboard and no guest redirect occurred
    await expect(page).toHaveURL(/\/az\/account/);

    // 7. Verify diagnostic endpoint /api/me returns correct session and admin role
    const meResponse = await meResponsePromise;
    const meResult = await meResponse.json();
    expect(meResult.sessionExists).toBe(true);
    expect(meResult.role).toBe('admin');

    // 8. Navigate to admin dashboard and confirm full access without guest warnings
    await page.goto('/az/admin');
    await expect(page).not.toHaveText('Giriş Məhdudlaşdırılıb');
    await expect(page).toHaveText('Admin Panel');
  });

  test('should gracefully handle guest access on secure routes', async ({ page }) => {
    // 1. Unauthenticated user attempts to access /az/admin
    await page.goto('/az/admin');

    // 2. Verify admin access is restricted and the user is treated as [guest]
    await expect(page).toHaveText('Giriş Məhdudlaşdırılıb');
    await expect(page).toHaveText('[guest]');
  });
});
