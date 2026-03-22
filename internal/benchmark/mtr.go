package benchmark

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/rajsinghtech/tailbench/internal/result"
)

var mtrLineRe = regexp.MustCompile(`^\s*(\d+)\.\|--\s+(\S+)\s+(\S+)%\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)`)

// ParseMTR parses the text output of `mtr --report` into an MTRResult.
func ParseMTR(output string, targetIP string) (*result.MTRResult, error) {
	res := &result.MTRResult{
		TargetIP: targetIP,
	}
	for _, line := range strings.Split(output, "\n") {
		m := mtrLineRe.FindStringSubmatch(line)
		if m == nil {
			continue
		}
		hop, _ := strconv.Atoi(m[1])
		lossPct, err := strconv.ParseFloat(m[3], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing loss%% for hop %d: %w", hop, err)
		}
		snt, _ := strconv.Atoi(m[4])
		last, err := strconv.ParseFloat(m[5], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing last for hop %d: %w", hop, err)
		}
		avg, err := strconv.ParseFloat(m[6], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing avg for hop %d: %w", hop, err)
		}
		best, err := strconv.ParseFloat(m[7], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing best for hop %d: %w", hop, err)
		}
		worst, err := strconv.ParseFloat(m[8], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing worst for hop %d: %w", hop, err)
		}
		stdev, err := strconv.ParseFloat(m[9], 64)
		if err != nil {
			return nil, fmt.Errorf("parsing stdev for hop %d: %w", hop, err)
		}
		res.Hops = append(res.Hops, result.MTRHop{
			Hop:     hop,
			Host:    m[2],
			LossPct: lossPct,
			Snt:     snt,
			LastMs:  last,
			AvgMs:   avg,
			BestMs:  best,
			WorstMs: worst,
			StdevMs: stdev,
		})
	}
	return res, nil
}
