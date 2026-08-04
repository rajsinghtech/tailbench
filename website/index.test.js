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

// Extract the summary helpers plus sortVal/doSort as one block and bind them
// to a caller-supplied state, so tests can drive every sort column and both
// directions without a full dashboard render.
function loadSort() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function bestBW(g) {';
  const endMarker = '  // ===== CHARTS =====';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'dashboard summary helpers are missing');
  assert.notEqual(end, -1, 'dashboard sort block boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(
    `(function(state, vcpu) { ${functionSource}\nreturn { sortVal: sortVal, doSort: doSort, perDollarValue: perDollarValue, hasPerDollarData: hasPerDollarData }; })`,
  );
}

const SORT_FULL_GROUP = {
  type: 'full', provider: 'aws', vcpu: 4, price: 0.5,
  modes: {
    'l4-kernel': {
      tailscale_tcp: { summary: { bandwidth_mbps_avg: 1000 } },
      overhead: { bandwidth_pct: 5 },
      fortio_result: { qps: 100, p99_latency_ms: 10 },
    },
    'forward-pps-exit-k8s-opton': {
      forward_pps: { sizes: [{ label: 'imix-avg', usable_pps: 5000 }] },
      forwarding_optimization: { state: 'on', gain_pct: 20 },
    },
    'relay-throughput': {
      relay: { peer_relay: { pps: { sizes: [{ label: 'imix-avg', usable_pps: 3000 }] } } },
    },
  },
};
const SORT_EMPTY_GROUP = { type: 'empty', provider: 'gcp', vcpu: 2, modes: {} };

const METRIC_SORT_COLUMNS = ['price', 'bw', 'qps', 'p99', 'overhead', 'fpps', 'ppsdollar', 'optgain', 'relaypps', 'relayppsdollar'];

test('rows with no measurement sort last in both directions for every metric column', () => {
  const makeSort = loadSort();
  const vcpu = (g) => g.vcpu || 0;
  for (const column of METRIC_SORT_COLUMNS) {
    for (const dir of ['asc', 'desc']) {
      const { doSort } = makeSort({ sort: column, dir }, vcpu);
      const sorted = doSort([SORT_EMPTY_GROUP, SORT_FULL_GROUP]);
      assert.equal(sorted[0].type, 'full', `${column} ${dir}: measured row first`);
      assert.equal(sorted[1].type, 'empty', `${column} ${dir}: absent row last`);
    }
  }
});

test('a measured zero overhead sorts as a real value, not as absent', () => {
  const makeSort = loadSort();
  const zero = { type: 'zero', provider: 'aws', modes: { 'l4-kernel': { overhead: { bandwidth_pct: 0 } } } };
  for (const [dir, expected] of [['asc', ['zero', 'full', 'empty']], ['desc', ['full', 'zero', 'empty']]]) {
    const { doSort } = makeSort({ sort: 'overhead', dir }, (g) => g.vcpu || 0);
    assert.deepEqual(doSort([SORT_EMPTY_GROUP, SORT_FULL_GROUP, zero]).map((g) => g.type), expected, dir);
  }
});

test('a measured zero opt gain sorts as a real value, not as absent', () => {
  const makeSort = loadSort();
  const zero = { type: 'zero', provider: 'aws', modes: { 'forward-pps-exit-k8s-opton': { forwarding_optimization: { state: 'on', gain_pct: 0 } } } };
  for (const [dir, expected] of [['asc', ['zero', 'full', 'empty']], ['desc', ['full', 'zero', 'empty']]]) {
    const { doSort } = makeSort({ sort: 'optgain', dir }, (g) => g.vcpu || 0);
    assert.deepEqual(doSort([SORT_EMPTY_GROUP, SORT_FULL_GROUP, zero]).map((g) => g.type), expected, dir);
  }
});

// A present record holding a zero is the shape these guard against: fortio
// leaves QPS/P99LatencyMs at 0 when the duration histogram came back empty
// (both are non-omitempty floats), RelayResult.PeerRelay is omitempty and only
// written once that path was confirmed active, and PPSSize.UsablePPS is 0 when
// no offered rate stayed under the loss threshold. Each of these renders "—"
// in the table, so none may outrank a row that shows a number.
const PRESENT_BUT_UNMEASURED = [
  ['p99', { 'l7-ingress-h1': { fortio_result: { qps: 0, p99_latency_ms: 0 } } }],
  ['qps', { 'l7-ingress-h1': { fortio_result: { qps: 0, p99_latency_ms: 0 } } }],
  ['fpps', { 'forward-pps-exit': { forward_pps: { sizes: [{ label: 'imix-avg', usable_pps: 0 }] } } }],
  ['relaypps', { 'relay-throughput': { relay: { direct: { path: 'direct', pps: { sizes: [{ label: 'imix-avg', usable_pps: 900 }] } } } } }],
];

