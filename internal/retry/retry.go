// Package retry provides bounded retries for operations whose callers have
// explicitly declared them idempotent.
package retry

import (
	"context"
	"errors"
	"time"
)

type Policy struct {
	Idempotent   bool
	MaxAttempts  int
	InitialDelay time.Duration
	MaxDelay     time.Duration
}

type Result struct {
	Attempts int
	Retries  int
	Err      error
}

type Operation func(attempt int) error
type Retryable func(error) bool
type WaitFunc func(context.Context, time.Duration) error

func Do(
	ctx context.Context,
	policy Policy,
	operation Operation,
	retryable Retryable,
	wait WaitFunc,
) Result {
	if err := ctx.Err(); err != nil {
		return Result{Err: err}
	}
	if operation == nil {
		return Result{Err: errors.New("retry operation is required")}
	}
	maxAttempts := policy.MaxAttempts
	if maxAttempts < 1 {
		maxAttempts = 1
	}
	if !policy.Idempotent {
		maxAttempts = 1
	}
	delay := policy.InitialDelay
	if delay <= 0 {
		delay = 100 * time.Millisecond
	}
	maxDelay := policy.MaxDelay
	if maxDelay <= 0 {
		maxDelay = 5 * time.Second
	}
	if delay > maxDelay {
		delay = maxDelay
	}
	if wait == nil {
		wait = waitForTimer
	}

	result := Result{}
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if err := ctx.Err(); err != nil {
			result.Err = err
			return result
		}
		result.Attempts = attempt
		err := operation(attempt)
		if err == nil {
			result.Err = nil
			return result
		}
		result.Err = err
		if attempt == maxAttempts || retryable == nil || !retryable(err) {
			return result
		}
		if err := wait(ctx, delay); err != nil {
			result.Err = err
			return result
		}
		result.Retries++
		if delay < maxDelay {
			delay *= 2
			if delay > maxDelay || delay <= 0 {
				delay = maxDelay
			}
		}
	}
	return result
}

func waitForTimer(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}
