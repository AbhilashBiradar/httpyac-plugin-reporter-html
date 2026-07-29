'use strict';

const { collect } = require('./src/collector');
const { render } = require('./src/renderer');

// Keyed by rootDir so multiple projects don't share state,
// but all .http files in the same project accumulate into one report.
const resultsByRoot = new Map();

module.exports = function registerHtmlReporterPlugin(api) {
  const rootKey = String(api.rootDir);

  // Reset results for this root on first hook registration of a new run.
  // httpYac calls this function once per file — the first call initialises
  // the array; subsequent calls for the same root reuse it.
  if (!resultsByRoot.has(rootKey)) {
    resultsByRoot.set(rootKey, []);
  }

  api.hooks.responseLogging.addHook('htmlReporter', async function (response, context) {
    const result = collect(response, context);
    if (!result) return; // non-HTTP / global / disabled / @no-log region

    const results = resultsByRoot.get(rootKey);
    results.push(result);

    const title = api.config?.htmlReporter?.title || 'httpYac HTML Report';
    const outputFileName = api.config?.htmlReporter?.outputFile || 'report.html';
    const outputPath = api.fileProvider.joinPath(api.rootDir, outputFileName);

    await api.fileProvider.writeBuffer(outputPath, Buffer.from(render(title, results), 'utf-8'));
  });
};
