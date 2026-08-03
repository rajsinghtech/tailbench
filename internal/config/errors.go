package config

import "fmt"

type ErrorKind string

const (
	ErrorReadConfig      ErrorKind = "read-config"
	ErrorParseConfig     ErrorKind = "parse-config"
	ErrorEnvironmentFile ErrorKind = "environment-file"
)

type LoadError struct {
	Kind ErrorKind
	Path string
	Err  error
}

func (e *LoadError) Error() string {
	if e == nil {
		return ""
	}
	switch e.Kind {
	case ErrorReadConfig:
		return fmt.Sprintf("read configuration %s: %v", e.Path, e.Err)
	case ErrorParseConfig:
		return fmt.Sprintf("parse configuration %s: %v", e.Path, e.Err)
	case ErrorEnvironmentFile:
		return fmt.Sprintf("load environment file %s: %v", e.Path, e.Err)
	default:
		return fmt.Sprintf("load configuration source %s: %v", e.Path, e.Err)
	}
}

func (e *LoadError) Unwrap() error {
	if e == nil {
		return nil
	}
	return e.Err
}
