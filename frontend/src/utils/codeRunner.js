// Front-end code execution helpers for quiz coding questions.
//
// JavaScript runs inside a Web Worker so that an infinite loop cannot freeze
// the page. NOTE: this is a prototype teaching aid, not a hardened sandbox.

const RUN_TIMEOUT_MS = 3000

function buildWorkerSource(functionName, code, tests) {
  return `
self.onmessage = function () {
  var results = [];
  var factory;
  try {
    factory = new Function('"use strict";' + ${JSON.stringify(code)} + '\\n;return typeof ' + ${JSON.stringify(functionName)} + " === 'function' ? " + ${JSON.stringify(functionName)} + " : undefined;");
  } catch (error) {
    self.postMessage({ ok: false, error: 'Syntax error: ' + error.message, results: [] });
    return;
  }

  var fn = factory();
  if (typeof fn !== 'function') {
    self.postMessage({ ok: false, error: 'No function named "' + ${JSON.stringify(functionName)} + '" was found. Define it with a function declaration.', results: [] });
    return;
  }

  var tests = ${JSON.stringify(tests)};
  for (var i = 0; i < tests.length; i += 1) {
    var test = tests[i];
    try {
      var actual = fn.apply(null, test.args || []);
      results.push({
        index: i,
        passed: deepEqual(actual, test.expected),
        actual: stringify(actual),
        expected: stringify(test.expected),
      });
    } catch (error) {
      results.push({
        index: i,
        passed: false,
        actual: 'Threw: ' + error.message,
        expected: stringify(test.expected),
      });
    }
  }
  self.postMessage({ ok: true, error: null, results: results });
};

function deepEqual(a, b) {
  if (a === b) return true;
  try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
}
function stringify(value) {
  try { return JSON.stringify(value); } catch (e) { return String(value); }
}
`
}

export function runJavaScript({ code, functionName, tests }) {
  return new Promise((resolve) => {
    let worker
    try {
      const blob = new Blob([buildWorkerSource(functionName, code, tests)], {
        type: 'application/javascript',
      })
      worker = new Worker(URL.createObjectURL(blob))
    } catch {
      resolve({
        ok: false,
        error: 'The browser blocked the code sandbox (Worker unavailable).',
        results: [],
      })
      return
    }

    let settled = false
    const finish = (payload) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.terminate()
      resolve(payload)
    }

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: `Execution timed out after ${RUN_TIMEOUT_MS} ms. Check for an infinite loop.`,
        results: [],
      })
    }, RUN_TIMEOUT_MS)

    worker.onmessage = (event) => finish(event.data)
    worker.onerror = (event) =>
      finish({ ok: false, error: event.message || 'Unknown runtime error.', results: [] })

    worker.postMessage('run')
  })
}

export function checkSql({ query, checks }) {
  const normalized = String(query || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return { ok: false, error: 'Write a query before running it.', results: [] }
  }

  const results = checks.map((check, index) => {
    const missing = (check.required || []).filter(
      (fragment) => !normalized.includes(fragment.toLowerCase()),
    )
    const forbidden = (check.forbidden || []).filter((fragment) =>
      normalized.includes(fragment.toLowerCase()),
    )
    const passed = missing.length === 0 && forbidden.length === 0
    let detail = 'Query matches the required pattern.'
    if (!passed) {
      const parts = []
      if (missing.length) parts.push(`missing: ${missing.join(', ')}`)
      if (forbidden.length) parts.push(`not allowed: ${forbidden.join(', ')}`)
      detail = parts.join(' | ')
    }
    return {
      index,
      passed,
      actual: detail,
      expected: check.description,
    }
  })

  return { ok: true, error: null, results }
}

export function runCodeQuestion(question, code) {
  if (question.language === 'sql') {
    return checkSql({ query: code, checks: question.checks })
  }
  return runJavaScript({
    code,
    functionName: question.functionName,
    tests: question.tests,
  })
}

export function didCodePass(result) {
  return Boolean(result && result.ok && result.results.length > 0 && result.results.every((r) => r.passed))
}
