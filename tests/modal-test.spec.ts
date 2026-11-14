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
    await page.waitForTimeout(2000);

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
    // Check for modal-dialog which is the actual Bootstrap modal container
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
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
    await page.waitForTimeout(2000);

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
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
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

    const dropdownToggle = page.locator('.dropdown-toggle:has-text("Import")');
    await dropdownToggle.click();
    await page.waitForTimeout(500);
    
    const importJsonBtn = page.locator('text=Import JSON');
    await importJsonBtn.click();
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
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
  });

  test('Import SQLite modal opens without React error', async ({ page }) => {
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
    
    const importSqliteBtn = page.locator('text=Import SQLite');
    await importSqliteBtn.click();
    await page.waitForTimeout(2000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Import SQLite Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
  });

  test('Import Markdown modal opens without React error', async ({ page }) => {
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
    
    const importMarkdownBtn = page.locator('text=Import Markdown');
    await importMarkdownBtn.click();
    await page.waitForTimeout(2000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || 
      err.includes('targetContainer') || 
      err.includes('not a document')
    );
    
    if (allErrors.length) {
      console.log('=== Import Markdown Modal Errors ===');
      allErrors.forEach(e => console.log(e));
    }
    
    expect(hasReact310, 'No React error #310').toBe(false);
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
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
    await importObsidianBtn.click();
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
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Modal should be visible').toBeGreaterThan(0);
  });

  test('Import dropdown shows all 4 options', async ({ page }) => {
    const dropdownToggle = page.locator('.dropdown-toggle:has-text("Import")');
    await dropdownToggle.click();
    await page.waitForTimeout(1000);

    const dropdownMenu = page.locator('.dropdown-menu');
    await expect(dropdownMenu).toBeVisible();

    // Check all 4 import options are present
    await expect(page.locator('text=Import JSON')).toBeVisible();
    await expect(page.locator('text=Import SQLite')).toBeVisible();
    await expect(page.locator('text=Import Markdown')).toBeVisible();
    await expect(page.locator('text=Import Obsidian')).toBeVisible();
  });
});
