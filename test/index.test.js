'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ── Mock httpYac api ──────────────────────────────────────────────────────────

function createMockApi(rootDir = '/project') {
  const hooks = {};
  return {
    rootDir,
    config: {},
    hooks: {
      responseLogging: {
        addHook: (id, fn) => { hooks[id] = fn; }
      }
    },
    fileProvider: {
      joinPath: (...parts) => parts.join('/'),
      writeBuffer: async () => {},
      fsPath: (p) => p,
    },
    _getHook: (id) => hooks[id],
  };
}

function createMockContext({ url = 'https://api.example.com/test', noLog = false, isGlobal = false } = {}) {
  return {
    httpRegion: {
      request: { url, method: 'GET', headers: {} },
      metaData: { noLog },
      isGlobal: () => isGlobal,
      symbol: { name: 'test', startLine: 1 },
      testResults: [{ message: 'test 1', status: 'SUCCESS' }],
    },
    httpFile: { fileName: 'test.http' },
    processedHttpRegions: [],
    request: { url, method: 'GET', headers: {} },
  };
}

function createMockResponse() {
  return {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    parsedBody: { ok: true },
    timings: { total: 50 },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('plugin: registers responseLogging hook on activation', () => {
  // Reset module cache to get fresh resultsByRoot Map
  delete require.cache[require.resolve('../index')];
  const plugin = require('../index');
  const api = createMockApi();
  plugin(api);
  assert.ok(typeof api._getHook('htmlReporter') === 'function', 'htmlReporter hook should be registered');
});

test('plugin: collects results across multiple files in same project', async () => {
  delete require.cache[require.resolve('../index')];
  const plugin = require('../index');

  const writtenReports = [];
  const api = createMockApi('/project-multi');
  api.fileProvider.writeBuffer = async (path, buf) => {
    writtenReports.push(buf.toString());
  };

  // Simulate configureHooks called once per file (httpYac behaviour)
  plugin(api); // file 1
  plugin(api); // file 2 — same rootDir

  const hook = api._getHook('htmlReporter');

  // Fire hook for file 1
  await hook(createMockResponse(), createMockContext({ url: 'https://api.example.com/one' }));
  // Fire hook for file 2
  await hook(createMockResponse(), createMockContext({ url: 'https://api.example.com/two' }));

  // Last written report should contain BOTH requests
  const lastReport = writtenReports[writtenReports.length - 1];
  assert.ok(lastReport.includes('https://api.example.com/one'), 'Report should include first file request');
  assert.ok(lastReport.includes('https://api.example.com/two'), 'Report should include second file request');
});

test('plugin: skips @no-log regions', async () => {
  delete require.cache[require.resolve('../index')];
  const plugin = require('../index');

  const writtenReports = [];
  const api = createMockApi('/project-nolog');
  api.fileProvider.writeBuffer = async (path, buf) => {
    writtenReports.push(buf.toString());
  };

  plugin(api);
  const hook = api._getHook('htmlReporter');

  await hook(createMockResponse(), createMockContext({ url: 'https://api.example.com/token', noLog: true }));

  // writeBuffer should NOT have been called — no-log region skipped
  assert.equal(writtenReports.length, 0, '@no-log region should not appear in report');
});

test('plugin: skips global regions', async () => {
  delete require.cache[require.resolve('../index')];
  const plugin = require('../index');

  const writtenReports = [];
  const api = createMockApi('/project-global');
  api.fileProvider.writeBuffer = async (path, buf) => {
    writtenReports.push(buf.toString());
  };

  plugin(api);
  const hook = api._getHook('htmlReporter');

  await hook(createMockResponse(), createMockContext({ isGlobal: true }));

  assert.equal(writtenReports.length, 0, 'Global region should not appear in report');
});

test('plugin: different rootDirs get separate result sets', async () => {
  delete require.cache[require.resolve('../index')];
  const plugin = require('../index');

  const reportsByPath = {};
  function makeApi(rootDir) {
    const api = createMockApi(rootDir);
    api.fileProvider.writeBuffer = async (path, buf) => {
      reportsByPath[rootDir] = buf.toString();
    };
    return api;
  }

  const api1 = makeApi('/project-a');
  const api2 = makeApi('/project-b');

  plugin(api1);
  plugin(api2);

  const hook1 = api1._getHook('htmlReporter');
  const hook2 = api2._getHook('htmlReporter');

  await hook1(createMockResponse(), createMockContext({ url: 'https://project-a.com/api' }));
  await hook2(createMockResponse(), createMockContext({ url: 'https://project-b.com/api' }));

  // Each project's report should only contain its own requests
  assert.ok(reportsByPath['/project-a'].includes('project-a.com'), 'Project A report should only have project A requests');
  assert.ok(!reportsByPath['/project-a'].includes('project-b.com'), 'Project A report should not have project B requests');
  assert.ok(reportsByPath['/project-b'].includes('project-b.com'), 'Project B report should only have project B requests');
  assert.ok(!reportsByPath['/project-b'].includes('project-a.com'), 'Project B report should not have project A requests');
});
