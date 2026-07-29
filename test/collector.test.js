'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { collect } = require('../src/collector');

// ── Helper: build a minimal mock context ─────────────────────────────────────

function mockContext({ url = 'https://api.example.com/test', method = 'GET', metaData = {}, testResults = [], isGlobal = false } = {}) {
  return {
    httpRegion: {
      request: { url, method, headers: {}, body: null },
      metaData,
      isGlobal: () => isGlobal,
      symbol: { name: 'testRegion', startLine: 1 },
      testResults,
    },
    httpFile: { fileName: 'test.http' },
    processedHttpRegions: [],
  };
}

function mockResponse({ statusCode = 200, statusMessage = 'OK', headers = {}, body = null } = {}) {
  return {
    statusCode,
    statusMessage,
    headers,
    parsedBody: body,
    body,
    timings: { total: 100 },
  };
}

// ── Skip conditions ───────────────────────────────────────────────────────────

test('collect: returns null when no URL', () => {
  const ctx = mockContext({ url: '' });
  ctx.httpRegion.request.url = '';
  assert.equal(collect(mockResponse(), ctx), null);
});

test('collect: returns null for global region', () => {
  const ctx = mockContext({ isGlobal: true });
  assert.equal(collect(mockResponse(), ctx), null);
});

test('collect: returns null for disabled region', () => {
  const ctx = mockContext({ metaData: { disabled: true } });
  assert.equal(collect(mockResponse(), ctx), null);
});

test('collect: returns null for @no-log region', () => {
  const ctx = mockContext({ metaData: { noLog: true } });
  assert.equal(collect(mockResponse(), ctx), null);
});

// ── Basic collection ──────────────────────────────────────────────────────────

test('collect: returns result object for valid region', () => {
  const ctx = mockContext();
  const result = collect(mockResponse(), ctx);
  assert.ok(result !== null);
  assert.equal(result.url, 'https://api.example.com/test');
  assert.equal(result.method, 'GET');
  assert.equal(result.statusCode, 200);
});

test('collect: uppercases method', () => {
  const ctx = mockContext({ method: 'post' });
  const result = collect(mockResponse(), ctx);
  assert.equal(result.method, 'POST');
});

test('collect: captures filename from httpFile', () => {
  const ctx = mockContext();
  const result = collect(mockResponse(), ctx);
  assert.equal(result.filename, 'test.http');
});

// ── Test result counting ──────────────────────────────────────────────────────

test('collect: counts testsSuccess correctly', () => {
  const ctx = mockContext({
    testResults: [
      { message: 'test 1', status: 'SUCCESS' },
      { message: 'test 2', status: 'SUCCESS' },
      { message: 'test 3', status: 'FAILED' },
    ]
  });
  const result = collect(mockResponse(), ctx);
  assert.equal(result.testsSuccess, 2);
  assert.equal(result.testsFailed, 1);
  assert.equal(result.testsErrored, 0);
  assert.equal(result.testsSkipped, 0);
  assert.equal(result.testResults.length, 3);
});

test('collect: handles empty testResults', () => {
  const ctx = mockContext({ testResults: [] });
  const result = collect(mockResponse(), ctx);
  assert.equal(result.testsSuccess, 0);
  assert.equal(result.testsFailed, 0);
  assert.equal(result.testResults.length, 0);
});

test('collect: maps all 4 test statuses', () => {
  const ctx = mockContext({
    testResults: [
      { message: 'a', status: 'SUCCESS' },
      { message: 'b', status: 'FAILED' },
      { message: 'c', status: 'ERROR' },
      { message: 'd', status: 'SKIPPED' },
    ]
  });
  const result = collect(mockResponse(), ctx);
  assert.equal(result.testsSuccess, 1);
  assert.equal(result.testsFailed, 1);
  assert.equal(result.testsErrored, 1);
  assert.equal(result.testsSkipped, 1);
});

// ── Request body ──────────────────────────────────────────────────────────────

test('collect: captures string request body', () => {
  const ctx = mockContext();
  ctx.httpRegion.request.body = '{"key":"value"}';
  const result = collect(mockResponse(), ctx);
  assert.equal(result.requestBody, '{"key":"value"}');
});

test('collect: requestBody is null when body is object (non-string)', () => {
  const ctx = mockContext();
  ctx.httpRegion.request.body = { key: 'value' };
  const result = collect(mockResponse(), ctx);
  assert.equal(result.requestBody, null);
});

// ── Response body ─────────────────────────────────────────────────────────────

test('collect: prefers parsedBody over body', () => {
  const ctx = mockContext();
  const res = mockResponse({ body: 'raw' });
  res.parsedBody = { parsed: true };
  const result = collect(res, ctx);
  assert.deepEqual(result.responseBody, { parsed: true });
});
