// [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Tests for native host protocol and behavior.
package main

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
)

// TestReadMessage_REQ_NATIVE_HOST_WRAPPER validates Chrome native messaging protocol read: 4-byte length + JSON.
func TestReadMessage_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	payload := []byte(`{"type":"ping"}`)
	buf := make([]byte, 4)
	binary.NativeEndian.PutUint32(buf, uint32(len(payload)))
	buf = append(buf, payload...)

	r := bytes.NewReader(buf)
	out, err := readMessage(r, 64*1024*1024)
	if err != nil {
		t.Fatalf("readMessage: %v", err)
	}
	if !bytes.Equal(out, payload) {
		t.Errorf("got %q, want %q", out, payload)
	}
}

// TestReadMessage_LengthLimit_REQ_NATIVE_HOST_WRAPPER rejects message exceeding max length.
func TestReadMessage_LengthLimit_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	maxLen := 100
	buf := make([]byte, 4)
	binary.NativeEndian.PutUint32(buf, uint32(maxLen+1))

	_, err := readMessage(bytes.NewReader(buf), maxLen)
	if err == nil {
		t.Error("expected error for oversized message")
	}
}

// TestWriteMessage_REQ_NATIVE_HOST_WRAPPER validates Chrome native messaging protocol write: 4-byte length + JSON.
func TestWriteMessage_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	payload := []byte(`{"type":"pong"}`)
	var buf bytes.Buffer
	err := writeMessage(&buf, payload)
	if err != nil {
		t.Fatalf("writeMessage: %v", err)
	}
	out := buf.Bytes()
	if len(out) < 4 {
		t.Fatalf("output too short: %d", len(out))
	}
	msgLen := binary.NativeEndian.Uint32(out[:4])
	if msgLen != uint32(len(payload)) {
		t.Errorf("length prefix: got %d, want %d", msgLen, len(payload))
	}
	if !bytes.Equal(out[4:], payload) {
		t.Errorf("body: got %q, want %q", out[4:], payload)
	}
}

// TestFindHelper_NoHelper_REQ_NATIVE_HOST_WRAPPER returns error when no helper in dir.
func TestFindHelper_NoHelper_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	dir := t.TempDir()
	_, err := findHelper(dir)
	if err == nil {
		t.Error("expected error when no helper present")
	}
}

// TestFindHelper_HelperSh_REQ_NATIVE_HOST_WRAPPER finds helper.sh on Unix.
func TestFindHelper_HelperSh_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Unix helper only")
	}
	dir := t.TempDir()
	helperPath := filepath.Join(dir, "helper.sh")
	if err := os.WriteFile(helperPath, []byte("#!/bin/sh\ncat\n"), 0755); err != nil {
		t.Fatalf("write helper: %v", err)
	}
	got, err := findHelper(dir)
	if err != nil {
		t.Fatalf("findHelper: %v", err)
	}
	if got != helperPath {
		t.Errorf("got %q, want %q", got, helperPath)
	}
}

// TestPingPongIntegration_REQ_NATIVE_HOST_WRAPPER runs binary with ping on stdin and asserts pong on stdout.
func TestPingPongIntegration_REQ_NATIVE_HOST_WRAPPER(t *testing.T) {
	_, testPath, _, _ := runtime.Caller(0)
	nativeHostDir := filepath.Dir(testPath)

	payload := []byte(`{"type":"ping"}`)
	lenBuf := make([]byte, 4)
	binary.NativeEndian.PutUint32(lenBuf, uint32(len(payload)))
	stdin := append(lenBuf, payload...)

	cmd := exec.Command("go", "run", ".")
	cmd.Dir = nativeHostDir
	cmd.Stdin = bytes.NewReader(stdin)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		t.Logf("stderr: %s", stderr.String())
		t.Fatalf("run: %v", err)
	}

	out := stdout.Bytes()
	if len(out) < 4 {
		t.Fatalf("stdout too short: %d", len(out))
	}
	respLen := binary.NativeEndian.Uint32(out[:4])
	if int(respLen) > len(out)-4 {
		t.Fatalf("invalid length prefix: %d", respLen)
	}
	var resp map[string]interface{}
	if err := json.Unmarshal(out[4:4+respLen], &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp["type"] != "pong" {
		t.Errorf("response type: got %v, want pong", resp["type"])
	}
}
