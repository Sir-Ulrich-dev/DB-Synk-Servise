const { test, expect } = require('@playwright/test');
const path = require('path');

const calculatorUrl = 'file://' + path.resolve(__dirname, '../../docs/calculator.html');

test.describe('Calculator e2e', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(calculatorUrl);
    // ждём появления дисплея
    await page.waitForSelector('#result');
  });

  test('initial display shows 0', async ({ page }) => {
    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('0');
  });

  test('2 + 3 = 5', async ({ page }) => {
    await page.click('#btn-2');
    await page.click('#btn-add');
    await page.click('#btn-3');
    await page.click('#btn-eq');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('5');
  });

  test('9 - 4 = 5', async ({ page }) => {
    await page.click('#btn-9');
    await page.click('#btn-sub');
    await page.click('#btn-4');
    await page.click('#btn-eq');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('5');
  });

  test('6 * 7 = 42', async ({ page }) => {
    await page.click('#btn-6');
    await page.click('#btn-mul');
    await page.click('#btn-7');
    await page.click('#btn-eq');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('42');
  });

  test('8 / 2 = 4', async ({ page }) => {
    await page.click('#btn-8');
    await page.click('#btn-div');
    await page.click('#btn-2');
    await page.click('#btn-eq');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('4');
  });

  test('AC clears display to 0', async ({ page }) => {
    await page.click('#btn-5');
    await page.click('#btn-add');
    await page.click('#btn-3');
    await page.click('#btn-clear');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('0');
  });

  test('division by zero shows error', async ({ page }) => {
    await page.click('#btn-8');
    await page.click('#btn-div');
    await page.click('#btn-0');
    await page.click('#btn-eq');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('Ошибка');
  });

  test('percent converts 50 to 0.5', async ({ page }) => {
    await page.click('#btn-5');
    await page.click('#btn-0');
    await page.click('#btn-pct');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('0.5');
  });

  test('sign toggles positive to negative', async ({ page }) => {
    await page.click('#btn-4');
    await page.click('#btn-sign');

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('-4');
  });

  test('takes screenshot after calculation', async ({ page }) => {
    await page.click('#btn-1');
    await page.click('#btn-2');
    await page.click('#btn-add');
    await page.click('#btn-8');
    await page.click('#btn-eq');

    await page.screenshot({ path: 'test-results/calculator-result-20.png', fullPage: false });

    const result = await page.locator('#result').textContent();
    expect(result?.trim()).toBe('20');
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    expect(errors).toHaveLength(0);
  });
});
