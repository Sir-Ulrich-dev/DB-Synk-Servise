/**
 * Unit tests for Calculator logic (без браузера, через jsdom).
 * Тестирует бизнес-логику калькулятора изолированно.
 *
 * Запуск: node e2e/tests/calculator.unit.test.js
 */

const fs = require('fs');
const path = require('path');

// ─────────────── Минимальный тест-раннер ───────────────
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected)
        throw new Error(`Expected "${expected}", got "${actual}"`);
    },
    toContain(sub) {
      if (!String(actual).includes(String(sub)))
        throw new Error(`Expected "${actual}" to contain "${sub}"`);
    },
    toHaveLength(n) {
      if (actual.length !== n)
        throw new Error(`Expected length ${n}, got ${actual.length}`);
    }
  };
}

// ─────────────── Извлекаем JS-логику калькулятора ───────────────
// Читаем HTML, вырезаем скрипт, запускаем в контексте без DOM
const html = fs.readFileSync(
  path.resolve(__dirname, '../../docs/calculator.html'), 'utf-8'
);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('No <script> block found in calculator.html');

// Эмулируем минимальный DOM для запуска скрипта
const dom = {
  _result: '0',
  _expr: '',
};
const resultEl = { get textContent() { return dom._result; }, set textContent(v) { dom._result = String(v); } };
const exprEl   = { get textContent() { return dom._expr; },   set textContent(v) { dom._expr   = String(v); } };

// Patch document.getElementById + querySelector used by the script
global.document = {
  getElementById: id => {
    if (id === 'result') return resultEl;
    if (id === 'expression') return exprEl;
    return null;
  },
  querySelector: () => ({
    addEventListener: () => {}  // кнопки — слушатели не нужны
  })
};

// Выполняем скрипт (без обработчика кликов)
eval(scriptMatch[1]); // eslint-disable-line no-eval

// Получаем доступ к внутренним функциям через eval-контекст
// Функции handleDigit, handleOp, calculate, handleClear объявлены в скрипте
// и доступны в глобальном контексте после eval

// ─────────────── Тесты ───────────────
console.log('\nCalculator Unit Tests\n');

test('initial display is 0', () => {
  handleClear();
  expect(resultEl.textContent).toBe('0');
});

test('2 + 3 = 5', () => {
  handleClear();
  handleDigit('2');
  handleOp('+');
  handleDigit('3');
  calculate();
  expect(resultEl.textContent).toBe('5');
});

test('9 - 4 = 5', () => {
  handleClear();
  handleDigit('9');
  handleOp('-');
  handleDigit('4');
  calculate();
  expect(resultEl.textContent).toBe('5');
});

test('6 * 7 = 42', () => {
  handleClear();
  handleDigit('6');
  handleOp('*');
  handleDigit('7');
  calculate();
  expect(resultEl.textContent).toBe('42');
});

test('8 / 2 = 4', () => {
  handleClear();
  handleDigit('8');
  handleOp('/');
  handleDigit('2');
  calculate();
  expect(resultEl.textContent).toBe('4');
});

test('division by zero shows Ошибка', () => {
  handleClear();
  handleDigit('8');
  handleOp('/');
  handleDigit('0');
  calculate();
  expect(resultEl.textContent).toBe('Ошибка');
});

test('AC resets display to 0', () => {
  handleDigit('5');
  handleClear();
  expect(resultEl.textContent).toBe('0');
});

test('50% = 0.5', () => {
  handleClear();
  handleDigit('5');
  handleDigit('0');
  handlePercent();
  expect(resultEl.textContent).toBe('0.5');
});

test('sign toggle: 4 -> -4', () => {
  handleClear();
  handleDigit('4');
  handleSign();
  expect(resultEl.textContent).toBe('-4');
});

test('chained: 1 + 2 = 3, then * 4 = 12', () => {
  handleClear();
  handleDigit('1');
  handleOp('+');
  handleDigit('2');
  calculate();
  handleOp('*');
  handleDigit('4');
  calculate();
  expect(resultEl.textContent).toBe('12');
});

test('decimal: 1.5 + 0.5 = 2', () => {
  handleClear();
  handleDigit('1');
  handleDot();
  handleDigit('5');
  handleOp('+');
  handleDigit('0');
  handleDot();
  handleDigit('5');
  calculate();
  expect(resultEl.textContent).toBe('2');
});

test('HTML file exists', () => {
  expect(html).toContain('id="result"');
  expect(html).toContain('id="btn-eq"');
  expect(html).toContain('id="btn-clear"');
});

// ─────────────── Итог ───────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed! ✅');
}
