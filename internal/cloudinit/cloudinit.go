package cloudinit

import (
	"bytes"
	"embed"
	"text/template"
)

//go:embed setup.sh.tmpl
var tmplFS embed.FS

type Config struct {
	AuthKey   string
	Hostname  string
	EnableSSH bool
}

func Render(cfg Config) (string, error) {
	tmpl, err := template.ParseFS(tmplFS, "setup.sh.tmpl")
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, cfg); err != nil {
		return "", err
	}
	return buf.String(), nil
}
