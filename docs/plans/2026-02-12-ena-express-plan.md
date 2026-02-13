# ENA Express (SRD) Benchmark Tests — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interleaved ENA Express (AWS SRD) benchmark tests that appear as separate rows in the Tailbench dashboard.

**Architecture:** After a standard AWS benchmark run on a provisioned VM pair, enable ENA Express on both ENIs and re-run the full benchmark suite. Results are stored as separate JSON files (`$instance-ena-express.json`) and rendered as distinct rows in the UI with an "ENA" badge.

**Tech Stack:** Bash (orchestration/benchmarks), AWS CLI (ENI modification), vanilla JS/HTML (dashboard)

---

### Task 1: Add ENA Express helper functions to lib/aws.sh

**Files:**
- Modify: `lib/aws.sh` (append after `aws_list_instances` function, ~line 520)

**Step 1: Add `aws_ena_express_families` function**

Append to `lib/aws.sh`:

```bash
aws_ena_express_families() {
  echo "c6in c7gn c8gn c7i c8g"
}
```

**Step 2: Add `aws_enable_ena_express` function**

Append to `lib/aws.sh`:

```bash
aws_enable_ena_express() {
  local name="$1"
  local instance_id
  instance_id=$(_aws_resolve_instance_id "$name") || {
    log_error "Cannot resolve instance $name for ENA Express"
    return 1
  }

  local eni_id
  eni_id=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --instance-ids "$instance_id" \
    --query 'Reservations[0].Instances[0].NetworkInterfaces[0].NetworkInterfaceId' \
    --output text)

  if [[ -z "$eni_id" || "$eni_id" == "None" ]]; then
    log_error "No ENI found for instance $name ($instance_id)"
    return 1
  fi

  log_info "Enabling ENA Express (SRD) on $name ENI $eni_id"
  aws ec2 modify-network-interface-attribute \
    --region "$AWS_REGION" \
    --network-interface-id "$eni_id" \
    --ena-srd-specification 'EnaSrdEnabled=true,EnaSrdUdpSpecification={EnaSrdUdpEnabled=true}'
}
```

**Step 3: Verify syntax**

Run: `bash -n lib/aws.sh`
Expected: no output (clean parse)

**Step 4: Commit**

```bash
git add lib/aws.sh
git commit -m "Add ENA Express helper functions to AWS library"
```

---

### Task 2: Add ENA Express support to run-benchmark.sh

**Files:**
- Modify: `scripts/run-benchmark.sh`

**Step 1: Add ENA_EXPRESS env var handling at top of script**

After the existing variable assignments (line 23, after `client_lan_ip="$5"`), add:

```bash
ena_express="${ENA_EXPRESS:-false}"
```

**Step 2: Add `ena_express` field to result JSON**

In the `jq -n` call that builds the result JSON (~line 176), add a new arg and field:

Add to the `jq -n` arguments (after `--argjson tailscale_mtr`):
```
--argjson ena_express "$( [[ "$ena_express" == "true" ]] && echo true || echo false )"
```

Add to the JSON template (after `connection_type: $connection_type,`):
```
ena_express: $ena_express,
```

**Step 3: Change output filename when ENA Express is active**

Replace the output path block (~lines 250-253):

```bash
outdir="$TAILBENCH_ROOT/$CLOUD_PROVIDER/$family/results"
mkdir -p "$outdir"
if [[ "$ena_express" == "true" ]]; then
  outfile="$outdir/$instance_type-ena-express.json"
else
  outfile="$outdir/$instance_type.json"
fi
```

**Step 4: Add ENA Express to log output**

After the existing log lines at the end of the script (~line 261), add:

```bash
if [[ "$ena_express" == "true" ]]; then
  log_info "ENA Express: enabled"
fi
```

**Step 5: Verify syntax**

Run: `bash -n scripts/run-benchmark.sh`
Expected: no output (clean parse)

**Step 6: Commit**

```bash
git add scripts/run-benchmark.sh
git commit -m "Support ENA Express flag in benchmark output"
```

---

### Task 3: Add ENA Express interleaved run to orchestrate.sh

**Files:**
- Modify: `scripts/orchestrate.sh`

**Step 1: Add ENA Express family check helper**

After the `_run_provider()` function declaration (around line 89, before the loop), add inside the function body at the top (after `source "$TAILBENCH_ROOT/lib/cleanup.sh"`):

