'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/renderer');

function makeItem(overrides = {}) {
  return {
    name: 'Test Region',
    title: null,
    description: null,
    filename: 'test.http',
    line: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    method: 'GET',
    url: 'https://api.example.com/test',
    statusCode: 200,
    statusMessage: 'OK',
    durationMs: 100,
    requestHeaders: { 'Content-Type': 'application/json' },
    requestBody: null,
    responseHeaders: { 'content-type': 'application/json' },
    responseBody: { result: 'ok' },
    testResults: [{ message: 'status == 200', status: 'SUCCESS', displayMessage: null, errorType: null }],
    testsSuccess: 1,
    testsFailed: 0,
    testsErrored: 0,
    testsSkipped: 0,
    ...overrides
  };
}

// ── Basic HTML structure ──────────────────────────────────────────────────────

test('render: output starts with <!DOCTYPE html>', () => {
  const html = render('Test Report', [makeItem()]);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
});

test('render: output contains report title', () => {
  const html = render('My API Report', [makeItem()]);
  assert.ok(html.includes('My API Report'));
});

test('render: output contains inlined <style> block', () => {
  const html = render('Test', [makeItem()]);
  assert.ok(html.includes('<style>'));
  assert.ok(html.includes('</style>'));
  // Style block is non-empty
  const styleContent = html.match(/<style>([\s\S]+?)<\/style>/)?.[1] || '';
  assert.ok(styleContent.length > 100);
});

test('render: output contains inlined <script> block', () => {
  const html = render('Test', [makeItem()]);
  assert.ok(html.includes('<script>'));
  // Script block contains filter logic
  assert.ok(html.includes('applyFilters'));
});

test('render: no external CDN links', () => {
  const html = render('Test', [makeItem()]);
  assert.ok(!html.includes('cdn.'), 'Should not reference any CDN');
  assert.ok(!html.includes('stylesheet" href="http'), 'Should not load external CSS');
});

// ── Hero stats ────────────────────────────────────────────────────────────────

test('render: hero shows correct request count', () => {
  const items = [makeItem(), makeItem(), makeItem()];
  const html = render('Test', items);
  // Total requests = 3
  assert.ok(html.includes('>3<'));
});

test('render: hero shows correct passed count', () => {
  const html = render('Test', [makeItem({ testsSuccess: 2, testsFailed: 0, testsErrored: 0, testsSkipped: 0 })]);
  assert.ok(html.includes('>2<'));
});

test('render: hero shows duration in seconds', () => {
  const html = render('Test', [makeItem({ durationMs: 1500 })]);
  assert.ok(html.includes('1.50s'));
});

// ── Security — header masking is done in httpyac.config.js, not renderer ──────

test('render: renders Authorization header as passed in (masking is config responsibility)', () => {
  // The renderer renders what it receives — masking happens in httpyac.config.js
  // If Authorization is already masked as *** it should appear as ***
  const item = makeItem({ requestHeaders: { Authorization: '***' } });
  const html = render('Test', [item]);
  assert.ok(html.includes('***'), 'Masked Authorization should appear as ***');
});

// ── Empty state ───────────────────────────────────────────────────────────────

test('render: handles empty items array', () => {
  const html = render('Empty Report', []);
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('Empty Report'));
  assert.ok(html.includes('>0<'));
});

// ── XSS prevention ───────────────────────────────────────────────────────────

test('render: escapes HTML in region name', () => {
  const item = makeItem({ name: '<script>alert("xss")</script>' });
  const html = render('Test', [item]);
  assert.ok(!html.includes('<script>alert("xss")</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('render: escapes HTML in URL', () => {
  const item = makeItem({ url: 'https://api.example.com/<evil>' });
  const html = render('Test', [item]);
  assert.ok(!html.includes('<evil>'));
  assert.ok(html.includes('&lt;evil&gt;'));
});
