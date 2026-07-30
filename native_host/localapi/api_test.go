// [REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
package localapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestFilterBookmarks(t *testing.T) {
	list := []Bookmark{
		{URL: "https://a.example/", Description: "Alpha", Extended: "note one", Tags: "foo bar"},
		{URL: "https://b.example/", Description: "Beta", Tags: []string{"baz"}},
	}
	got := FilterBookmarks(list, "alpha", "", "")
	if len(got) != 1 || got[0].URL != "https://a.example/" {
		t.Fatalf("q filter: %#v", got)
	}
	got = FilterBookmarks(list, "", "baz", "")
	if len(got) != 1 || got[0].URL != "https://b.example/" {
		t.Fatalf("tag filter: %#v", got)
	}
	got = FilterBookmarks(list, "", "", "https://a.example/")
	if len(got) != 1 {
		t.Fatalf("url filter: %#v", got)
	}
}

func TestAuthAndList(t *testing.T) {
	dir := t.TempDir()
	store := fileStore{
		Version: 1,
		Bookmarks: map[string]*Bookmark{
			"https://x.test/": {URL: "https://x.test/", Description: "X", Extended: "hello", Tags: "t"},
		},
	}
	raw, _ := json.Marshal(store)
	path := filepath.Join(dir, BookmarksFileName)
	if err := os.WriteFile(path, raw, 0o600); err != nil {
		t.Fatal(err)
	}
	srv, err := NewServer(Config{InstallDir: dir, Port: 18787, Token: "secret", BookmarksPath: path})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/bookmarks?q=hello", nil)
	rr := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without token, got %d", rr.Code)
	}
	req = httptest.NewRequest(http.MethodGet, "/v1/bookmarks?q=hello", nil)
	req.Header.Set("Authorization", "Bearer secret")
	rr = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d %s", rr.Code, rr.Body.String())
	}
	var body struct {
		Count     int        `json:"count"`
		Bookmarks []Bookmark `json:"bookmarks"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Count != 1 || body.Bookmarks[0].URL != "https://x.test/" {
		t.Fatalf("unexpected body: %#v", body)
	}
}

func TestHealthAndEnsureToken(t *testing.T) {
	dir := t.TempDir()
	tok, err := EnsureToken(dir)
	if err != nil || tok == "" {
		t.Fatalf("EnsureToken: %v %q", err, tok)
	}
	tok2, err := EnsureToken(dir)
	if err != nil || tok2 != tok {
		t.Fatalf("token not stable: %q vs %q", tok, tok2)
	}
	srv, err := NewServer(Config{InstallDir: dir, Port: 18788, Token: tok})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rr := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("health: %d", rr.Code)
	}
}

func TestWriteAndDeleteFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, BookmarksFileName)
	srv, err := NewServer(Config{InstallDir: dir, Port: 1, Token: "t", BookmarksPath: path})
	if err != nil {
		t.Fatal(err)
	}
	body := `{"url":"https://w.test/","description":"W","extended":"n","tags":"a"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/bookmarks", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer t")
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("POST: %d %s", rr.Code, rr.Body.String())
	}
	req = httptest.NewRequest(http.MethodDelete, "/v1/bookmarks?url=https://w.test/", nil)
	req.Header.Set("Authorization", "Bearer t")
	rr = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("DELETE: %d", rr.Code)
	}
}

func TestPreferAggregateSnapshot(t *testing.T) {
	dir := t.TempDir()
	filePath := filepath.Join(dir, BookmarksFileName)
	snapPath := filepath.Join(dir, SnapshotFileName)
	fileStoreData := fileStore{
		Version: 1,
		Bookmarks: map[string]*Bookmark{
			"https://file-only.test/": {URL: "https://file-only.test/", Description: "File"},
		},
	}
	raw, _ := json.Marshal(fileStoreData)
	if err := os.WriteFile(filePath, raw, 0o600); err != nil {
		t.Fatal(err)
	}
	snap := map[string]interface{}{
		"version": 1,
		"bookmarks": []Bookmark{
			{URL: "https://snap.test/", Description: "FromSnapshot", Storage: "local"},
		},
	}
	snapRaw, _ := json.Marshal(snap)
	if err := os.WriteFile(snapPath, snapRaw, 0o600); err != nil {
		t.Fatal(err)
	}
	srv, err := NewServer(Config{
		InstallDir:    dir,
		Port:          1,
		Token:         "secret",
		BookmarksPath: filePath,
		SnapshotPath:  snapPath,
	})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodGet, "/v1/health", nil)
	req.Header.Set("Authorization", "Bearer secret")
	rr := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("health: %d", rr.Code)
	}
	var health map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &health); err != nil {
		t.Fatal(err)
	}
	if health["source"] != "snapshot" {
		t.Fatalf("expected source snapshot, got %#v", health["source"])
	}
	req = httptest.NewRequest(http.MethodGet, "/v1/bookmarks", nil)
	req.Header.Set("Authorization", "Bearer secret")
	rr = httptest.NewRecorder()
	srv.Handler().ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("list: %d %s", rr.Code, rr.Body.String())
	}
	var body struct {
		Bookmarks []Bookmark `json:"bookmarks"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Bookmarks) != 1 || body.Bookmarks[0].URL != "https://snap.test/" {
		t.Fatalf("expected snapshot bookmarks, got %#v", body.Bookmarks)
	}
}
