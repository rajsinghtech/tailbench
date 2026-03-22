package main

import (
	"fmt"
	"os"

	"github.com/rajsinghtech/tailbench/internal/result"
)

func main() {
	dir, _ := os.Getwd()
	if err := result.Aggregate(dir); err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
	fmt.Println("aggregated")
}
