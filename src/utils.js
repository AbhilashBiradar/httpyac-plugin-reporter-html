'use strict';

const STATUS = { SUCCESS: 'SUCCESS', FAILED: 'FAILED', ERROR: 'ERROR', SKIPPED: 'SKIPPED' };

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function prettyJson(val) {
  try {
    if (typeof val === 'string') return escapeHtml(JSON.stringify(JSON.parse(val), null, 2));
    if (val !== null && typeof val === 'object') return escapeHtml(JSON.stringify(val, null, 2));
  } catch (err) {
    return escapeHtml(String(err.message || val));
  }
  return escapeHtml(String(val ?? ''));
}

function httpStatusClass(code) {
  if (!code) return 'unknown';
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'redirect';
  if (code >= 400 && code < 500) return 'client-error';
  return 'server-error';
}

// Aligned with CLI source (jsonOutput.ts / testExitCodeInterceptor.ts):
// - error   → any testsErrored > 0
// - failed  → any testsFailed > 0 (and no errors)
// - skipped → only skipped tests, no successes
// - success → failed + errored + skipped === 0  (even if no tests at all)
function regionOutcome(item) {
  if (item.testsErrored > 0) return 'error';
  if (item.testsFailed > 0) return 'failed';
  if (item.testsSkipped > 0 && item.testsSuccess === 0) return 'skipped';
  return 'passed';
}

function badgeClass(status) {
  if (status === STATUS.SUCCESS) return 'badge-pass';
  if (status === STATUS.FAILED) return 'badge-fail';
  if (status === STATUS.ERROR) return 'badge-error';
  return 'badge-skip';
}

module.exports = { STATUS, escapeHtml, prettyJson, httpStatusClass, regionOutcome, badgeClass };
