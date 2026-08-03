package retry

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"
)

func TestDoRetriesIdempotentTransientOperationWithBoundedBackoff(t *testing.T) {
	transient := errors.New("temporarily unavailable")
	var attempts int
	var delays []time.Duration
	result := Do(
		context.Background(),
		Policy{
			Idempotent:   true,
			MaxAttempts:  4,
			InitialDelay: 100 * time.Millisecond,
			MaxDelay:     250 * time.Millisecond,
		},
		func(attempt int) error {
			attempts = attempt
			if attempt < 3 {
				return transient
			}
			return nil
		},
		func(err error) bool { return errors.Is(err, transient) },
		func(_ context.Context, delay time.Duration) error {
			delays = append(delays, delay)
			return nil
		},
	)

	if result.Err != nil || result.Attempts != 3 || result.Retries != 2 || attempts != 3 {
		t.Fatalf("result = %#v attempts=%d", result, attempts)
	}
	if want := []time.Duration{100 * time.Millisecond, 200 * time.Millisecond}; !reflect.DeepEqual(delays, want) {
		t.Fatalf("delays = %v, want %v", delays, want)
	}
}

func TestDoNeverRetriesAmbiguousSideEffect(t *testing.T) {
	var calls int
	result := Do(
		context.Background(),
		Policy{Idempotent: false, MaxAttempts: 5, InitialDelay: time.Second},
		func(int) error {
			calls++
			return errors.New("unknown create outcome")
		},
		func(error) bool { return true },
		nil,
	)

	if calls != 1 || result.Attempts != 1 || result.Retries != 0 || result.Err == nil {
		t.Fatalf("calls=%d result=%#v, want one failed attempt", calls, result)
	}
}

func TestDoStopsOnPermanentErrorAndContextCancellation(t *testing.T) {
	permanent := errors.New("permission denied")
	var calls int
	result := Do(
		context.Background(),
		Policy{Idempotent: true, MaxAttempts: 5, InitialDelay: time.Second},
		func(int) error {
			calls++
			return permanent
		},
		func(error) bool { return false },
		nil,
	)
	if calls != 1 || !errors.Is(result.Err, permanent) {
		t.Fatalf("permanent calls=%d result=%#v", calls, result)
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	result = Do(
		ctx,
		Policy{Idempotent: true, MaxAttempts: 5, InitialDelay: time.Second},
		func(int) error {
			t.Fatal("operation called after cancellation")
			return nil
		},
		func(error) bool { return true },
		nil,
	)
	if !errors.Is(result.Err, context.Canceled) || result.Attempts != 0 {
		t.Fatalf("canceled result = %#v", result)
	}
}
