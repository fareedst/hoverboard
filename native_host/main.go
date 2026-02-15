// [REQ-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [IMPL-NATIVE_HOST_WRAPPER]
// Thin native messaging host: stdio protocol, resolve install dir, delegate to helper in same dir or respond with pong.
package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

const (
	maxMessageLenFromChrome = 64 * 1024 * 1024 // 64 MiB
	maxMessageLenToChrome   = 1024 * 1024       // 1 MB
	hostName                = "com.hoverboard.native_host"
)

func logStderr(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, "DEBUG: [native_host] "+format+"\n", args...)
}

func logTrace(format string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, "TRACE: [native_host] "+format+"\n", args...)
}

func main() {
	// [IMPL-NATIVE_HOST_WRAPPER] Resolve install dir from executable path; never use extension path.
	execPath, err := os.Executable()
	if err != nil {
		logStderr("os.Executable failed: %v", err)
		os.Exit(1)
	}
	installDir := filepath.Dir(execPath)
	logTrace("install dir resolved: %s", installDir)

	// [IMPL-NATIVE_HOST_WRAPPER] Read Chrome native messaging protocol: 4-byte length (native order) + JSON.
	msg, err := readMessage(os.Stdin, maxMessageLenFromChrome)
	if err != nil {
		logStderr("read message failed: %v", err)
		os.Exit(1)
	}

	var req map[string]interface{}
	if err := json.Unmarshal(msg, &req); err != nil {
		sendErrorResponse(fmt.Sprintf("invalid JSON: %v", err))
		os.Exit(1)
	}

	// [IMPL-NATIVE_HOST_WRAPPER] Ping: respond with pong without calling helper.
	if t, _ := req["type"].(string); t == "ping" {
		logTrace("ping received, responding with pong")
		sendResponse(map[string]interface{}{"type": "pong"})
		return
	}

	// [IMPL-NATIVE_HOST_WRAPPER] Delegate to helper in same dir; if helper missing or fails, respond with error or pong fallback.
	resp, err := callHelper(installDir, msg)
	if err != nil {
		logStderr("helper call failed: %v", err)
		sendResponse(map[string]interface{}{"type": "error", "message": err.Error()})
		return
	}
	sendResponse(resp)
}

func readMessage(r io.Reader, maxLen int) ([]byte, error) {
	var lenBuf [4]byte
	if _, err := io.ReadFull(r, lenBuf[:]); err != nil {
		return nil, err
	}
	msgLen := binary.NativeEndian.Uint32(lenBuf[:])
	if msgLen > uint32(maxLen) {
		return nil, fmt.Errorf("message length %d exceeds max %d", msgLen, maxLen)
	}
	buf := make([]byte, msgLen)
	if _, err := io.ReadFull(r, buf); err != nil {
		return nil, err
	}
	return buf, nil
}

func sendResponse(obj map[string]interface{}) {
	data, err := json.Marshal(obj)
	if err != nil {
		logStderr("json marshal: %v", err)
		os.Exit(1)
	}
	if len(data) > maxMessageLenToChrome {
		logStderr("response too large: %d", len(data))
		os.Exit(1)
	}
	if err := writeMessage(os.Stdout, data); err != nil {
		logStderr("write message: %v", err)
		os.Exit(1)
	}
}

func sendErrorResponse(message string) {
	sendResponse(map[string]interface{}{"type": "error", "message": message})
}

func writeMessage(w io.Writer, data []byte) error {
	lenBuf := make([]byte, 4)
	binary.NativeEndian.PutUint32(lenBuf, uint32(len(data)))
	if _, err := w.Write(lenBuf); err != nil {
		return err
	}
	_, err := w.Write(data)
	return err
}

// findHelper returns path to helper script/binary in installDir, or error if not found.
func findHelper(installDir string) (string, error) {
	if runtime.GOOS == "windows" {
		for _, name := range []string{"helper.exe", "helper.ps1"} {
			p := filepath.Join(installDir, name)
			if _, err := os.Stat(p); err == nil {
				return p, nil
			}
		}
		return "", fmt.Errorf("helper not found")
	}
	p := filepath.Join(installDir, "helper.sh")
	if _, err := os.Stat(p); err != nil {
		return "", err
	}
	return p, nil
}

// callHelper runs helper in installDir with message on stdin; reads JSON from stdout.
func callHelper(installDir string, msg []byte) (map[string]interface{}, error) {
	helperPath, err := findHelper(installDir)
	if err != nil {
		logTrace("helper not found, returning echo")
		var echo map[string]interface{}
		if err := json.Unmarshal(msg, &echo); err != nil {
			return map[string]interface{}{"type": "pong"}, nil
		}
		return echo, nil
	}

	var cmd *exec.Cmd
	if filepath.Ext(helperPath) == ".ps1" {
		cmd = exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-NoProfile", "-File", helperPath)
	} else {
		cmd = exec.Command(helperPath)
	}
	cmd.Dir = installDir
	cmd.Stdin = bytes.NewReader(msg)
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	out, err := io.ReadAll(stdoutPipe)
	if err != nil {
		cmd.Process.Kill()
		return nil, err
	}
	if err := cmd.Wait(); err != nil {
		return nil, err
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(out, &resp); err != nil {
		return nil, fmt.Errorf("helper returned invalid JSON: %w", err)
	}
	return resp, nil
}
