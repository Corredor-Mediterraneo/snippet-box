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

test.describe('Advanced Search & Help & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
    await page.waitForSelector('.navbar', { timeout: 10000 });
    // Wait for snippets to load so SearchBar renders
    await page.waitForTimeout(3000);
  });

  test('Advanced search button exists', async ({ page }) => {
    const advancedBtn = page.locator('button:has-text("Advanced")');
    const count = await advancedBtn.count();
    expect(count, 'Advanced button should exist').toBeGreaterThan(0);
  });

  test('Search help button exists', async ({ page }) => {
    const helpBtn = page.locator('button[title="Search help"]');
    const count = await helpBtn.count();
    expect(count, 'Help button should exist').toBeGreaterThan(0);
  });

  test('Settings gear icon exists', async ({ page }) => {
    const settingsBtn = page.locator('button[title="Settings"]');
    await expect(settingsBtn).toBeVisible();
  });

  test('Settings modal opens without React error', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    await page.click('button[title="Settings"]');
    await page.waitForTimeout(3000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || err.includes('targetContainer') || err.includes('not a document')
    );
    expect(hasReact310, 'No React error #310').toBe(false);
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Settings modal should be visible').toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Google Drive Backup' })).toBeVisible();
  });

  test('Search suggestions API works', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/snippets/search/suggestions', {
      headers: { 'Content-Type': 'application/json' }
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.data).toHaveProperty('tags');
    expect(data.data).toHaveProperty('languages');
  });

  test('Search suggestions with query filter', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/snippets/search/suggestions', {
      headers: { 'Content-Type': 'application/json' },
      params: { q: 't', type: 'tags' }
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.data.tags)).toBe(true);
  });

  test('Advanced search modal opens', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    const advancedBtn = page.locator('button:has-text("Advanced")').first();
    await advancedBtn.click();
    await page.waitForTimeout(3000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || err.includes('targetContainer') || err.includes('not a document')
    );
    expect(hasReact310, 'No React error #310').toBe(false);
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Advanced search modal should be visible').toBeGreaterThan(0);
    await expect(page.locator('text=Advanced Search')).toBeVisible();
  });

  test('Search help modal opens', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    const helpBtn = page.locator('button[title="Search help"]').first();
    await helpBtn.click();
    await page.waitForTimeout(3000);

    const allErrors = [...consoleErrors, ...pageErrors];
    const hasReact310 = allErrors.some(err => 
      err.includes('310') || err.includes('targetContainer') || err.includes('not a document')
    );
    expect(hasReact310, 'No React error #310').toBe(false);
    const modalVisible = await page.locator('.modal-overlay, .modal-dialog').count();
    expect(modalVisible, 'Help modal should be visible').toBeGreaterThan(0);
    await expect(page.locator('text=Search Help')).toBeVisible();
  });
});
