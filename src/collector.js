'use strict';

const { STATUS } = require('./utils');

/**
 * Extracts a plain result object from a responseLogging interceptor afterLoop callback.
 * Called after the full execute loop — testResults are fully populated at this point.
 *
 * Returns null for regions that should be excluded from the report:
 *  - non-HTTP regions (AMQP, MQTT, gRPC, WebSocket — no URL)
 *  - global/setup regions
 *  - disabled regions
 *
 * @param {import('httpyac').HttpResponse} response
 * @param {import('httpyac').ProcessorContext} context
 * @returns {object|null}
 */
function collect(response, context) {
  const region = context.httpRegion;
  const request = context.request || region.request;

  // Skip non-HTTP regions (AMQP, MQTT, gRPC, WebSocket etc.) — they have no URL
  if (!request?.url) return null;

  // Skip global (setup/teardown) regions — not meaningful in a request report
  if (region.isGlobal?.()) return null;

  // Respect # @no-log — exclude region from report same as terminal output
  if (region.metaData?.noLog) return null;

  // Skip disabled regions
  if (region.metaData?.disabled) return null;

  const testResults = (region.testResults || []).map(t => ({
    message: t.message,
    status: t.status,                             // SUCCESS | FAILED | ERROR | SKIPPED
    displayMessage: t.error?.displayMessage || null,
    errorType: t.error?.errorType || null,
  }));

  // Align with CLI source: a region is "success" only when failed+errored+skipped are all zero
  const testsFailed  = testResults.filter(t => t.status === STATUS.FAILED).length;
  const testsErrored = testResults.filter(t => t.status === STATUS.ERROR).length;
  const testsSkipped = testResults.filter(t => t.status === STATUS.SKIPPED).length;
  const testsSuccess = testResults.filter(t => t.status === STATUS.SUCCESS).length;

  // Canonical name resolution (mirrors jsonOutput.ts)
  const name = (region.metaData?.name && String(region.metaData.name)) || region.symbol?.name || '';

  // Timestamp: reconstruct absolute ISO time from performance.now() origin + region start
  // Falls back to current time if processedHttpRegion timing is unavailable
  const processedRegion = context.processedHttpRegions?.find(r => r.id === region.id);
  const timestamp = processedRegion?.start != null
    ? new Date(performance.timeOrigin + processedRegion.start).toISOString()
    : new Date().toISOString();

  const durationMs = processedRegion?.duration != null
    ? Math.round(processedRegion.duration)
    : (response.timings?.total ?? null);

  return {
    // Identity
    name,
    title:       (region.metaData?.title && String(region.metaData.title))       || null,
    description: (region.metaData?.description && String(region.metaData.description)) || null,
    filename:    context.httpFile?.fileName ? String(context.httpFile.fileName) : null,
    line:        region.symbol?.startLine ?? null,
    timestamp,

    // Request
    method:          (request?.method || 'GET').toUpperCase(),
    url:             request?.url || '',
    requestHeaders:  request?.headers || {},
    requestBody:     (typeof request?.body === 'string' || Buffer.isBuffer(request?.body))
                       ? String(request.body)
                       : null,

    // Response
    statusCode:      response.statusCode,
    statusMessage:   response.statusMessage || '',
    durationMs,
    responseHeaders: response.headers || {},
    responseBody:    response.parsedBody ?? response.body,

    // Test results
    testResults,
    testsSuccess,
    testsFailed,
    testsErrored,
    testsSkipped,
  };
}

module.exports = { collect };
