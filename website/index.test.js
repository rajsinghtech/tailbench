'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadContainsK8sForwardPPS() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function containsK8sForwardPPS(data) {';
  const endMarker = '  var hasK8sForwardPPS = containsK8sForwardPPS(TAILBENCH_DATA);';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'dashboard K8s forwarding predicate is missing');
  assert.notEqual(end, -1, 'dashboard K8s forwarding predicate boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(`(${functionSource})`);
}

function loadContainsPricing() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function containsPricing(data) {';
  const endMarker = '  var hasPricing = containsPricing(TAILBENCH_DATA);';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'dashboard pricing predicate is missing');
  assert.notEqual(end, -1, 'dashboard pricing predicate boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(`(${functionSource})`);
}

function loadCostPerformance() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function costPerformance(g) {';
  const endMarker = '  function bestQPS(g) {';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'cost performance helper is missing');
  assert.notEqual(end, -1, 'cost performance helper boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(`(${functionSource})`);
}

test('dashboard inline script parses', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const match = html.match(/<script>\n(\(function\(\) \{[\s\S]*?\n\}\)\(\);)\n<\/script>/);
  assert.ok(match, 'dashboard inline script is missing');
  assert.doesNotThrow(() => new vm.Script(match[1]));
});

test('K8s A/B chart stays hidden for VM-only forwarding results', () => {
  const containsK8sForwardPPS = loadContainsK8sForwardPPS();
  assert.equal(containsK8sForwardPPS([
    {transport_mode: 'forward-pps-exit', forward_pps: {sizes: []}},
    {transport_mode: 'l4-kernel'},
  ]), false);
});

test('K8s A/B chart appears for either K8s forwarding pass', () => {
  const containsK8sForwardPPS = loadContainsK8sForwardPPS();
  for (const transportMode of ['forward-pps-exit-k8s', 'forward-pps-exit-k8s-opton']) {
    assert.equal(containsK8sForwardPPS([
      {transport_mode: transportMode, forward_pps: {sizes: []}},
    ]), true, transportMode);
  }
});

test('K8s forwarding mode without results does not expose the chart', () => {
  const containsK8sForwardPPS = loadContainsK8sForwardPPS();
  assert.equal(containsK8sForwardPPS([
    {transport_mode: 'forward-pps-exit-k8s'},
  ]), false);
});

test('K8s A/B chart tab uses the K8s-specific result gate', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(
    html,
    /if \(hasK8sForwardPPS\) tabs\.push\(\{id:'forwardpps',label:'K8s Forward PPS \(A\/B\)'\}\);/,
  );
  assert.doesNotMatch(
    html,
    /if \(hasForwardPPS\) tabs\.push\(\{id:'forwardpps'/,
  );
});

test('optimization gain surfaces use the persisted aggregate field', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(
    html,
    /var hasForwardingOptimization = TAILBENCH_DATA\.some\(function\(d\)\{ return d\.forwarding_optimization; \}\);/,
  );
  assert.match(
    html,
    /if \(hasForwardingOptimization\) cols\.push\(\{k:'optgain',l:'Opt gain'\}\);/,
  );
  assert.match(
    html,
    /onD\.forwarding_optimization\.gain_pct/,
  );
  assert.doesNotMatch(
    html,
    /delta: \(off && on\) \? \(on-off\)\/off\*100/,
  );
});

test('mode breakdown labels all forwarding topologies and states', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(
    html,
    /'forward-pps-exit','forward-pps-exit-k8s','forward-pps-exit-k8s-opton'/,
  );
  assert.match(html, /if \(mode==='forward-pps-exit'\) return 'fwd-pps VM';/);
  assert.match(html, /if \(mode==='forward-pps-exit-k8s'\) return 'fwd-pps K8s off';/);
  assert.match(html, /if \(mode==='forward-pps-exit-k8s-opton'\) return 'fwd-pps K8s on';/);
});

test('cost tab stays hidden when no result carries a price', () => {
  const containsPricing = loadContainsPricing();
  assert.equal(containsPricing([
    {instance_type: 'e2-standard-2'},
    {instance_type: 'c3-standard-4', price_per_hour: 0},
  ]), false);
});

test('cost tab appears when any result carries a price', () => {
  const containsPricing = loadContainsPricing();
  assert.equal(containsPricing([
    {instance_type: 'e2-standard-2'},
    {instance_type: 'c3-standard-4', price_per_hour: 0.2088},
  ]), true);
});

test('cost tab registration is gated on pricing data', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(
    html,
    /if \(hasPricing\) tabs\.push\(\{id:'cost',label:'Cost'\}\);/,
  );
});

test('cost chart includes load-balancer-only throughput', () => {
  const costPerformance = loadCostPerformance();
  const qps = 18755.5;
  const performance = costPerformance({
    modes: {
      'l4-kernel': {tailscale_tcp: null},
      'l4-lb': {
        fortio_result: {qps},
      },
    },
  });
  assert.equal(performance.metric, 'lbqps');
  assert.equal(performance.value, qps / 1000);

  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /function renderCostScatterChart\(ctx\) \{[\s\S]*?var performance = costPerformance\(g\);/);
  assert.match(html, /text:'Load-balancer throughput \(kreq\/s\)'/);
});

