'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

// The dashboard is one self-contained HTML file, so these tests drive its
// behaviour by slicing named blocks out of the source and evaluating them in a
// bare realm. Read the file once: every extractor is a pure function of its
// text, and the suite would otherwise re-read ~90KB dozens of times.
const DASHBOARD_HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const dashboardHTML = () => DASHBOARD_HTML;

// Every extractor shares this shape: locate two markers, assert both were
// found, return the source between them. Markers are exact source text, so a
// rename that moves a block fails loudly here rather than silently testing an
// empty string.
function extractBlock(startMarker, endMarker, label) {
  const start = DASHBOARD_HTML.indexOf(startMarker);
  const end = DASHBOARD_HTML.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${label} block is missing`);
  assert.notEqual(end, -1, `${label} block boundary is missing`);
  return DASHBOARD_HTML.slice(start, end).trim();
}

// Extract a single standalone function and return it as a callable.
function extractFunction(startMarker, endMarker, label) {
  return vm.runInNewContext(`(${extractBlock(startMarker, endMarker, label)})`);
}

function loadContainsK8sForwardPPS() {
  return extractFunction(
    '  function containsK8sForwardPPS(data) {',
    '  var hasK8sForwardPPS = containsK8sForwardPPS(TAILBENCH_DATA);',
    'dashboard K8s forwarding predicate',
  );
}

function loadContainsPricing() {
  return extractFunction(
    '  function containsPricing(data) {',
    '  var hasPricing = containsPricing(TAILBENCH_DATA);',
    'dashboard pricing predicate',
  );
}

function loadCostPerformance() {
  return extractFunction(
    '  function costPerformance(g) {',
    '  function bestQPS(g) {',
    'cost performance helper',
  );
}

test('dashboard inline script parses', () => {
  const html = dashboardHTML();
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
  const html = dashboardHTML();
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
  const html = dashboardHTML();
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
  const html = dashboardHTML();
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
  const html = dashboardHTML();
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

  const html = dashboardHTML();
  assert.match(html, /function renderCostScatterChart\(ctx\) \{[\s\S]*?var performance = costPerformance\(g\);/);
  assert.match(html, /text:'Load-balancer throughput \(kreq\/s\)'/);
});

test('headline stats include cost and forwarding efficiency', () => {
  const html = dashboardHTML();
  assert.match(html, /<div class="stat-label">Avg cost<\/div>/);
  assert.match(html, /<div class="stat-label">Best pps\/\$<\/div>/);
});

// Extract tableCols() with its gating flags injected as parameters so tests
// can drive the base/pricing/forwarding/relay/combined column combinations
// with synthetic flags instead of a full dashboard dataset.
function loadTableCols() {
  const functionSource = extractBlock(
    '  function tableCols() {',
    '\n\n  function renderHead() {',
    'dashboard tableCols definition',
  );
  const factory = vm.runInNewContext(
    `(function(hasUsableForwardPPS, hasForwardingOptimization, hasRelay, hasPricing, hasBWResults, hasQPSResults) { return (${functionSource}); })`,
  );
  return (hasUsableForwardPPS, hasForwardingOptimization, hasRelay, hasPricing, hasBWResults, hasQPSResults) =>
    JSON.parse(JSON.stringify(
      factory(hasUsableForwardPPS, hasForwardingOptimization, hasRelay, hasPricing, hasBWResults, hasQPSResults)(),
    ));
}

// Extract the conditional chart-tab block (L7 bytes, K8s forwarding A/B,
// peer relay) and evaluate it against a synthetic TAILBENCH_DATA fixture,
// returning the tab ids the dashboard would expose.
function loadTabGatingSource() {
  const html = dashboardHTML();
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
  const keys = makeCols(false, false, false, false, false, false).map((c) => c.k);
  assert.deepEqual(keys, ['type', 'provider', 'vcpus', 'price', 'bw', 'overhead', 'qps', 'p99', '', '']);
});

test('pricing plus throughput fixture adds the Gbps/$ column only', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, false, true, true, false).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 9), ['gbpsdollar']);
  assert.ok(!keys.includes('qpsdollar'), 'QPS/$ stays gated on load-test data');
});

test('pricing plus load-test fixture adds both per-dollar columns', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, false, true, true, true).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 10), ['gbpsdollar', 'qpsdollar']);
});

// Pricing alone says nothing about throughput existing. A priced dataset of
// only l4-lb / l7-* modes has no bestBW anywhere, so an ungated Gbps/$ column
// would render "—" on every single row.
test('priced dataset with no L4 throughput omits the Gbps/$ column', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, false, true, false, true).map((c) => c.k);
  assert.ok(!keys.includes('gbpsdollar'), 'Gbps/$ is gated on throughput, not just pricing');
  assert.deepEqual(keys.slice(8, 9), ['qpsdollar'], 'QPS/$ still stands on its own');
});

test('unpriced dataset never carries a per-dollar column', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(true, true, true, false, true, true).map((c) => c.k);
  assert.ok(!keys.includes('gbpsdollar'));
  assert.ok(!keys.includes('qpsdollar'));
});

test('forwarding fixture adds usable-pps and pps-per-dollar columns', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(true, false, false, false, false, false).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 10), ['fpps', 'ppsdollar']);
  assert.ok(!keys.includes('optgain'), 'opt gain stays gated on comparison data');
  assert.ok(!keys.includes('relaypps'), 'relay columns stay gated on relay data');
});

test('relay fixture adds relay columns without requiring forwarding data', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(false, false, true, false, false, false).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 10), ['relaypps', 'relayppsdollar']);
  assert.ok(!keys.includes('fpps'), 'forwarding columns stay gated on forwarding data');
});

test('combined fixture stacks every gated column in order', () => {
  const makeCols = loadTableCols();
  const keys = makeCols(true, true, true, true, true, true).map((c) => c.k);
  assert.deepEqual(keys.slice(8, 15), ['gbpsdollar', 'qpsdollar', 'fpps', 'ppsdollar', 'optgain', 'relaypps', 'relayppsdollar']);
  assert.equal(keys.length, 17, 'detail-row colspan covers every gated column');
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
  const html = dashboardHTML();
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, 'dashboard style block is missing');
  return match[1];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dashboardScript() {
  const html = dashboardHTML();
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
  const functionSource = extractBlock(
    '  function bestBW(g) {',
    '  // ===== CHARTS =====',
    'dashboard summary helpers',
  );
  return vm.runInNewContext(
    `(function(state, vcpu) { ${functionSource}\nreturn { sortVal: sortVal, doSort: doSort, perDollarValue: perDollarValue, hasPerDollarData: hasPerDollarData, perDollarMetrics: perDollarMetrics }; })`,
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

const METRIC_SORT_COLUMNS = ['price', 'bw', 'gbpsdollar', 'qps', 'qpsdollar', 'p99', 'overhead', 'fpps', 'ppsdollar', 'optgain', 'relaypps', 'relayppsdollar'];

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
  const html = dashboardHTML();
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
// Bound to a caller-supplied metric table so the gating can be driven with
// synthetic predicates rather than the real dataset.
function loadCostPerDollarMetrics() {
  const source = extractBlock(
    '  function costPerDollarMetrics(groups) {',
    '  var costMetrics = costPerDollarMetrics(allGroups);',
    'cost per-dollar metric gating',
  );
  return vm.runInNewContext(
    `(function(perDollarMetrics) { ${source}\nreturn costPerDollarMetrics; })`,
  );
}

function loadPricedGroups() {
  return extractFunction(
    '  function pricedGroups(groups) {',
    '  function renderChartTabs() {',
    'priced-groups filter',
  );
}

test('cost view selector offers the ranked and absolute price views', () => {
  const html = dashboardHTML();
  assert.match(html, /\{id:'perdollar',label:'Performance per dollar',render:renderCostPerDollarChart\}/);
  assert.match(html, /\{id:'price',label:'Absolute \$\/hr',render:renderCostPriceChart\}/);
});

// Each view carries its own renderer, so a view cannot be registered without
// one. The previous if/else chain fell through to the scatter chart, which
// rendered the wrong chart under the selected view's label.
test('every cost view carries a renderer and dispatch goes through the list', () => {
  const html = dashboardHTML();
  const source = extractBlock(
    '  function renderCostChart(ctx) {',
    '\n\n  // Shared shape for the provider-coloured ranked bars',
    'cost chart dispatch',
  );
  assert.match(source, /costViews\.filter\(function\(v\)\{ return v\.id===state\.costView; \}\)\[0\]/);
  assert.ok(!/state\.costView==='/.test(source), 'no per-view if/else chain remains');

  const registrations = [...html.matchAll(/costViews(?:\.push\(|\s*=\s*\[)\{id:'[a-z]+'[^}]*\}/g)].map((m) => m[0]);
  assert.equal(registrations.length, 4, 'four cost views are registered');
  for (const r of registrations) {
    assert.match(r, /render:render\w+Chart/, `view registration carries a renderer: ${r}`);
  }
});

test('per-dollar metric options are gated on their underlying data', () => {
  const bind = loadCostPerDollarMetrics();
  const metrics = [
    { id: 'gbps', has: (g) => !!g.bw },
    { id: 'pps', has: (g) => !!g.pps },
    { id: 'qps', has: (g) => !!g.qps },
  ];
  // vm-realm arrays fail deepStrictEqual on prototype, so copy them out.
  const ids = (groups) => Array.from(bind(metrics)(groups).map((m) => m.id));

  assert.deepEqual(ids([{ bw: 1 }]), ['gbps']);
  assert.deepEqual(ids([{ bw: 1 }, { pps: 1 }]), ['gbps', 'pps']);
  assert.deepEqual(ids([{ bw: 1 }, { qps: 1 }]), ['gbps', 'qps']);
  assert.deepEqual(ids([{ bw: 1, pps: 1, qps: 1 }]), ['gbps', 'pps', 'qps']);
  // Gbps/$ is not exempt: a priced dataset of only l4-lb / l7-* modes carries no
  // L4 throughput, and an ungated Gbps/$ would open the view empty on its own
  // default metric.
  assert.deepEqual(ids([{ qps: 1 }]), ['qps']);
  assert.deepEqual(ids([{}]), [], 'no metric is plottable');
});

// One descriptor per metric is what stops the column header, the metric
// selector, the sort key and the per-row skip from disagreeing about whether
// data exists — the failure this table replaced.
test('each metric owns its id, sort key, unit, and measurement predicate', () => {
  const { perDollarMetrics } = loadSort()({ sort: 'vcpus', dir: 'asc' }, () => 0);
  const table = Array.from(perDollarMetrics.map((m) => [m.id, m.sortKey, m.unit, m.measure]));
  assert.deepEqual(table, [
    ['gbps', 'gbpsdollar', 'Gbps per $/hr', 'throughput'],
    ['pps', 'ppsdollar', 'usable pps per $/hr', 'forwarding-pps'],
    ['qps', 'qpsdollar', 'QPS per $/hr', 'load-test'],
  ]);
  // Every metric's `has` must be exactly `raw > 0` — perDollarValue relies on
  // that equivalence to evaluate raw once instead of calling both.
  const measured = { price: 1, modes: {
    'l4-kernel': { tailscale_tcp: { summary: { bandwidth_mbps_avg: 1000 } }, fortio_result: { qps: 5 } },
    'forward-pps-exit': { forward_pps: { sizes: [{ label: 'imix-avg', usable_pps: 7 }] } },
  } };
  const empty = { price: 1, modes: {} };
  for (const m of perDollarMetrics) {
    assert.equal(m.has(measured), m.raw(measured) > 0, `${m.id}: has matches raw>0 when measured`);
    assert.equal(m.has(empty), m.raw(empty) > 0, `${m.id}: has matches raw>0 when absent`);
  }
});

test('the dataset gates reuse the per-row predicates rather than re-deriving them', () => {
  const html = dashboardHTML();
  // One predicate per metric, shared by the column header, the metric selector,
  // and hasPerDollarData. Two answers to "is there data" is how they drift.
  assert.match(html, /var hasBWResults = allGroups\.some\(hasBWData\);/);
  assert.match(html, /var hasQPSResults = allGroups\.some\(hasQPSData\);/);
  assert.match(html, /var hasUsableForwardPPS = allGroups\.some\(hasForwardPPSData\);/);
  assert.match(html, /if \(hasPricing && hasBWResults\) cols\.push\(\{k:'gbpsdollar'/);
  assert.match(html, /if \(hasPricing && hasQPSResults\) cols\.push\(\{k:'qpsdollar'/);
  // The pps columns use the usable-rate predicate too, not record presence.
  assert.match(html, /if \(hasUsableForwardPPS\) cols\.push\(\{k:'fpps'/);
  assert.match(html, /costPerDollarMetrics\(allGroups\)/);
});

test('the per-dollar view is only offered when a metric can plot in it', () => {
  const html = dashboardHTML();
  assert.match(html, /if \(costMetrics\.length\) costViews\.push\(\{id:'perdollar'/);
  // The default metric is 'gbps', which a throughput-free dataset does not
  // offer, so the fallback has to land on the first available id, not a
  // hardcoded one.
  assert.match(html, /state\.costMetric=costMetrics\[0\]\.id;/);
  assert.ok(!/state\.costMetric='gbps';/.test(html), 'fallback must not hardcode a metric id');
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
  // The unit string comes off the selected metric's descriptor, so the axis
  // title and the tooltip suffix cannot name different units.
  assert.match(dashboardHTML(), /title:\{display:true,text:m\.unit/);
});

// A metric stays selectable while any record in the whole dataset carries it,
// so filtering to a provider that never ran that benchmark leaves priced rows
// on screen and nothing to plot. Blaming the filter there is simply wrong.
test('the per-dollar empty state separates an unmatched filter from an unmeasured metric', () => {
  const html = dashboardHTML();
  const start = html.indexOf('  function renderCostPerDollarChart(ctx) {');
  const end = html.indexOf('  function renderCostPriceChart(ctx) {', start);
  assert.notEqual(start, -1, 'per-dollar chart is missing');
  assert.notEqual(end, -1, 'per-dollar chart boundary is missing');
  const source = html.slice(start, end);

  assert.match(source, /priced\.length[\s\S]*?among the priced instances in this filter/);
  assert.match(source, /'No priced results match the current filters'/);
  assert.match(source, /title:emptyTitle\(rows\.length,emptyText\)/);
  // The missing benchmark is named from the metric's own descriptor.
  assert.match(source, /'No '\+m\.measure\+' results among the priced instances in this filter'/);

  // The absolute-price view has only one way to come up empty, so it keeps the
  // filter wording.
  const priceChart = html.slice(end, html.indexOf('  function renderCostScatterChart(ctx) {', end));
  assert.match(priceChart, /emptyTitle\(rows\.length,'No priced results match the current filters'\)/);
});

// Extract the cost-of-overhead helpers as pure functions so tests can drive
// the triple precondition (price + baseline + Tailscale throughput) with
// synthetic groups instead of a full dashboard dataset.
function loadOverheadCost() {
  const html = dashboardHTML();
  const startMarker = '  function overheadCostInputs(g) {';
  const endMarker = '\n\n  // Sort';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'overhead-cost helpers are missing');
  assert.notEqual(end, -1, 'overhead-cost helpers boundary is missing');

  const functionSource = html.slice(start, end).trim();
  return vm.runInNewContext(
    `(function() { ${functionSource}\nreturn { overheadCostInputs: overheadCostInputs, overheadCost: overheadCost }; })()`,
  );
}

const OVERHEAD_GROUP = {
  type: 'full', provider: 'aws', price: 1,
  modes: {
    'l4-kernel': {
      baseline_tcp: { summary: { bandwidth_mbps_avg: 1000 } },
      tailscale_tcp: { summary: { bandwidth_mbps_avg: 800 } },
    },
  },
};

test('overhead-cost predicate requires price plus both sides of the L4 pair', () => {
  const { overheadCostInputs } = loadOverheadCost();
  assert.ok(overheadCostInputs(OVERHEAD_GROUP), 'all three inputs present');

  const noPrice = { ...OVERHEAD_GROUP, price: 0 };
  assert.equal(overheadCostInputs(noPrice), null, 'no price');

  const noBaseline = {
    price: 1,
    modes: { 'l4-kernel': { tailscale_tcp: { summary: { bandwidth_mbps_avg: 800 } } } },
  };
  assert.equal(overheadCostInputs(noBaseline), null, 'price without baseline');

  const noTailscale = {
    price: 1,
    modes: { 'l4-kernel': { baseline_tcp: { summary: { bandwidth_mbps_avg: 1000 } } } },
  };
  assert.equal(overheadCostInputs(noTailscale), null, 'price without Tailscale');
});

test('overhead-cost predicate falls back to the userspace L4 entry', () => {
  const { overheadCostInputs } = loadOverheadCost();
  const userspace = {
    price: 1,
    modes: {
      'l4-userspace': {
        baseline_tcp: { summary: { bandwidth_mbps_avg: 500 } },
        tailscale_tcp: { summary: { bandwidth_mbps_avg: 400 } },
      },
    },
  };
  // vm-realm objects fail deepStrictEqual on prototype, so compare field values.
  const inputs = overheadCostInputs(userspace);
  assert.equal(inputs.price, 1);
  assert.equal(inputs.baseline, 500);
  assert.equal(inputs.tailscale, 400);
});

test('zero bandwidth on either side yields no overhead cost, not Infinity or NaN', () => {
  const { overheadCost } = loadOverheadCost();
  for (const side of ['baseline_tcp', 'tailscale_tcp']) {
    const group = {
      price: 1,
      modes: {
        'l4-kernel': {
          baseline_tcp: { summary: { bandwidth_mbps_avg: 1000 } },
          tailscale_tcp: { summary: { bandwidth_mbps_avg: 800 } },
          [side]: { summary: { bandwidth_mbps_avg: 0 } },
        },
      },
    };
    const cost = overheadCost(group);
    assert.equal(cost, null, `${side} at zero`);
    if (cost) {
      assert.ok(Number.isFinite(cost.baseline) && Number.isFinite(cost.tailscale));
    }
  }
});

test('overhead cost derives $/Gbps, the gap, and wasted spend from raw bandwidths', () => {
  const { overheadCost } = loadOverheadCost();
  const cost = overheadCost(OVERHEAD_GROUP);
  assert.equal(cost.baseline, 1, '$1/hr at 1 Gbps baseline');
  assert.equal(cost.tailscale, 1.25, '$1/hr at 0.8 Gbps through Tailscale');
  assert.equal(cost.gap, 0.25);
  assert.ok(Math.abs(cost.wasted - 0.2) < 1e-12, 'the 20% baseline-relative overhead as spend');
});

test('cost-of-overhead view is gated on the triple and carries its renderer', () => {
  const html = dashboardHTML();
  assert.match(
    html,
    /if \(allGroups\.some\(function\(g\)\{ return !!overheadCostInputs\(g\); \}\)\) \{\s*costViews\.push\(\{id:'overhead',label:'Cost of overhead',render:renderCostOverheadChart\}\);/,
  );
});

// The tooltip is a pure function of one row, so assert on what it produces
// rather than on the presence of phrases in its source — a swapped sign that
// left the surrounding wording intact would pass a regex check.
function loadOverheadTooltipLines() {
  // Bound to the dashboard's own usd(), so the asserted strings are the exact
  // currency formatting a reader sees.
  const usdSource = extractBlock('  function usd(p) {', '\n  // usd() is tuned', 'usd formatter');
  const source = extractBlock(
    '  function overheadTooltipLines(r) {',
    '\n\n  function renderCostOverheadChart(ctx) {',
    'overhead tooltip lines',
  );
  return vm.runInNewContext(`(function(){ ${usdSource}\n${source}\nreturn overheadTooltipLines; })()`);
}

test('overhead-cost tooltip labels both percentage denominators', () => {
  const overheadTooltipLines = loadOverheadTooltipLines();
  // $1/hr, 1 Gbps baseline vs 0.8 Gbps Tailscale: +$0.25 per delivered Gbps,
  // $0.20/hr wasted (20% baseline-relative), cost/Gbps up 25% (Tailscale-relative).
  const lines = Array.from(overheadTooltipLines({ baseline: 1, tailscale: 1.25, gap: 0.25, wasted: 0.2, price: 1 }));
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^Delta: \+\$0\.2500 per delivered Gbps with Tailscale$/);
  assert.match(lines[1], /^Wasted spend: \$0\.2000\/hr — 20\.0% of the hourly price/);
  assert.match(lines[1], /baseline-relative, same denominator as the Overhead column/);
  assert.match(lines[2], /^Cost per delivered Gbps rises 25\.0%/);
  assert.match(lines[2], /relative to Tailscale throughput/);
});

test('overhead-cost rows are sorted by the cost gap, widest first', () => {
  const source = extractBlock(
    '  function renderCostOverheadChart(ctx) {',
    '\n\n  function renderCostScatterChart(ctx) {',
    'overhead-cost chart',
  );
  assert.match(source, /rows\.sort\(function\(a,b\)\{ return b\.gap-a\.gap; \}\)/, 'sorted by cost gap descending');
});

// Extract the price-filter pieces (bucket definitions, bucket test, filtered,
// and availableFilters) as pure functions bound to caller-supplied groups and
// state, so bucket boundaries and filter composition are drivable without a
// full dashboard dataset.
function loadPriceFilter() {
  const html = dashboardHTML();
  const spans = [
    ['price buckets', '  var priceBuckets = [', '\n\n  // Context-aware filter availability'],
    ['availableFilters', '  function availableFilters() {', '\n\n  var modeOrder='],
    ['filtered', '  function filtered() {', '\n\n  // Helpers'],
  ];
  let source = '';
  for (const [name, startMarker, endMarker] of spans) {
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker, start);
    assert.notEqual(start, -1, `${name} block is missing`);
    assert.notEqual(end, -1, `${name} block boundary is missing`);
    source += html.slice(start, end) + '\n';
  }
  return vm.runInNewContext(
    `(function(allGroups, state) { ${source}\nreturn { priceBuckets: priceBuckets, priceBucket: priceBucket, filtered: filtered, availableFilters: availableFilters }; })`,
  );
}

const PRICE_GROUPS = [
  { type: 'cheap', provider: 'aws', family: 'c', env: 'vm', price: 0.05 },
  { type: 'mid', provider: 'gcp', family: 'n', env: 'vm', price: 0.50 },
  { type: 'unpriced', provider: 'azure', family: 'd', env: 'container', price: 0 },
];
const ALL_FILTER_STATE = { provider: 'all', family: 'all', env: 'all', price: 'all' };

test('every priced instance lands in exactly one bucket, boundaries included', () => {
  const { priceBuckets, priceBucket } = loadPriceFilter()(PRICE_GROUPS, ALL_FILTER_STATE);
  const cases = [
    [0.0428, 'lt010'], [0.0999, 'lt010'],
    [0.10, '010to050'], [0.4999, '010to050'],
    [0.50, '050to100'], [0.9999, '050to100'],
    [1.00, 'gte100'], [11.376, 'gte100'],
  ];
  for (const [price, expected] of cases) {
    assert.equal(priceBucket({ price }), expected, `$${price}/hr`);
    // Structural check: the bucket definitions themselves must not overlap or
    // gap — exactly one [min, max) interval contains the price.
    const matches = priceBuckets.filter(
      (b) => (b.min === undefined || price >= b.min) && (b.max === undefined || price < b.max),
    );
    assert.equal(matches.length, 1, `$${price}/hr matches ${matches.length} buckets`);
  }
});

test('unpriced instances belong to no bucket', () => {
  const { priceBucket } = loadPriceFilter()(PRICE_GROUPS, ALL_FILTER_STATE);
  assert.equal(priceBucket({ price: 0 }), null);
  assert.equal(priceBucket({}), null);
});

test('All keeps unpriced instances; specific buckets exclude them', () => {
  const makeFilter = loadPriceFilter();
  const types = (state) => makeFilter(PRICE_GROUPS, state).filtered().map((g) => g.type);
  assert.deepEqual(types({ ...ALL_FILTER_STATE }), ['cheap', 'mid', 'unpriced']);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: 'lt010' }), ['cheap']);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: '050to100' }), ['mid']);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: 'gte100' }), []);
});

test('price filter composes with provider, family, and env filters', () => {
  const makeFilter = loadPriceFilter();
  const types = (state) => makeFilter(PRICE_GROUPS, state).filtered().map((g) => g.type);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: 'lt010', provider: 'aws' }), ['cheap']);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: 'lt010', provider: 'gcp' }), []);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: '050to100', env: 'container' }), []);
  assert.deepEqual(types({ ...ALL_FILTER_STATE, price: '050to100', family: 'n' }), ['mid']);
});

test('buckets with no matching instances are reported unavailable for dimming', () => {
  const makeFilter = loadPriceFilter();
  const avail = makeFilter(PRICE_GROUPS, ALL_FILTER_STATE).availableFilters();
  assert.equal(avail.prices.lt010, 1);
  assert.equal(avail.prices['050to100'], 1);
  assert.equal(avail.prices['010to050'], undefined, 'empty bucket dims');
  assert.equal(avail.prices.gte100, undefined, 'empty bucket dims');
});

test('bucket availability follows the other three filters, and vice versa', () => {
  const makeFilter = loadPriceFilter();
  // Narrowing to AWS leaves only the cheap bucket available.
  const awsOnly = makeFilter(PRICE_GROUPS, { ...ALL_FILTER_STATE, provider: 'aws' }).availableFilters();
  assert.equal(awsOnly.prices.lt010, 1);
  assert.equal(awsOnly.prices['050to100'], undefined);
  // Narrowing to the cheap bucket leaves only AWS available as a provider.
  const cheapOnly = makeFilter(PRICE_GROUPS, { ...ALL_FILTER_STATE, price: 'lt010' }).availableFilters();
  assert.equal(cheapOnly.provs.AWS, 1);
  assert.equal(cheapOnly.provs.GCP, undefined);
  assert.equal(cheapOnly.provs.AZURE, undefined);
});

test('price filter group renders as chips and is gated on priced data', () => {
  const html = dashboardHTML();
  // groupData gives a group a price when any of its records has one, so
  // hasPricing is the same fact for groups — no second scan is needed.
  assert.match(html, /if\(hasPricing\) \{\s*h\+='<div class="fg"><label>Price<\/label>';/);
  assert.ok(!/hasPricedGroups/.test(html), 'no duplicate priced-groups scan');
  assert.match(html, /data-f="price" data-v="all"/);
  assert.match(html, /data-f="price" data-v="'\+b\.id\+'"/);
});

test('per-dollar sort cases follow the absent-value convention', () => {
  const makeSort = loadSort();
  for (const column of ['gbpsdollar', 'qpsdollar']) {
    for (const dir of ['asc', 'desc']) {
      const { sortVal, doSort } = makeSort({ sort: column, dir }, (g) => g.vcpu || 0);
      // Unpriced but measured, and priced but unmeasured, both read as absent.
      const unpriced = { type: 'unpriced', provider: 'aws', modes: SORT_FULL_GROUP.modes };
      assert.equal(sortVal(unpriced), null, `${column}: unpriced is absent`);
      assert.equal(sortVal(SORT_EMPTY_GROUP), null, `${column}: unmeasured is absent`);
      const sorted = doSort([SORT_EMPTY_GROUP, SORT_FULL_GROUP, unpriced]).map((g) => g.type);
      assert.deepEqual(sorted.slice(0, 1), ['full'], `${column} ${dir}: measured row first`);
      assert.deepEqual(sorted.slice(1).sort(), ['empty', 'unpriced'], `${column} ${dir}: absent rows last`);
    }
  }
});

test('per-dollar sort values match the per-dollar chart metric', () => {
  const makeSort = loadSort();
  const vcpu = (g) => g.vcpu || 0;
  const gbpsSort = makeSort({ sort: 'gbpsdollar', dir: 'asc' }, vcpu);
  const qpsSort = makeSort({ sort: 'qpsdollar', dir: 'asc' }, vcpu);
  // SORT_FULL_GROUP: 1000 Mbps and 100 qps at $0.50/hr.
  assert.equal(gbpsSort.sortVal(SORT_FULL_GROUP), 2, 'Gbps/$ = Gbps ÷ $/hr');
  assert.equal(qpsSort.sortVal(SORT_FULL_GROUP), 200, 'QPS/$ = qps ÷ $/hr');
  const { perDollarValue } = makeSort({ sort: 'vcpus', dir: 'asc' }, vcpu);
  assert.equal(gbpsSort.sortVal(SORT_FULL_GROUP), perDollarValue(SORT_FULL_GROUP, 'gbps'));
  assert.equal(qpsSort.sortVal(SORT_FULL_GROUP), perDollarValue(SORT_FULL_GROUP, 'qps'));
});

test('$/month projection uses the 730-hour basis and states it in the UI', () => {
  const html = dashboardHTML();
  // Table-cell tooltip and detail-row meta line, both on the 730 h basis.
  assert.match(html, /title="\\u2248'\+usd\(g\.price\*730\)\+'\/month \(730 h\/month basis\)"/);
  assert.match(html, /<strong>Cost:<\/strong> '\+usd\(g\.price\)\+'\/hr \\u00b7 \\u2248'\+usd\(g\.price\*730\)\+'\/month \(730 h\/month basis\)/);
});

// Extract usdAxis as a pure function. usd() is tuned for a price cell (four
// decimals); axis ticks span three orders of magnitude here, so the two cannot
// share a formatter without either rounding the cheap end to $0.00 or padding
// the expensive end with trailing zeros.
function loadUsdAxis() {
  const html = dashboardHTML();
  const startMarker = '  function usdAxis(v) {';
  const endMarker = '  function ppsFmt(';
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, 'usdAxis is missing');
  assert.notEqual(end, -1, 'usdAxis boundary is missing');

  return vm.runInNewContext(`(${html.slice(start, end).trim()})`);
}

test('currency axis ticks scale precision to the tick magnitude', () => {
  const usdAxis = loadUsdAxis();
  assert.equal(usdAxis(0), '$0');
  // The checked-in dataset spans $0.0024/Gbps to $11.376/hr; every band below
  // has real ticks in it.
  assert.equal(usdAxis(0.0024), '$0.0024');
  assert.equal(usdAxis(0.072), '$0.072');
  assert.equal(usdAxis(1.25), '$1.25');
  assert.equal(usdAxis(5.63), '$5.63');
  assert.equal(usdAxis(12), '$12');
});

test('currency axes use usdAxis, not the price-cell formatter', () => {
  const html = dashboardHTML();
  const ticks = [...html.matchAll(/callback:function\(v\)\{return usd\w*\(v\);\}/g)].map((m) => m[0]);
  assert.deepEqual(
    ticks,
    ['callback:function(v){return usdAxis(v);}', 'callback:function(v){return usdAxis(v);}'],
    'the $/hr and $/Gbps axes both format with usdAxis',
  );
});

test('a negative cost gap is reported as negative overhead, not as wasted spend', () => {
  const overheadTooltipLines = loadOverheadTooltipLines();
  // ComputeOverhead does not clamp, so tailscale > baseline is representable.
  // $0.50/hr at 8 Gbps baseline vs 8.5 Gbps Tailscale: the gap goes negative.
  const lines = Array.from(overheadTooltipLines({
    baseline: 0.0625, tailscale: 0.0588, gap: -0.0037, wasted: -0.0313, price: 0.5,
  }));

  assert.equal(lines.length, 2, 'no wasted-spend line when there is no waste');
  // The magnitude is printed, never a "$-0.0037" or a "+" in front of a negative.
  assert.ok(!lines.some((l) => /\$-/.test(l)), 'no negative currency literal');
  assert.ok(!lines.some((l) => /\+\$/.test(l)), 'no plus sign on a negative delta');
  assert.match(lines[0], /^Delta: −\$0\.0037 per delivered Gbps/);
  assert.match(lines[0], /Tailscale measured faster than the baseline on this run/);
  assert.match(lines[1], /^No wasted spend/);
  assert.match(lines[1], /cost per delivered Gbps falls 5\.9%/);
  assert.match(lines[1], /measurement noise, not a speed-up/);
});

test('overhead cost keeps the sign when Tailscale outruns the baseline', () => {
  const { overheadCost } = loadOverheadCost();
  const faster = {
    price: 0.5,
    modes: {
      'l4-kernel': {
        baseline_tcp: { summary: { bandwidth_mbps_avg: 8000 } },
        tailscale_tcp: { summary: { bandwidth_mbps_avg: 8500 } },
      },
    },
  };
  const cost = overheadCost(faster);
  assert.ok(cost.gap < 0, 'a faster Tailscale run yields a negative gap');
  assert.ok(cost.wasted < 0, 'and negative wasted spend, which the tooltip must not print as positive');
  assert.ok(Number.isFinite(cost.gap) && Number.isFinite(cost.wasted));
});

test('switching cost view restores focus to the view select it replaces', () => {
  const html = dashboardHTML();
  // renderChartSub() replaces the bar's innerHTML, destroying the <select>
  // mid-dispatch; arrow-key navigation fires change per keypress, so focus has
  // to be put back or the next keypress scrolls the page.
  assert.match(html, /var refocus = document\.activeElement===this;/);
  assert.match(html, /if \(refocus\) document\.getElementById\('costView'\)\.focus\(\);/);
});
