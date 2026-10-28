/**
 * E2E UI Test for docs/calculator.html via Chrome DevTools Protocol (CDP).
 * Directly drives real Google Chrome, checks console, executes user scenarios,
 * and captures UI screenshots.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const HTML_FILE = path.resolve(__dirname, '../../docs/calculator.html');
const SCREENSHOT_DIR = path.resolve(__dirname, '../test-results');
const SCREENSHOT_PATH = path.join(SCREENSHOT_DIR, 'calculator-e2e-screenshot.png');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          listeners.forEach(fn => fn(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runE2ETests() {
  console.log('=== Starting E2E UI Tests for calculator.html via Chrome DevTools ===');
  console.log(`Chrome binary: ${CHROME_PATH}`);
  console.log(`Target URL: file://${HTML_FILE}`);

  const port = 9333;
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `file://${HTML_FILE}`
  ], { stdio: 'ignore' });

  // Wait for Chrome to start
  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        targets = await res.json();
        if (targets.length > 0) break;
      }
    } catch (e) {
      // Chrome still launching
    }
  }

  if (!targets || targets.length === 0) {
    chromeProcess.kill('SIGKILL');
    throw new Error('Failed to connect to Google Chrome DevTools within timeout');
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log(`Connected to page target: ${pageTarget.title} (${pageTarget.webSocketDebuggerUrl})`);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  const consoleMessages = [];
  const consoleErrors = [];

  client.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args.map(a => a.value ?? a.description ?? '').join(' ');
    consoleMessages.push({ type: params.type, text });
    if (params.type === 'error') {
      consoleErrors.push(text);
    }
  });

  client.on('Runtime.exceptionThrown', (params) => {
    const errorText = params.exceptionDetails.text || params.exceptionDetails.exception?.description || 'Unknown exception';
    consoleErrors.push(errorText);
  });

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  // Helper to evaluate JS in the page
  async function evaluate(expression) {
    const res = await client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  // Helper to click an element by CSS selector
  async function click(selector) {
    const found = await evaluate(`(() => {
      const el = document.querySelector('${selector}');
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (!found) throw new Error(`Element not found for click: ${selector}`);
    await new Promise(r => setTimeout(r, 50));
  }

  let passedTests = 0;
  let totalTests = 0;

  function assertEqual(actual, expected, testName) {
    totalTests++;
    if (actual === expected) {
      console.log(`  ✔ PASS: ${testName} (actual: "${actual}")`);
      passedTests++;
    } else {
      console.error(`  ✘ FAIL: ${testName} (expected "${expected}", got "${actual}")`);
      throw new Error(`Assertion failed in ${testName}`);
    }
  }

  try {
    // Test 1: Page title & initial display
    console.log('\n--- Test Scenario 1: Initial Page State ---');
    const title = await evaluate(`document.title`);
    assertEqual(title, 'DB Sync — Калькулятор', 'Page title is correct');
    const initResult = await evaluate(`document.getElementById('result').textContent.trim()`);
    assertEqual(initResult, '0', 'Initial calculator result is 0');

    // Test 2: Arithmetic scenario: 12 + 8 = 20
    console.log('\n--- Test Scenario 2: Arithmetic (12 + 8 = 20) ---');
    await click('#btn-1');
    await click('#btn-2');
    await click('#btn-add');
    await click('#btn-8');
    await click('#btn-eq');

    const sumResult = await evaluate(`document.getElementById('result').textContent.trim()`);
    assertEqual(sumResult, '20', '12 + 8 equals 20');
    const exprText = await evaluate(`document.getElementById('expression').textContent.trim()`);
    assertEqual(exprText, '12 + 8 =', 'Expression displays "12 + 8 ="');

    // Test 3: Take screenshot of calculator with result 20
    console.log('\n--- Test Scenario 3: Screenshot Capture ---');
    const screenshotData = await client.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshotData.data, 'base64'));
    console.log(`  ✔ Screenshot saved to: ${SCREENSHOT_PATH}`);
    totalTests++;
    passedTests++;

    // Test 4: Scenario: Multiplication (20 * 3 = 60)
    console.log('\n--- Test Scenario 4: Chained Operation (20 * 3 = 60) ---');
    await click('#btn-mul');
    await click('#btn-3');
    await click('#btn-eq');
    const mulResult = await evaluate(`document.getElementById('result').textContent.trim()`);
    assertEqual(mulResult, '60', '20 * 3 equals 60');

    // Test 5: Scenario: Clear (AC)
    console.log('\n--- Test Scenario 5: Clear (AC) ---');
    await click('#btn-clear');
    const clearedResult = await evaluate(`document.getElementById('result').textContent.trim()`);
    assertEqual(clearedResult, '0', 'Result reset to 0 after AC');
    const clearedExpr = await evaluate(`document.getElementById('expression').textContent.trim()`);
    assertEqual(clearedExpr, '', 'Expression cleared after AC');

    // Test 6: Scenario: Division by zero -> Error
    console.log('\n--- Test Scenario 6: Division by Zero ---');
    await click('#btn-7');
    await click('#btn-div');
    await click('#btn-0');
    await click('#btn-eq');
    const divZeroResult = await evaluate(`document.getElementById('result').textContent.trim()`);
    assertEqual(divZeroResult, 'Ошибка', '7 / 0 produces "Ошибка"');

    // Test 7: Console errors check
    console.log('\n--- Test Scenario 7: Console Errors Inspection ---');
    totalTests++;
    console.log(`  Total console messages captured: ${consoleMessages.length}`);
    if (consoleErrors.length === 0) {
      console.log('  ✔ PASS: Console has 0 errors/exceptions');
      passedTests++;
    } else {
      console.error(`  ✘ FAIL: Found ${consoleErrors.length} console errors:`, consoleErrors);
      throw new Error('Console errors detected');
    }

    console.log(`\n========================================`);
    console.log(`ALL E2E TESTS PASSED: ${passedTests}/${totalTests} GREEN`);
    console.log(`Screenshot: ${SCREENSHOT_PATH}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`========================================\n`);

  } finally {
    client.close();
    chromeProcess.kill('SIGTERM');
  }
}

runE2ETests().catch((err) => {
  console.error('\nE2E Test Execution Error:', err);
  process.exit(1);
});