test('headline stats include cost and forwarding efficiency', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /<div class="stat-label">Avg cost<\/div>/);
  assert.match(html, /<div class="stat-label">Best pps\/\$<\/div>/);
});

// Extract tableCols() with its gating flags injected as parameters so tests
// can drive the base/forwarding/relay/combined column combinations with
// synthetic flags instead of a full dashboard dataset.
function loadTableCols() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function tableCols() {';
  const endMarker = '\n\n  function renderHead() {';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'dashboard tableCols definition is missing');
  assert.notEqual(end, -1, 'dashboard tableCols boundary is missing');

  const functionSource = html.slice(start, end).trim();
  const factory = vm.runInNewContext(
    `(function(hasForwardPPS, hasForwardingOptimization, hasRelay) { return (${functionSource}); })`,
  );
  return (hasForwardPPS, hasForwardingOptimization, hasRelay) =>
    JSON.parse(JSON.stringify(factory(hasForwardPPS, hasForwardingOptimization, hasRelay)()));
}

// Extract the conditional chart-tab block (L7 bytes, K8s forwarding A/B,
// peer relay) and evaluate it against a synthetic TAILBENCH_DATA fixture,
// returning the tab ids the dashboard would expose.
function loadTabGatingSource() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  var hasL7Bytes = ';
  const endMarker = "  if (hasRelay) tabs.push({id:'relay',label:'Peer Relay'});";
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'dashboard tab-gating block is missing');
  assert.notEqual(end, -1, 'dashboard tab-gating boundary is missing');
  return html.slice(start, end + endMarker.length);
}

const TAB_GATING_SOURCE = loadTabGatingSource();
const BASE_TABS = ['radar', 'vmvsk8s', 'throughput', 'overhead', 'qps', 'latency'];

function tabIdsFor(data) {
  const context = vm.createContext({ TAILBENCH_DATA: data });
  const ids = vm.runInContext(`${TAB_GATING_SOURCE}\ntabs.map(function(t) { return t.id; });`, context);
  return Array.from(ids);
}

const L4_RECORD = {
  transport_mode: 'l4-kernel',
  baseline_tcp: { summary: { bandwidth_mbps_avg: 1000 } },
};

test('base fixture renders only the standard table columns', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, false).map((c) => c.k);
  assert.deepEqual(keys, ['type', 'provider', 'vcpus', 'price', 'bw', 'overhead', 'qps', 'p99', '', '']);
});

test('forwarding fixture adds usable-pps and pps-per-dollar columns', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(true, false, false).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 10), ['fpps', 'ppsdollar']);
  assert.ok(!keys.includes('optgain'), 'opt gain stays gated on comparison data');
  assert.ok(!keys.includes('relaypps'), 'relay columns stay gated on relay data');
});

test('relay fixture adds relay columns without requiring forwarding data', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, true).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 10), ['relaypps', 'relayppsdollar']);
  assert.ok(!keys.includes('fpps'), 'forwarding columns stay gated on forwarding data');
});

test('combined fixture stacks every gated column in order', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(true, true, true).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 13), ['fpps', 'ppsdollar', 'optgain', 'relaypps', 'relayppsdollar']);
  assert.equal(keys.length, 15, 'detail-row colspan covers every gated column');
});

test('base fixture exposes only the default chart tabs', () => {
  assert.deepEqual(tabIdsFor([L4_RECORD]), BASE_TABS);
});

test('L7 bytes fixture adds the L7 throughput tab', () => {
  const data = [L4_RECORD, { transport_mode: 'l7-serve-h1', fortio_result: { bytes_per_sec: 1024 } }];
  assert.deepEqual(tabIdsFor(data), [...BASE_TABS, 'l7throughput']);
});

test('VM-only forwarding fixture keeps the K8s A/B tab hidden', () => {
  const data = [{ transport_mode: 'forward-pps-exit', forward_pps: { sizes: [] } }];
  assert.deepEqual(tabIdsFor(data), BASE_TABS);
});

test('K8s forwarding fixture adds the A/B tab', () => {
  const data = [{ transport_mode: 'forward-pps-exit-k8s', forward_pps: { sizes: [] } }];
  assert.deepEqual(tabIdsFor(data), [...BASE_TABS, 'forwardpps']);
});

test('relay fixture adds the peer relay tab', () => {
  const data = [{ transport_mode: 'relay-throughput', relay: {} }];
  assert.deepEqual(tabIdsFor(data), [...BASE_TABS, 'relay']);
});

test('combined fixture stacks every conditional tab in order', () => {
  const data = [
    { transport_mode: 'l7-ingress-h1', fortio_result: { bytes_per_sec: 2048 } },
    { transport_mode: 'forward-pps-exit-k8s-opton', forward_pps: { sizes: [] } },
    { transport_mode: 'relay-throughput', relay: {} },
  ];
  assert.deepEqual(tabIdsFor(data), [...BASE_TABS, 'l7throughput', 'forwardpps', 'relay']);
});

