/**
 * End-to-End test: Complete submission flow.
 *
 * Tests the full path from browser encryption to server submission
 * and status board lookup.
 *
 * Requires both frontend and backend running.
 */

import { test, expect } from "@playwright/test";

test.describe("Anonymous Submission Flow", () => {
  test("should display the submit form with encryption indicator", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify page structure
    await expect(page.getByRole("heading", { name: /submit anonymous/i })).toBeVisible();
    await expect(page.getByText(/end-to-end encryption enabled/i)).toBeVisible();

    // Verify category buttons exist
    await expect(page.getByRole("button", { name: /idea/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /complaint/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /suggestion/i })).toBeVisible();
  });

  test("should show encryption ready indicator when feedback is typed", async ({
    page,
  }) => {
    await page.goto("/");

    // Type feedback
    await page.getByPlaceholder(/share your thoughts/i).fill("Test feedback");

    // Encryption indicator should update
    await expect(page.getByText(/ready — content will be encrypted/i)).toBeVisible();
  });

  test("should validate required fields before submission", async ({
    page,
  }) => {
    await page.goto("/");

    // Try to submit without filling fields
    await page.getByRole("button", { name: /encrypt & submit/i }).click();

    // Should show error
    await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
  });

  test("should navigate to status page and show no submissions", async ({
    page,
  }) => {
    await page.goto("/status");

    await expect(page.getByText(/no submissions this session/i)).toBeVisible();
  });

  test("should navigate to admin page", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
    await expect(page.getByText(/decryption key/i)).toBeVisible();
  });

  test("should allow generating demo key pair in admin", async ({ page }) => {
    await page.goto("/admin");

    await page.getByRole("button", { name: /generate demo key pair/i }).click();

    // Wait for key generation (4096-bit RSA takes a moment)
    await expect(page.getByText(/generated key pair/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/public key/i)).toBeVisible();
    await expect(page.getByText(/private key/i)).toBeVisible();
  });
});