test('a present record with no usable measurement sorts last, not first', () => {
  const makeSort = loadSort();
  for (const [column, modes] of PRESENT_BUT_UNMEASURED) {
    const unmeasured = { type: 'unmeasured', provider: 'aws', price: 0.5, modes };
    for (const dir of ['asc', 'desc']) {
      const { doSort } = makeSort({ sort: column, dir }, (g) => g.vcpu || 0);
      const sorted = doSort([unmeasured, SORT_FULL_GROUP]).map((g) => g.type);
      assert.deepEqual(sorted, ['full', 'unmeasured'], `${column} ${dir}`);
    }
  }
});

test('per-dollar rows reject a present record with no usable measurement', () => {
  const makeSort = loadSort();
  const { hasPerDollarData } = makeSort({ sort: 'vcpus', dir: 'asc' }, (g) => g.vcpu || 0);
  const zeroQPS = { price: 0.5, modes: { 'l7-ingress-h1': { fortio_result: { qps: 0, p99_latency_ms: 0 } } } };
  const zeroPPS = { price: 0.5, modes: { 'forward-pps-exit': { forward_pps: { sizes: [{ label: 'imix-avg', usable_pps: 0 }] } } } };
  assert.equal(hasPerDollarData(zeroQPS, 'qps'), false);
  assert.equal(hasPerDollarData(zeroPPS, 'pps'), false);
});

test('string columns are unaffected by the absent-row handling', () => {
  const makeSort = loadSort();
  for (const [dir, expected] of [['asc', ['aws', 'gcp']], ['desc', ['gcp', 'aws']]]) {
    const { doSort } = makeSort({ sort: 'provider', dir }, (g) => g.vcpu || 0);
    assert.deepEqual(doSort([SORT_EMPTY_GROUP, SORT_FULL_GROUP]).map((g) => g.provider), expected, dir);
  }
});

test('sortVal carries no sentinel magic numbers', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = html.indexOf('  function sortVal(g) {');
  const end = html.indexOf('  function doSort(arr) {', start);
  assert.notEqual(start, -1, 'sortVal is missing');
  assert.notEqual(end, -1, 'sortVal boundary is missing');
  const sortValSource = html.slice(start, end);
  for (const sentinel of ['999999', '999', 'Infinity']) {
    assert.ok(!sortValSource.includes(sentinel), `sortVal still uses sentinel ${sentinel}`);
  }
});

// Extract the cost-view gating helpers (metric options and the priced-groups
// filter) as pure functions so tests can drive them with synthetic fixtures.
function loadCostPerDollarMetrics() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function costPerDollarMetrics(data, hasFwdPPS) {';
  const endMarker = '  var costMetrics = costPerDollarMetrics(TAILBENCH_DATA, hasForwardPPS);';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'cost per-dollar metric gating is missing');
  assert.notEqual(end, -1, 'cost per-dollar metric gating boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(`(${functionSource})`);
}

function loadPricedGroups() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const startMarker = '  function pricedGroups(groups) {';
  const endMarker = '  function renderChartTabs() {';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'priced-groups filter is missing');
  assert.notEqual(end, -1, 'priced-groups filter boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(`(${functionSource})`);
}

test('cost view selector offers the ranked and absolute price views', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /\{id:'perdollar',label:'Performance per dollar'\}/);
  assert.match(html, /\{id:'price',label:'Absolute \$\/hr'\}/);
  assert.match(html, /if \(state\.costView==='perdollar'\) renderCostPerDollarChart\(ctx\);/);
  assert.match(html, /else if \(state\.costView==='price'\) renderCostPriceChart\(ctx\);/);
});

