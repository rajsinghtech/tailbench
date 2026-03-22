package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/rajsinghtech/tailbench/internal/config"
	"github.com/rajsinghtech/tailbench/internal/orchestrator"
)

func main() {
	cfg, err := config.Parse()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	orch, err := orchestrator.New(cfg)
	if err != nil {
		log.Fatalf("orchestrator: %v", err)
	}
	if err := orch.Run(ctx); err != nil {
		log.Fatalf("tailbench: %v", err)
	}
}
