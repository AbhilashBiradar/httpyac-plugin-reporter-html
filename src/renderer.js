'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { escapeHtml, prettyJson, httpStatusClass, regionOutcome, badgeClass } = require('./utils');

const styles = fs.readFileSync(path.join(__dirname, 'template/styles.css'), 'utf-8');
const clientJs = fs.readFileSync(path.join(__dirname, 'template/client.js'), 'utf-8');

function renderHeaderRows(headers) {
  const rows = Object.entries(headers || {})
    .map(([k, v]) => `<tr><td class="hk">${escapeHtml(k)}</td><td>${escapeHtml(String(v ?? ''))}</td></tr>`)
    .join('');
  return rows || '<tr><td colspan="2" class="empty">—</td></tr>';
}

function renderTestBadges(testResults) {
  return testResults.map(t => {
    const detail = t.displayMessage ? ` — ${escapeHtml(t.displayMessage)}` : '';
    const errorType = t.errorType ? ` [${escapeHtml(t.errorType)}]` : '';
    return `<span class="badge ${badgeClass(t.status)}" title="${escapeHtml(t.status)}${errorType}">`
      + `${escapeHtml(t.message)}${detail}`
      + `</span>`;
  }).join('');
}

function renderMeta(item) {
  const parts = [];
  if (item.title) parts.push(`<span class="meta-title">${escapeHtml(item.title)}</span>`);
  if (item.description) parts.push(`<span class="meta-desc">${escapeHtml(item.description)}</span>`);
  if (item.filename) {
    const short = item.filename.split('/').pop();
    const lineRef = item.line != null ? `:${item.line + 1}` : '';
    parts.push(`<span class="meta-file" title="${escapeHtml(item.filename)}">${escapeHtml(short)}${lineRef}</span>`);
  }
  if (item.timestamp) parts.push(`<span class="meta-ts">${escapeHtml(item.timestamp)}</span>`);
  return parts.length ? `<div class="meta-row">${parts.join('')}</div>` : '';
}

function renderCard(item, idx) {
  const sc = httpStatusClass(item.statusCode);
  const outcome = regionOutcome(item);

  const statusSuffix = item.statusMessage ? ' ' + escapeHtml(item.statusMessage) : '';
  const statusText = item.statusCode ? `${item.statusCode}${statusSuffix}` : null;
  const statusLabel = statusText
    ? `<span class="status-code sc-${sc}">${statusText}</span>`
    : '<span class="status-code sc-unknown">—</span>';

  const testBadges = renderTestBadges(item.testResults);

  return `
  <div class="card" id="card-${idx}" data-outcome="${outcome}" data-sc="${sc}">
    <div class="card-header" onclick="toggle('card-${idx}')">
      <span class="hbar hbar-${sc}"></span>
      <span class="method">${escapeHtml(item.method)}</span>
      <span class="url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
      ${statusLabel}
      ${item.durationMs != null ? `<span class="duration">${item.durationMs}ms</span>` : ''}
      <span class="outcome-dot dot-${outcome}" title="${outcome}"></span>
      <span class="chevron">▾</span>
    </div>
    <div class="card-body">
      ${item.name ? `<p class="region-name"># ${escapeHtml(item.name)}</p>` : ''}
      ${renderMeta(item)}
      ${testBadges ? `<div class="test-results">${testBadges}</div>` : '<p class="no-tests">No test assertions</p>'}
      <div class="panels">
        <details>
          <summary>Request Headers</summary>
          <table class="header-table"><tbody>${renderHeaderRows(item.requestHeaders)}</tbody></table>
        </details>
        ${item.requestBody ? `
        <details>
          <summary>Request Body</summary>
          <pre class="body-pre"><code>${prettyJson(item.requestBody)}</code></pre>
        </details>` : ''}
        <details>
          <summary>Response Headers</summary>
          <table class="header-table"><tbody>${renderHeaderRows(item.responseHeaders)}</tbody></table>
        </details>
        <details>
          <summary>Response Body</summary>
          <pre class="body-pre"><code>${prettyJson(item.responseBody)}</code></pre>
        </details>
      </div>
    </div>
  </div>`;
}

function render(title, items) {
  const total = items.length;

  // Aligned with CLI (jsonOutput.ts createTestSummary):
  // successRequests = regions where failed + errored + skipped === 0
  const totalPassed  = items.filter(i => regionOutcome(i) === 'passed').length;
  const totalFailed  = items.filter(i => ['failed', 'error'].includes(regionOutcome(i))).length;
  const totalSkipped = items.filter(i => regionOutcome(i) === 'skipped').length;
  const totalDurationMs = items.reduce((sum, i) => sum + (i.durationMs || 0), 0);

  // Test-level totals (mirrors createTestSummary)
  const totalTests   = items.reduce((s, i) => s + i.testResults.length, 0);
  const passedTests  = items.reduce((s, i) => s + i.testsSuccess, 0);
  const failedTests  = items.reduce((s, i) => s + i.testsFailed + i.testsErrored, 0);
  const skippedTests = items.reduce((s, i) => s + i.testsSkipped, 0);

  const cards = items.map((item, idx) => renderCard(item, idx)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(title)}</title>
<style>${styles}</style>
</head>
<body>

<header class="site-header">
  <h1>${escapeHtml(title)}</h1>
  <span class="generated">Generated ${new Date().toISOString()}</span>
</header>

<section class="hero">
  <div class="stat">         <div class="val">${total}</div>         <div class="lbl">Requests</div></div>
  <div class="stat s-pass">  <div class="val">${totalPassed}</div>   <div class="lbl">Passed</div></div>
  <div class="stat s-fail">  <div class="val">${totalFailed}</div>   <div class="lbl">Failed / Error</div></div>
  <div class="stat s-skip">  <div class="val">${totalSkipped}</div>  <div class="lbl">Skipped</div></div>
  <div class="stat s-dur">   <div class="val">${(totalDurationMs / 1000).toFixed(2)}s</div><div class="lbl">Duration</div></div>
  <div class="stat">         <div class="val">${totalTests}</div>     <div class="lbl">Total Tests</div></div>
  <div class="stat s-pass">  <div class="val">${passedTests}</div>   <div class="lbl">Tests Passed</div></div>
  <div class="stat s-fail">  <div class="val">${failedTests}</div>   <div class="lbl">Tests Failed</div></div>
  <div class="stat s-skip">  <div class="val">${skippedTests}</div>  <div class="lbl">Tests Skipped</div></div>
</section>

<div class="filter-bar">
  <input type="search" id="search" placeholder="Search URL, name, file…" oninput="applyFilters()"/>
  <button class="fbtn active" onclick="setFilter('all',this)">All</button>
  <button class="fbtn" onclick="setFilter('passed',this)">Passed</button>
  <button class="fbtn" onclick="setFilter('failed',this)">Failed</button>
  <button class="fbtn" onclick="setFilter('error',this)">Error</button>
  <button class="fbtn" onclick="setFilter('skipped',this)">Skipped</button>
  <button class="fbtn" onclick="setFilter('success',this)">2xx</button>
  <button class="fbtn" onclick="setFilter('redirect',this)">3xx</button>
  <button class="fbtn" onclick="setFilter('client-error',this)">4xx</button>
  <button class="fbtn" onclick="setFilter('server-error',this)">5xx</button>
</div>

<div class="cards" id="cards">
${cards}
</div>

<script>${clientJs}</script>
</body>
</html>`;
}

module.exports = { render };