test('per-dollar metric options are gated on their underlying data', () => {
  const costPerDollarMetrics = loadCostPerDollarMetrics();
  // vm-realm arrays fail deepStrictEqual on prototype, so copy them out.
  const ids = (metrics) => Array.from(metrics.map((m) => m.id));

  assert.deepEqual(ids(costPerDollarMetrics([{ transport_mode: 'l4-kernel' }], false)), ['gbps']);
  assert.deepEqual(ids(costPerDollarMetrics([{ transport_mode: 'l4-kernel' }], true)), ['gbps', 'pps']);
  assert.deepEqual(
    ids(costPerDollarMetrics([{ fortio_result: { qps: 100 } }], false)),
    ['gbps', 'qps'],
  );
  assert.deepEqual(
    ids(costPerDollarMetrics([{ fortio_result: { qps: 100 } }], true)),
    ['gbps', 'pps', 'qps'],
  );
});

test('unpriced groups are excluded from the ranked cost views', () => {
  const pricedGroups = loadPricedGroups();
  const groups = [
    { type: 'priced', price: 0.2088 },
    { type: 'zero', price: 0 },
    { type: 'missing' },
    { type: 'null', price: null },
  ];
  assert.deepEqual(pricedGroups(groups).map((g) => g.type), ['priced']);
});

test('per-dollar values divide by price only when a price exists', () => {
  const makeSort = loadSort();
  const { perDollarValue } = makeSort({ sort: 'vcpus', dir: 'asc' }, (g) => g.vcpu || 0);

  const priced = {
    price: 0.5,
    modes: {
      'l4-kernel': {
        tailscale_tcp: { summary: { bandwidth_mbps_avg: 1000 } },
        fortio_result: { qps: 200 },
      },
      'forward-pps-exit': { forward_pps: { sizes: [{ label: 'imix-avg', usable_pps: 4000 }] } },
    },
  };
  assert.equal(perDollarValue(priced, 'gbps'), 2, 'Gbps/$ is bandwidth/1000/price');
  assert.equal(perDollarValue(priced, 'pps'), 8000);
  assert.equal(perDollarValue(priced, 'qps'), 400);

  const unpriced = { modes: priced.modes };
  for (const metric of ['gbps', 'pps', 'qps']) {
    assert.equal(perDollarValue(unpriced, metric), 0, `${metric} without a price is 0, not Infinity`);
  }
});

test('per-dollar rows require the selected metric\'s measurement', () => {
  const makeSort = loadSort();
  const { hasPerDollarData } = makeSort({ sort: 'vcpus', dir: 'asc' }, (g) => g.vcpu || 0);

  const bwOnly = { modes: { 'l4-kernel': { tailscale_tcp: { summary: { bandwidth_mbps_avg: 1000 } } } } };
  assert.equal(hasPerDollarData(bwOnly, 'gbps'), true);
  assert.equal(hasPerDollarData(bwOnly, 'pps'), false);
  assert.equal(hasPerDollarData(bwOnly, 'qps'), false);
});

test('per-dollar axis states the exact charted unit', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /gbps:'Gbps per \$\/hr', pps:'usable pps per \$\/hr', qps:'QPS per \$\/hr'/);
  assert.match(html, /title:\{display:true,text:perDollarUnits\[metric\]/);
});

// A metric stays selectable while any record in the whole dataset carries it,
// so filtering to a provider that never ran that benchmark leaves priced rows
// on screen and nothing to plot. Blaming the filter there is simply wrong.
test('the per-dollar empty state separates an unmatched filter from an unmeasured metric', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const start = html.indexOf('  function renderCostPerDollarChart(ctx) {');
  const end = html.indexOf('  function renderCostPriceChart(ctx) {', start);
  assert.notEqual(start, -1, 'per-dollar chart is missing');
  assert.notEqual(end, -1, 'per-dollar chart boundary is missing');
  const source = html.slice(start, end);

  assert.match(source, /priced\.length[\s\S]*?among the priced instances in this filter/);
  assert.match(source, /'No priced results match the current filters'/);
  assert.match(source, /title:rows\.length\?\{display:false\}:\{display:true,text:emptyText/);
  assert.match(html, /perDollarMeasure = \{gbps:'throughput', pps:'forwarding-pps', qps:'load-test'\}/);

  // The absolute-price view has only one way to come up empty, so it keeps the
  // filter wording.
  const priceChart = html.slice(end, html.indexOf('  function renderCostScatterChart(ctx) {', end));
  assert.match(priceChart, /text:'No priced results match the current filters'/);
});
