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

test('headline stats include cost and forwarding efficiency', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(html, /<div class="stat-label">Avg cost<\/div>/);
  assert.match(html, /<div class="stat-label">Best pps\/\$<\/div>/);
});
