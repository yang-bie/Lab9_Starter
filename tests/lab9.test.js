const assert = require('node:assert/strict');
const test = require('node:test');

const lab9 = require('../script.js');

test('calculateExpression evaluates supported arithmetic operations', () => {
  assert.equal(lab9.calculateExpression('6', '+', '4'), 10);
  assert.equal(lab9.calculateExpression('6', '-', '4'), 2);
  assert.equal(lab9.calculateExpression('6', '*', '4'), 24);
  assert.equal(lab9.calculateExpression('6', '/', '4'), 1.5);
});

test('calculateExpression throws a custom error for invalid calculator input', () => {
  assert.throws(
    () => lab9.calculateExpression('', '+', '4'),
    error => error instanceof lab9.CalculationInputError
      && error.name === 'CalculationInputError'
      && error.message === 'First number is required',
  );

  assert.throws(
    () => lab9.calculateExpression('6', '/', '0'),
    error => error instanceof lab9.CalculationInputError
      && error.message === 'Cannot divide by zero',
  );
});

test('createConsoleDemoHandlers wires every non-global starter button to a console demo', () => {
  const calls = [];
  const fakeConsole = {
    log: (...args) => calls.push(['log', ...args]),
    error: (...args) => calls.push(['error', ...args]),
    count: (...args) => calls.push(['count', ...args]),
    warn: (...args) => calls.push(['warn', ...args]),
    assert: (...args) => calls.push(['assert', ...args]),
    clear: (...args) => calls.push(['clear', ...args]),
    dir: (...args) => calls.push(['dir', ...args]),
    dirxml: (...args) => calls.push(['dirxml', ...args]),
    group: (...args) => calls.push(['group', ...args]),
    groupEnd: (...args) => calls.push(['groupEnd', ...args]),
    table: (...args) => calls.push(['table', ...args]),
    time: (...args) => calls.push(['time', ...args]),
    timeEnd: (...args) => calls.push(['timeEnd', ...args]),
    trace: (...args) => calls.push(['trace', ...args]),
  };
  const fakeDocument = {
    querySelector: selector => ({ selector }),
  };

  const handlers = lab9.createConsoleDemoHandlers(fakeConsole, fakeDocument);
  const starterButtonLabels = [
    'Console Log',
    'Console Error',
    'Console Count',
    'Console Warn',
    'Console Assert',
    'Console Clear',
    'Console Dir',
    'Console dirxml',
    'Console Group Start',
    'Console Group End',
    'Console Table',
    'Start Timer',
    'End Timer',
    'Console Trace',
  ];

  assert.deepEqual(Object.keys(handlers).sort(), starterButtonLabels.sort());

  for (const label of starterButtonLabels) {
    handlers[label]();
  }

  const calledMethods = calls.map(call => call[0]);
  assert(calledMethods.includes('log'));
  assert(calledMethods.includes('error'));
  assert(calledMethods.includes('count'));
  assert(calledMethods.includes('warn'));
  assert(calledMethods.includes('assert'));
  assert(calledMethods.includes('clear'));
  assert(calledMethods.includes('dir'));
  assert(calledMethods.includes('dirxml'));
  assert(calledMethods.includes('group'));
  assert(calledMethods.includes('groupEnd'));
  assert(calledMethods.includes('table'));
  assert(calledMethods.includes('time'));
  assert(calledMethods.includes('timeEnd'));
  assert(calledMethods.includes('trace'));
});

test('installGlobalErrorHandler logs the global error and forwards it to TrackJS when available', () => {
  const logged = [];
  const tracked = [];
  const fakeWindow = {
    console: {
      log: (...args) => logged.push(args),
    },
    LAB9_TRACKJS_READY: true,
    TrackJS: {
      track: error => tracked.push(error),
    },
  };
  const error = new Error('Global failure');

  lab9.installGlobalErrorHandler(fakeWindow);
  const shouldContinueDefaultHandling = fakeWindow.onerror('Global failure', 'script.js', 12, 4, error);

  assert.equal(shouldContinueDefaultHandling, false);
  assert.equal(logged[0][0], 'Caught global error with window.onerror:');
  assert.equal(tracked[0], error);
});

test('installGlobalErrorHandler waits for TrackJS installation before forwarding errors', () => {
  const tracked = [];
  const fakeWindow = {
    console: {
      log: () => {},
    },
    LAB9_TRACKJS_READY: false,
    TrackJS: {
      track: error => tracked.push(error),
    },
  };

  lab9.installGlobalErrorHandler(fakeWindow);
  fakeWindow.onerror('Global failure', 'script.js', 12, 4, new Error('Global failure'));

  assert.equal(tracked.length, 0);
});

test('installGlobalErrorHandler waits for TrackJS installation before calling a previous error handler', () => {
  let previousHandlerCalls = 0;
  const fakeWindow = {
    console: {
      log: () => {},
    },
    LAB9_TRACKJS_READY: false,
    onerror: () => {
      previousHandlerCalls += 1;
    },
  };

  lab9.installGlobalErrorHandler(fakeWindow);
  fakeWindow.onerror('Global failure', 'script.js', 12, 4, new Error('Global failure'));

  assert.equal(previousHandlerCalls, 0);
});
