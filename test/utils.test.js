'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, prettyJson, httpStatusClass, regionOutcome, badgeClass, STATUS } = require('../src/utils');

// ── escapeHtml ────────────────────────────────────────────────────────────────

test('escapeHtml: escapes & < > "', () => {
  assert.equal(escapeHtml('<b>"hello" & world</b>'), '&lt;b&gt;&quot;hello&quot; &amp; world&lt;/b&gt;');
});

test('escapeHtml: returns empty string for null', () => {
  assert.equal(escapeHtml(null), '');
});

test('escapeHtml: returns empty string for undefined', () => {
  assert.equal(escapeHtml(undefined), '');
});

test('escapeHtml: leaves safe strings unchanged', () => {
  assert.equal(escapeHtml('hello world'), 'hello world');
});

// ── prettyJson ────────────────────────────────────────────────────────────────

test('prettyJson: pretty prints a JSON string', () => {
  const result = prettyJson('{"a":1}');
  // escapeHtml is applied so quotes become &quot;
  assert.ok(result.includes('&quot;a&quot;'));
  assert.ok(result.includes('1'));
});

test('prettyJson: pretty prints an object', () => {
  const result = prettyJson({ key: 'value' });
  assert.ok(result.includes('key'));
  assert.ok(result.includes('value'));
});

test('prettyJson: returns plain string for non-JSON', () => {
  const result = prettyJson('plain text');
  assert.ok(result.includes('plain text'));
});

test('prettyJson: handles null gracefully', () => {
  const result = prettyJson(null);
  assert.equal(typeof result, 'string');
});

// ── httpStatusClass ───────────────────────────────────────────────────────────

test('httpStatusClass: 200 → success', () => {
  assert.equal(httpStatusClass(200), 'success');
});

test('httpStatusClass: 201 → success', () => {
  assert.equal(httpStatusClass(201), 'success');
});

test('httpStatusClass: 301 → redirect', () => {
  assert.equal(httpStatusClass(301), 'redirect');
});

test('httpStatusClass: 400 → client-error', () => {
  assert.equal(httpStatusClass(400), 'client-error');
});

test('httpStatusClass: 404 → client-error', () => {
  assert.equal(httpStatusClass(404), 'client-error');
});

test('httpStatusClass: 500 → server-error', () => {
  assert.equal(httpStatusClass(500), 'server-error');
});

test('httpStatusClass: null/undefined → unknown', () => {
  assert.equal(httpStatusClass(null), 'unknown');
  assert.equal(httpStatusClass(undefined), 'unknown');
  assert.equal(httpStatusClass(0), 'unknown');
});

// ── regionOutcome ─────────────────────────────────────────────────────────────

test('regionOutcome: error when testsErrored > 0', () => {
  assert.equal(regionOutcome({ testsErrored: 1, testsFailed: 0, testsSkipped: 0, testsSuccess: 0 }), 'error');
});

test('regionOutcome: failed when testsFailed > 0 and no errors', () => {
  assert.equal(regionOutcome({ testsErrored: 0, testsFailed: 1, testsSkipped: 0, testsSuccess: 0 }), 'failed');
});

test('regionOutcome: skipped when only skipped tests', () => {
  assert.equal(regionOutcome({ testsErrored: 0, testsFailed: 0, testsSkipped: 1, testsSuccess: 0 }), 'skipped');
});

test('regionOutcome: passed when all zero', () => {
  assert.equal(regionOutcome({ testsErrored: 0, testsFailed: 0, testsSkipped: 0, testsSuccess: 0 }), 'passed');
});

test('regionOutcome: passed when only successes', () => {
  assert.equal(regionOutcome({ testsErrored: 0, testsFailed: 0, testsSkipped: 0, testsSuccess: 5 }), 'passed');
});

test('regionOutcome: error takes priority over failed', () => {
  assert.equal(regionOutcome({ testsErrored: 1, testsFailed: 1, testsSkipped: 0, testsSuccess: 0 }), 'error');
});

test('regionOutcome: not skipped when has successes too', () => {
  assert.equal(regionOutcome({ testsErrored: 0, testsFailed: 0, testsSkipped: 1, testsSuccess: 1 }), 'passed');
});

// ── badgeClass ────────────────────────────────────────────────────────────────

test('badgeClass: SUCCESS → badge-pass', () => {
  assert.equal(badgeClass(STATUS.SUCCESS), 'badge-pass');
});

test('badgeClass: FAILED → badge-fail', () => {
  assert.equal(badgeClass(STATUS.FAILED), 'badge-fail');
});

test('badgeClass: ERROR → badge-error', () => {
  assert.equal(badgeClass(STATUS.ERROR), 'badge-error');
});

test('badgeClass: SKIPPED → badge-skip', () => {
  assert.equal(badgeClass(STATUS.SKIPPED), 'badge-skip');
});

test('badgeClass: unknown status → badge-skip (fallback)', () => {
  assert.equal(badgeClass('UNKNOWN'), 'badge-skip');
});
