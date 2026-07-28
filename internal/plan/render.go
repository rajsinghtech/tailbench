package plan

import (
	"fmt"
	"io"
	"strings"
)

func (p *Plan) WriteText(dst io.Writer) error {
	if p == nil {
		return fmt.Errorf("plan is nil")
	}
	if _, err := fmt.Fprintln(dst, "TAILBENCH LOCAL PLAN"); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(dst, "SIDE EFFECTS: none"); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "provider: %s\nworkload: %s\n", p.Provider, p.Workload); err != nil {
		return err
	}
	if p.Region != "" {
		if _, err := fmt.Fprintf(dst, "region: %s\n", p.Region); err != nil {
			return err
		}
	}
	if p.Zone != "" {
		if _, err := fmt.Fprintf(dst, "zone: %s\n", p.Zone); err != nil {
			return err
		}
	}
	if _, err := fmt.Fprintf(
		dst,
		"selector: family=%s filter=%q\n",
		p.Selector.Family,
		p.Selector.Filter,
	); err != nil {
		return err
	}

	if _, err := fmt.Fprintln(dst, "configured modes:"); err != nil {
		return err
	}
	for _, mode := range p.ConfiguredModes {
		status := "applicable"
		if !mode.Applicable {
			status = "not-applicable"
		}
		detail := ""
		if mode.Reason != "" {
			detail = ": " + mode.Reason
		}
		if _, err := fmt.Fprintf(dst, "  - %s: %s%s\n", mode.Name, status, detail); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintln(dst, "instances:"); err != nil {
		return err
	}
	if len(p.Instances) == 0 {
		if _, err := fmt.Fprintln(dst, "  (none resolved from local catalog)"); err != nil {
			return err
		}
	}
	for _, instance := range p.Instances {
		if _, err := fmt.Fprintf(
			dst,
			"  - %s (%d vCPUs, estimated $%.5f/hour)\n",
			instance.Type,
			instance.VCPUs,
			instance.HourlyUSD,
		); err != nil {
			return err
		}
		for _, mode := range instance.Modes {
			detail := ""
			if mode.Reason != "" {
				detail = ": " + mode.Reason
			}
			if _, err := fmt.Fprintf(dst, "      %s: %s%s\n", mode.Name, mode.Action, detail); err != nil {
				return err
			}
		}
	}

	if _, err := fmt.Fprintf(
		dst,
		"maximum resources: compute=%d servers=%d clients=%d routers=%d clusters=%d node-pools=%d load-balancers=%d\n",
		p.Resources.MaximumComputeResources,
		p.Resources.MaximumServers,
		p.Resources.MaximumClients,
		p.Resources.MaximumRouters,
		p.Resources.MaximumClusters,
		p.Resources.MaximumNodePools,
		p.Resources.MaximumLoadBalancers,
	); err != nil {
		return err
	}
	if p.Cost.Estimate {
		if _, err := fmt.Fprintf(
			dst,
			"estimated maximum compute rate: $%.5f/hour\n",
			p.Cost.MaximumHourlyUSD,
		); err != nil {
			return err
		}
		if _, err := fmt.Fprintf(
			dst,
			"estimated upper bound for %s: $%.2f (guardrail $%.2f)\n",
			p.Cost.EstimateWindow,
			p.Cost.UpperBoundUSD,
			p.Guardrails.MaxCostUSD,
		); err != nil {
			return err
		}
	} else {
		if _, err := fmt.Fprintln(dst, "estimated maximum compute rate: unavailable"); err != nil {
			return err
		}
	}
	if _, err := fmt.Fprintf(dst, "price data: %s (updated %s)\n", p.Cost.DataSource, p.Cost.DataUpdated); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(
		dst,
		"guardrails: duration=%s instance-types=%d concurrent-topologies=%d cleanup=%s\n",
		p.Guardrails.MaxDuration,
		p.Guardrails.MaxInstanceTypes,
		p.Guardrails.MaxConcurrentResources,
		p.Guardrails.CleanupPolicy,
	); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "required tools: %s\n", strings.Join(p.RequiredTools, ", ")); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(dst, "required credentials for execution: %s\n", strings.Join(p.RequiredCredentials, ", ")); err != nil {
		return err
	}
	for _, warning := range p.Warnings {
		if _, err := fmt.Fprintf(dst, "warning: %s\n", warning); err != nil {
			return err
		}
	}
	return nil
}
