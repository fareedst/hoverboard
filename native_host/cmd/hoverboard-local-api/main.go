// [REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
// Companion localhost HTTP API for File/snapshot bookmarks.
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/hoverboard/native_host/localapi"
)

func main() {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: home: %v\n", err)
		os.Exit(1)
	}
	installDir := os.Getenv("HOVERBOARD_HOME")
	if installDir == "" {
		installDir = filepath.Join(home, ".hoverboard")
	}
	port := localapi.DefaultPort
	if p := os.Getenv("HOVERBOARD_API_PORT"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			port = n
		}
	}
	srv, err := localapi.NewServer(localapi.Config{
		InstallDir: installDir,
		Port:       port,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: %v\n", err)
		os.Exit(1)
	}
	fmt.Fprintf(os.Stderr, "DEBUG: [localapi] token file: %s/%s\n", installDir, localapi.TokenFileName)
	if err := srv.ListenAndServe(); err != nil {
		fmt.Fprintf(os.Stderr, "ERROR: serve: %v\n", err)
		os.Exit(1)
	}
}