```bash
  # ENA Express eligible families (AWS only)
  local _ena_families=""
  if [[ "$provider" == "aws" ]]; then
    _ena_families=" $(aws_ena_express_families) "
  fi
```

**Step 2: Add ENA Express interleaved run**

Inside the main instance loop, after the successful standard benchmark block (`if [[ -z "$step_failed" ]]; then ... fi` for the benchmark step, ~line 212) and BEFORE the teardown line (`"$TAILBENCH_ROOT/scripts/teardown-pair.sh"`), insert:

```bash
    # ENA Express interleaved run (AWS only, eligible families)
    if [[ -z "$step_failed" && -n "$_ena_families" && "$_ena_families" == *" $family "* ]]; then
      local ena_result="$TAILBENCH_ROOT/$provider/$family/results/$inst-ena-express.json"
      if [[ -f "$ena_result" ]]; then
        log_info "[$provider][$n/$total] Skipping ENA Express for $inst (result exists)"
      else
        log_info "[$provider][$n/$total] Enabling ENA Express on $inst pair"
        local ena_failed=""
        if aws_enable_ena_express "$SERVER_NAME" && aws_enable_ena_express "$CLIENT_NAME"; then
          sleep 5
          log_info "[$provider][$n/$total] Running ENA Express benchmark for $inst"
          if ! ENA_EXPRESS=true "$TAILBENCH_ROOT/scripts/run-benchmark.sh" \
              "$inst" "$SERVER_NAME" "$CLIENT_NAME" \
              "$SERVER_LAN_IP" "$CLIENT_LAN_IP"; then
            log_error "[$provider] ENA Express benchmark failed for $inst"
            ena_failed="benchmark"
          fi
        else
          log_error "[$provider] Failed to enable ENA Express on $inst"
          ena_failed="ena-setup"
        fi

        if [[ -z "$ena_failed" && -f "$ena_result" ]]; then
          local ena_baseline ena_ts_bw ena_overhead
          ena_baseline=$(jq -r '.baseline_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$ena_result")
          ena_ts_bw=$(jq -r '.tailscale_tcp.summary.bandwidth_mbps_avg / 1000 | . * 100 | round / 100' "$ena_result")
          ena_overhead=$(jq -r '.overhead.bandwidth_pct | . * 10 | round / 10' "$ena_result")
          result_lines+=("$(printf '%-20s %-17s %-18s %s%%' "$inst (ENA)" "$ena_baseline" "$ena_ts_bw" "$ena_overhead")")
          echo "$inst-ena-express|OK|" >> "$status_file"
        elif [[ -n "$ena_failed" ]]; then
          result_lines+=("$(printf '%-20s FAILED (%s)' "$inst (ENA)" "$ena_failed")")
          echo "$inst-ena-express|FAILED|$ena_failed" >> "$status_file"
        fi
      fi
    fi
```

**Step 3: Handle ENA Express in resume check for existing results**

The existing resume check at ~line 166 only checks for the standard result. The ENA Express result is checked separately in the block above, so no change needed — when the standard result exists but ENA Express doesn't, the standard run is skipped but the ENA Express check still runs on next execution (the pair won't exist though). This is acceptable since both are created in the same provision cycle.

**Step 4: Verify syntax**

Run: `bash -n scripts/orchestrate.sh`
Expected: no output (clean parse)

**Step 5: Commit**

```bash
git add scripts/orchestrate.sh
git commit -m "Add interleaved ENA Express benchmark run for eligible AWS families"
```

---

### Task 4: Update dashboard UI for ENA Express rows

**Files:**
- Modify: `website/index.html`

**Step 1: Add ENA badge CSS**

In the `<style>` section, after `.cloud-tag` styles (~line 269), add:

```css
.ena-tag {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 6px;
  background: var(--yellow-bg);
  color: var(--yellow);
}
```

**Step 2: Update instance type display in renderTable()**

In the `renderTable()` function, find the line that renders the instance type cell (~line 798):

```javascript
html += '<td><span class="instance-type">' + d.instance_type + '</span><span class="instance-family-tag">' + d.instance_family.toUpperCase() + '</span></td>';
```

Replace with:

```javascript
html += '<td><span class="instance-type">' + d.instance_type + '</span><span class="instance-family-tag">' + d.instance_family.toUpperCase() + '</span>' + (d.ena_express ? '<span class="ena-tag">ENA Express</span>' : '') + '</td>';
```

**Step 3: Update detail view metadata**

In the `renderDetail()` function, after the connection_type meta item rendering, add ENA Express to the metadata section. Find the line with `<strong>iperf3:</strong>` (~line 860) and add before it:

```javascript
if (d.ena_express) {
  html += '<div class="detail-meta-item"><strong>ENA Express:</strong> enabled</div>';
}
```

**Step 4: Update sort/expand key to handle duplicate instance types**

The current expand state uses `d.instance_type` as the key. With ENA Express, two rows may have the same `instance_type`. We need a unique key.

In the `renderTable()` function, generate a unique row key:

Replace all occurrences of `d.instance_type` used as row identifiers with a computed key. Add this at the top of the `data.forEach` callback in `renderTable()`:

```javascript
var rowKey = d.instance_type + (d.ena_express ? '-ena' : '');
```

Then replace `data-instance="' + d.instance_type + '"` with `data-instance="' + rowKey + '"` (3 occurrences: data-row, detail-row, btn-details), and `state.expanded === d.instance_type` with `state.expanded === rowKey`.

**Step 5: Verify by opening index.html in browser**

Open `website/index.html` in a browser. If there's any `data.generated.js` with existing results, the page should render without JS errors. ENA Express rows (if any) should show the amber "ENA Express" badge.

**Step 6: Commit**

```bash
git add website/index.html
git commit -m "Display ENA Express rows with badge in dashboard"
```

---

### Task 5: Update dry-run output for ENA Express

**Files:**
- Modify: `scripts/orchestrate.sh`

**Step 1: Add ENA Express to dry-run preview**

In the dry-run section (~line 335), inside the instance loop (after the `-> $p/$family/results/$inst.json` echo), add:

```bash
        if [[ "$p" == "aws" ]]; then
          local _dr_ena_fams=" $(aws_ena_express_families) "
          if [[ "$_dr_ena_fams" == *" $family "* ]]; then
            echo "  [ENA Express] enable SRD on both ENIs"
            echo "  run-benchmark.sh $inst <server> <client> <s_lan> <c_lan> (ENA Express)"
            echo "  -> $p/$family/results/$inst-ena-express.json"
          fi
        fi
```

Note: `aws_ena_express_families` may not be available in dry-run since provider libs aren't fully loaded. To handle this, source the aws lib conditionally in the dry-run block. The dry-run already does `source "$TAILBENCH_ROOT/lib/provider.sh"` inside the subshell, so `aws_ena_express_families` will be available when `$p == "aws"`.

**Step 2: Verify syntax**

Run: `bash -n scripts/orchestrate.sh`
Expected: no output (clean parse)

**Step 3: Commit**

```bash
git add scripts/orchestrate.sh
git commit -m "Show ENA Express steps in dry-run output"
```

---

### Task 6: End-to-end verification

**Step 1: Dry-run test**

Run the orchestrator in dry-run mode for an ENA Express eligible family:

```bash
cd /Users/rajsingh/Documents/GitHub/tailbench
./scripts/orchestrate.sh --provider aws --family c6in --dry-run --no-create-tailnet
```

Expected: output should show both standard and ENA Express steps for each c6in instance.

**Step 2: Syntax check all modified files**

```bash
bash -n lib/aws.sh && bash -n scripts/orchestrate.sh && bash -n scripts/run-benchmark.sh && echo "All OK"
```

Expected: `All OK`

**Step 3: Create mock ENA Express result for UI testing (optional)**

To test the UI without running actual benchmarks, copy an existing result and add `ena_express: true`:

```bash
# Only if you have an existing AWS result to test with
cp aws/c6in/results/c6in.xlarge.json aws/c6in/results/c6in.xlarge-ena-express.json
jq '. + {ena_express: true}' aws/c6in/results/c6in.xlarge-ena-express.json > /tmp/ena.json && mv /tmp/ena.json aws/c6in/results/c6in.xlarge-ena-express.json
./scripts/generate-results.sh
# Open website/index.html — should see two c6in.xlarge rows, one with ENA Express badge
```

**Step 4: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "ENA Express benchmark support for AWS instances"
```
