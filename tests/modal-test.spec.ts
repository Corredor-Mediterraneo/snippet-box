import { test, expect } from '@playwright/test';

test.describe('Modal buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
    await page.waitForSelector('.navbar', { timeout: 10000 });
  });

  test('Backup / Restore modal opens without React error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.click('text=Backup / Restore');
    await page.waitForTimeout(3000);

    // Check for React error #310 in console AND page errors
    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Backup Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('Remove Duplicates modal opens without React error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.click('text=Remove Duplicates');
    await page.waitForTimeout(3000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Deduplicate Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('Import JSON modal opens without React error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    // Click the dropdown toggle directly
    const dropdownToggle = page.locator('.dropdown-toggle:has-text("Import")');
    await dropdownToggle.click();
    await page.waitForTimeout(500);
    
    // Click Import JSON using force click since Bootstrap dropdown may not work
    const importJsonBtn = page.locator('text=Import JSON');
    await importJsonBtn.click({ force: true });
    await page.waitForTimeout(2000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Import JSON Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  });

  test('Import Obsidian modal opens without React error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    const dropdownToggle = page.locator('.dropdown-toggle:has-text("Import")');
    await dropdownToggle.click();
    await page.waitForTimeout(500);
    
    const importObsidianBtn = page.locator('text=Import Obsidian');
    await importObsidianBtn.click({ force: true });
    await page.waitForTimeout(2000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Import Obsidian Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5000 });
  });
});