function dashboardCss() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'dashboard style block is missing');
  return match[1];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dashboardScript() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const match = html.match(/<script>\n(\(function\(\) \{[\s\S]*?\n\}\)\(\);)\n<\/script>/);
  assert.ok(match, 'dashboard inline script is missing');
  return match[1];
}

test('filter chip groups wrap instead of clipping on narrow viewports', () => {
  assert.match(dashboardCss(), /\.fg \{[^}]*flex-wrap: wrap;/);
});

// Only .chart-tabs may hide its scrollbar: its children are <button>s, so Tab
// still reaches offscreen content and the :focus-visible rule shows where it
// went. .stats is populated with non-focusable <div> tiles, so hiding its
// scrollbar would strand overflowed stats with no keyboard or visual affordance.
test('chart tabs scroll without a permanently visible native scrollbar', () => {
  const css = dashboardCss();
  assert.match(css, /\.chart-tabs \{[^}]*scrollbar-width: none;/);
  assert.match(css, /\.chart-tabs::-webkit-scrollbar \{ display: none; \}/);
});

test('stats strip wraps rather than hiding overflow behind a hidden scrollbar', () => {
  const css = dashboardCss();
  assert.match(css, /\.stats \{[^}]*flex-wrap: wrap;/);
  assert.doesNotMatch(css, /\.stats \{[^}]*overflow-x: auto;/);
  assert.doesNotMatch(css, /\.stats \{[^}]*scrollbar-width: none;/);
  assert.doesNotMatch(css, /\.stats::-webkit-scrollbar/);
});

test('chart tabs keep a visible keyboard focus indicator', () => {
  assert.match(dashboardCss(), /\.chart-tab:focus-visible[^}]*outline: 2px solid var\(--accent\);/);
});

test('wide tables stay contained in their scroller from tablet widths down', () => {
  const css = dashboardCss();
  assert.match(css, /\.tbl-wrap \{[^}]*overflow-x: auto;/);
  assert.match(css, /@media \(max-width: 900px\) \{[^\n]*table \{ min-width: 900px; \}/);
  assert.match(css, /@media \(max-width: 600px\) \{[^\n]*\.wrap \{ padding: 0 16px; \}/);
});

test('open detail rows are not height-clipped on narrow viewports', () => {
  assert.match(
    dashboardCss(),
    /@media \(max-width: 900px\) \{[^\n]*\.detail-row\.open \.detail-content \{ max-height: none; \}/,
  );
});

test('detail metric rows wrap for relay and forwarding results', () => {
  assert.match(dashboardCss(), /\.md-metrics \{[^}]*flex-wrap: wrap;/);
});

// --text-3 is the lowest tier in both themes (#5a5856 dark, #a8a6a2 light) and
// clears no surface at AA. It is reserved for unit suffixes rendered in <small>
// beside an already-readable value; every other text rule owes at least --text-2.
const TEXT3_DECORATIVE = ['.stat-val small', '.bw-v small', '.md-m small'];

test('inactive tabs, headings, labels, and metadata use readable contrast', () => {
  const css = dashboardCss();
  const selectors = [
    '.chart-tab', '.fg label', '.chart-sub label', '.stat-label',
    'thead th', '.dsec h5', '.mt th', '.meta', '.btn-d', 'footer',
  ];
  for (const selector of selectors) {
    assert.match(css, new RegExp(escapeRegExp(selector) + ' \\{[^}]*color: var\\(--text-2\\)'), selector);
  }
});

// The list above only proves the selectors someone remembered to name. This one
// fails on any *new* rule that reaches for the unreadable tier, so stacked
// Cost-tab work cannot silently reintroduce the bug in markup nobody listed.
test('no rule outside the decorative allowlist uses the unreadable text tier', () => {
  const offenders = [];
  for (const [, selector, body] of dashboardCss().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const name = selector.trim().replace(/\s+/g, ' ');
    if (/color:\s*var\(--text-3\)/.test(body) && !TEXT3_DECORATIVE.includes(name)) {
      offenders.push(name);
    }
  }
  assert.deepEqual(offenders, [], `--text-3 is reserved for: ${TEXT3_DECORATIVE.join(', ')}`);
});

// Chart.js sets axis tick colors in JavaScript, so the CSS scan above is blind
// to them -- which is exactly how the cost scatter's three axes shipped at the
// unreadable tier while a CSS-only sweep reported the job done. Every new chart
// adds new axes, so this guards the JS half of the same invariant.
test('chart axis ticks stay on the readable text tier', () => {
  const offenders = [...dashboardScript().matchAll(/ticks:\s*\{[^}]*color:\s*css\('--text-3'\)/g)];
  assert.deepEqual(offenders.map((m) => m[0]), [], 'axis tick labels must use --text-2 or better');
});
