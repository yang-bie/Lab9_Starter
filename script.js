(function (root, factory) {
  const api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.Lab9 = api;

  if (root.document) {
    api.startWhenReady(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window, function (root) {
  'use strict';

  const TIMER_LABEL = 'Lab 9 console.time demo';

  class CalculationInputError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'CalculationInputError';
      this.details = details;
    }
  }

  function callConsole(consoleApi, method, ...args) {
    if (consoleApi && typeof consoleApi[method] === 'function') {
      consoleApi[method](...args);
    }
  }

  function parseFiniteNumber(rawValue, fieldName) {
    const normalizedValue = String(rawValue ?? '').trim();

    if (normalizedValue === '') {
      throw new CalculationInputError(`${fieldName} is required`, {
        fieldName,
        rawValue,
      });
    }

    const number = Number(normalizedValue);

    if (!Number.isFinite(number)) {
      throw new CalculationInputError(`${fieldName} must be a finite number`, {
        fieldName,
        rawValue,
      });
    }

    return number;
  }

  function calculateExpression(firstValue, operator, secondValue) {
    const firstNumber = parseFiniteNumber(firstValue, 'First number');
    const secondNumber = parseFiniteNumber(secondValue, 'Second number');

    switch (operator) {
      case '+':
        return firstNumber + secondNumber;
      case '-':
        return firstNumber - secondNumber;
      case '*':
        return firstNumber * secondNumber;
      case '/':
        if (secondNumber === 0) {
          throw new CalculationInputError('Cannot divide by zero', {
            fieldName: 'Second number',
            rawValue: secondValue,
          });
        }
        return firstNumber / secondNumber;
      default:
        throw new CalculationInputError(`Unsupported operator: ${operator}`, {
          operator,
        });
    }
  }

  function handleCalculatorSubmit(event, currentRoot = root) {
    event.preventDefault();

    const doc = currentRoot.document;
    const consoleApi = currentRoot.console;
    const output = doc.querySelector('output');
    const firstInput = doc.querySelector('#first-num');
    const secondInput = doc.querySelector('#second-num');
    const operatorInput = doc.querySelector('#operator');

    try {
      const result = calculateExpression(firstInput.value, operatorInput.value, secondInput.value);
      output.textContent = String(result);
      output.dataset.status = 'success';
      callConsole(consoleApi, 'log', 'Calculator result:', {
        firstValue: firstInput.value,
        operator: operatorInput.value,
        secondValue: secondInput.value,
        result,
      });
    } catch (error) {
      if (error instanceof CalculationInputError) {
        output.textContent = error.message;
        output.dataset.status = 'input-error';
        callConsole(consoleApi, 'warn', 'Caught calculator input error:', error);
      } else {
        output.textContent = 'Unexpected calculator failure';
        output.dataset.status = 'unexpected-error';
        callConsole(consoleApi, 'error', 'Caught unexpected calculator error:', error);
      }
    } finally {
      output.dataset.lastAttempt = new Date().toISOString();
      callConsole(consoleApi, 'log', 'Calculator try/catch/finally cycle complete.');
    }
  }

  function createConsoleDemoHandlers(consoleApi = root.console, doc = root.document) {
    const sampleUser = {
      name: 'Ada Lovelace',
      course: 'CSE 110',
      lab: 9,
      role: 'Console tester',
    };
    const sampleErrors = [
      { id: 1, type: 'Validation', handled: true },
      { id: 2, type: 'Network', handled: false },
      { id: 3, type: 'Render', handled: true },
    ];
    const selectNode = selector => (
      doc && typeof doc.querySelector === 'function'
        ? doc.querySelector(selector)
        : { selector }
    );

    function runTraceDemo() {
      function traceLayerOne() {
        traceLayerTwo();
      }

      function traceLayerTwo() {
        callConsole(consoleApi, 'trace', 'console.trace demo: here is the current call stack.');
      }

      traceLayerOne();
    }

    return {
      'Console Log': () => callConsole(consoleApi, 'log', 'console.log demo:', sampleUser),
      'Console Error': () => callConsole(
        consoleApi,
        'error',
        new Error('console.error demo: simulated report failure.'),
      ),
      'Console Count': () => {
        callConsole(consoleApi, 'count', 'Console count demo');
        callConsole(consoleApi, 'count', 'Console count demo');
      },
      'Console Warn': () => callConsole(
        consoleApi,
        'warn',
        'console.warn demo: this is recoverable, but worth noticing.',
        { severity: 'warning' },
      ),
      'Console Assert': () => callConsole(
        consoleApi,
        'assert',
        sampleErrors.every(item => item.handled),
        'console.assert demo: at least one sample error is still unhandled.',
        sampleErrors,
      ),
      'Console Clear': () => {
        callConsole(consoleApi, 'clear');
        callConsole(consoleApi, 'log', 'console.clear demo: console cleared, then this message was logged.');
      },
      'Console Dir': () => callConsole(consoleApi, 'dir', selectNode('form')),
      'Console dirxml': () => callConsole(consoleApi, 'dirxml', selectNode('main')),
      'Console Group Start': () => {
        callConsole(consoleApi, 'group', 'console.group demo: Lab 9 grouped messages');
        callConsole(consoleApi, 'log', 'This message is inside the opened group.');
      },
      'Console Group End': () => {
        callConsole(consoleApi, 'log', 'Closing the current console group.');
        callConsole(consoleApi, 'groupEnd');
      },
      'Console Table': () => callConsole(consoleApi, 'table', sampleErrors),
      'Start Timer': () => {
        callConsole(consoleApi, 'time', TIMER_LABEL);
        callConsole(consoleApi, 'log', 'Timer started. Click "End Timer" to finish it.');
      },
      'End Timer': () => callConsole(consoleApi, 'timeEnd', TIMER_LABEL),
      'Console Trace': runTraceDemo,
    };
  }

  function setupConsoleButtons(buttons, handlers) {
    buttons.forEach(button => {
      const handler = handlers[button.textContent.trim()];

      if (handler) {
        button.type = 'button';
        button.addEventListener('click', handler);
      }
    });
  }

  function triggerGlobalError(currentRoot = root) {
    currentRoot.setTimeout(() => {
      const missingStatusPanel = currentRoot.document.querySelector('#global-error-status');
      missingStatusPanel.textContent = 'This update triggers a realistic missing-DOM-node error.';
    }, 0);
  }

  function installGlobalErrorHandler(currentRoot = root) {
    const previousOnError = currentRoot.onerror;

    currentRoot.onerror = function (message, source, lineno, colno, error) {
      callConsole(currentRoot.console, 'log', 'Caught global error with window.onerror:', {
        message: String(message),
        source,
        line: lineno,
        column: colno,
        errorName: error ? error.name : 'Error',
      });

      if (
        currentRoot.LAB9_TRACKJS_READY === true
        && currentRoot.TrackJS
        && typeof currentRoot.TrackJS.track === 'function'
      ) {
        try {
          currentRoot.TrackJS.track(error || new Error(String(message)));
        } catch (trackError) {
          callConsole(currentRoot.console, 'error', 'TrackJS reporting failed:', trackError);
        }
      }

      if (
        currentRoot.LAB9_TRACKJS_READY === true
        && typeof previousOnError === 'function'
      ) {
        previousOnError.call(currentRoot, message, source, lineno, colno, error);
      }

      return false;
    };
  }

  function setupApp(currentRoot = root) {
    const doc = currentRoot.document;
    const form = doc.querySelector('form');
    const errorBtns = Array.from(doc.querySelectorAll('#error-btns > button'));
    const globalErrorBtn = errorBtns.find(button => (
      button.textContent.trim() === 'Trigger a Global Error'
    ));

    if (form) {
      form.addEventListener('submit', event => handleCalculatorSubmit(event, currentRoot));
    }

    setupConsoleButtons(
      errorBtns,
      createConsoleDemoHandlers(currentRoot.console, doc),
    );

    if (globalErrorBtn) {
      globalErrorBtn.type = 'button';
      globalErrorBtn.addEventListener('click', () => triggerGlobalError(currentRoot));
    }

    installGlobalErrorHandler(currentRoot);
  }

  function startWhenReady(currentRoot = root) {
    if (currentRoot.document.readyState === 'loading') {
      currentRoot.document.addEventListener('DOMContentLoaded', () => setupApp(currentRoot));
    } else {
      setupApp(currentRoot);
    }
  }

  return {
    CalculationInputError,
    calculateExpression,
    createConsoleDemoHandlers,
    handleCalculatorSubmit,
    installGlobalErrorHandler,
    setupApp,
    setupConsoleButtons,
    startWhenReady,
    triggerGlobalError,
  };
});
