'use strict';

const { collect } = require('./src/collector');
const { render } = require('./src/renderer');

// httpYac calls the exported function directly: pluginFn(api)
// A fresh results array is created per plugin registration — safe across watch-mode re-runs.
module.exports = function registerHtmlReporterPlugin(api) {
  const results = [];

  // responseLogging fires AFTER the full execute loop including all @assert / test blocks.
  // onResponse fires BEFORE assertions — testResults would be empty there.
  api.hooks.responseLogging.addHook('htmlReporter', async function (response, context) {
    const result = collect(response, context);
    if (!result) return; // non-HTTP / global / disabled region

    results.push(result);

    const title = api.config?.htmlReporter?.title || 'httpYac HTML Report';
    const outputFileName = api.config?.htmlReporter?.outputFile || 'report.html';
    const outputPath = api.fileProvider.joinPath(api.rootDir, outputFileName);

    await api.fileProvider.writeBuffer(outputPath, Buffer.from(render(title, results), 'utf-8'));
  });
};
