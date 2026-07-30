// [REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
// Localhost HTTP API over File-backend hoverboard-bookmarks.json.
package localapi

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	DefaultPort       = 8787
	TokenFileName     = "api-token"
	BookmarksFileName = "hoverboard-bookmarks.json"
	SnapshotFileName  = "aggregate-snapshot.json"
)

// Bookmark is a Pinboard-shaped pin for JSON responses.
type Bookmark struct {
	URL         string      `json:"url"`
	Description string      `json:"description,omitempty"`
	Extended    string      `json:"extended,omitempty"`
	Tags        interface{} `json:"tags,omitempty"`
	Shared      string      `json:"shared,omitempty"`
	Toread      string      `json:"toread,omitempty"`
	Time        string      `json:"time,omitempty"`
	Hash        string      `json:"hash,omitempty"`
	Storage     string      `json:"storage,omitempty"`
}

type fileStore struct {
	Version   int                  `json:"version"`
	Bookmarks map[string]*Bookmark `json:"bookmarks"`
}

// Config for the local API server.
type Config struct {
	InstallDir string
	Port       int
	// Token overrides file when non-empty (tests).
	Token string
	// BookmarksPath overrides default File path (tests).
	BookmarksPath string
	// SnapshotPath optional aggregate snapshot (Phase 2).
	SnapshotPath string
}

// Server is the loopback HTTP API.
type Server struct {
	cfg    Config
	token  string
	mux    *http.ServeMux
	server *http.Server
}

// EnsureToken loads or creates api-token in InstallDir.
// - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Bind loopback only; require Bearer token from api-token file.
func EnsureToken(installDir string) (string, error) {
	path := filepath.Join(installDir, TokenFileName)
	data, err := os.ReadFile(path)
	if err == nil {
		tok := strings.TrimSpace(string(data))
		if tok != "" {
			return tok, nil
		}
	}
	buf := make([]byte, 24)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	tok := hex.EncodeToString(buf)
	if err := os.MkdirAll(installDir, 0o700); err != nil {
		return "", err
	}
	if err := os.WriteFile(path, []byte(tok+"\n"), 0o600); err != nil {
		return "", err
	}
	return tok, nil
}

// NewServer builds handlers; call ListenAndServe to bind.
func NewServer(cfg Config) (*Server, error) {
	if cfg.Port <= 0 {
		cfg.Port = DefaultPort
	}
	if cfg.InstallDir == "" {
		home, _ := os.UserHomeDir()
		cfg.InstallDir = filepath.Join(home, ".hoverboard")
	}
	token := cfg.Token
	if token == "" {
		var err error
		token, err = EnsureToken(cfg.InstallDir)
		if err != nil {
			return nil, err
		}
	}
	s := &Server{cfg: cfg, token: token, mux: http.NewServeMux()}
	s.mux.HandleFunc("/v1/health", s.handleHealth)
	s.mux.HandleFunc("/v1/bookmarks", s.handleBookmarks)
	return s, nil
}

func (s *Server) auth(r *http.Request) bool {
	h := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return false
	}
	return strings.TrimSpace(strings.TrimPrefix(h, prefix)) == s.token
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !s.auth(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	source := "file"
	if s.snapshotExists() {
		source = "snapshot"
	}
	writeJSON(w, map[string]interface{}{
		"ok":     true,
		"source": source,
		"bind":   "127.0.0.1",
		"port":   s.cfg.Port,
	})
}

func (s *Server) handleBookmarks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost && r.Method != http.MethodPatch && r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !s.auth(r) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	switch r.Method {
	case http.MethodGet:
		s.handleBookmarksGet(w, r)
	case http.MethodPost, http.MethodPatch:
		s.handleBookmarksWrite(w, r)
	case http.MethodDelete:
		s.handleBookmarksDelete(w, r)
	}
}

func (s *Server) handleBookmarksGet(w http.ResponseWriter, r *http.Request) {
	list, err := s.loadBookmarks()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	tag := strings.TrimSpace(r.URL.Query().Get("tag"))
	urlQ := strings.TrimSpace(r.URL.Query().Get("url"))
	filtered := FilterBookmarks(list, q, tag, urlQ)
	writeJSON(w, map[string]interface{}{"bookmarks": filtered, "count": len(filtered)})
}

// FilterBookmarks applies q/tag/url filters (pure).
// - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/bookmarks with q, tag, url filters.
func FilterBookmarks(list []Bookmark, q, tag, urlQ string) []Bookmark {
	out := make([]Bookmark, 0, len(list))
	qLower := strings.ToLower(q)
	tagLower := strings.ToLower(tag)
	for _, b := range list {
		if urlQ != "" && b.URL != urlQ {
			continue
		}
		if tagLower != "" && !tagMatches(b.Tags, tagLower) {
			continue
		}
		if qLower != "" && !textMatches(b, qLower) {
			continue
		}
		out = append(out, b)
	}
	return out
}

func tagMatches(tags interface{}, tagLower string) bool {
	switch t := tags.(type) {
	case string:
		for _, p := range strings.Fields(strings.ToLower(t)) {
			if p == tagLower {
				return true
			}
		}
	case []interface{}:
		for _, x := range t {
			if strings.ToLower(fmt.Sprint(x)) == tagLower {
				return true
			}
		}
	case []string:
		for _, x := range t {
			if strings.ToLower(x) == tagLower {
				return true
			}
		}
	}
	return false
}

func textMatches(b Bookmark, qLower string) bool {
	parts := []string{b.URL, b.Description, b.Extended, fmt.Sprint(b.Tags)}
	for _, p := range parts {
		if strings.Contains(strings.ToLower(p), qLower) {
			return true
		}
	}
	return false
}

func (s *Server) bookmarksFilePath() string {
	if s.cfg.BookmarksPath != "" {
		return s.cfg.BookmarksPath
	}
	return filepath.Join(s.cfg.InstallDir, BookmarksFileName)
}

func (s *Server) snapshotFilePath() string {
	if s.cfg.SnapshotPath != "" {
		return s.cfg.SnapshotPath
	}
	return filepath.Join(s.cfg.InstallDir, SnapshotFileName)
}

func (s *Server) snapshotExists() bool {
	_, err := os.Stat(s.snapshotFilePath())
	return err == nil
}

// loadBookmarks prefers aggregate-snapshot.json when present, else File JSON.
func (s *Server) loadBookmarks() ([]Bookmark, error) {
	if s.snapshotExists() {
		list, err := loadSnapshot(s.snapshotFilePath())
		if err == nil {
			return list, nil
		}
	}
	return loadFileBookmarks(s.bookmarksFilePath())
}

func loadFileBookmarks(path string) ([]Bookmark, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []Bookmark{}, nil
		}
		return nil, err
	}
	var store fileStore
	if err := json.Unmarshal(data, &store); err != nil {
		return nil, err
	}
	out := make([]Bookmark, 0, len(store.Bookmarks))
	for url, b := range store.Bookmarks {
		if b == nil {
			continue
		}
		cp := *b
		if cp.URL == "" {
			cp.URL = url
		}
		if cp.Storage == "" {
			cp.Storage = "file"
		}
		out = append(out, cp)
	}
	return out, nil
}

func loadSnapshot(path string) ([]Bookmark, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var wrap struct {
		Bookmarks []Bookmark `json:"bookmarks"`
	}
	if err := json.Unmarshal(data, &wrap); err != nil {
		return nil, err
	}
	if wrap.Bookmarks == nil {
		return []Bookmark{}, nil
	}
	return wrap.Bookmarks, nil
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	_ = enc.Encode(v)
}

// Handler returns the mux for tests.
func (s *Server) Handler() http.Handler { return s.mux }

// ListenAndServe binds 127.0.0.1 only.
func (s *Server) ListenAndServe() error {
	addr := fmt.Sprintf("127.0.0.1:%d", s.cfg.Port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	s.server = &http.Server{Handler: s.mux}
	fmt.Fprintf(os.Stderr, "DEBUG: [localapi] listening on http://%s (File/snapshot under %s)\n", addr, s.cfg.InstallDir)
	return s.server.Serve(ln)
}

// WriteFileBookmarks merges pin into File JSON (Phase 2 write).
func WriteFileBookmarks(path string, pin Bookmark) error {
	store := fileStore{Version: 1, Bookmarks: map[string]*Bookmark{}}
	if data, err := os.ReadFile(path); err == nil {
		_ = json.Unmarshal(data, &store)
		if store.Bookmarks == nil {
			store.Bookmarks = map[string]*Bookmark{}
		}
	}
	if pin.URL == "" {
		return fmt.Errorf("url required")
	}
	cp := pin
	store.Bookmarks[pin.URL] = &cp
	store.Version = 1
	out, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return err
	}
	return os.WriteFile(path, out, 0o600)
}

func DeleteFileBookmark(path, url string) error {
	store := fileStore{Version: 1, Bookmarks: map[string]*Bookmark{}}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if err := json.Unmarshal(data, &store); err != nil {
		return err
	}
	if store.Bookmarks == nil {
		return nil
	}
	delete(store.Bookmarks, url)
	out, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, out, 0o600)
}

func (s *Server) handleBookmarksWrite(w http.ResponseWriter, r *http.Request) {
	var pin Bookmark
	if err := json.NewDecoder(r.Body).Decode(&pin); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if pin.URL == "" {
		http.Error(w, "url required", http.StatusBadRequest)
		return
	}
	// File backend only for writes
	if err := WriteFileBookmarks(s.bookmarksFilePath(), pin); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"ok": true, "bookmark": pin, "storage": "file"})
}

func (s *Server) handleBookmarksDelete(w http.ResponseWriter, r *http.Request) {
	urlQ := strings.TrimSpace(r.URL.Query().Get("url"))
	if urlQ == "" {
		http.Error(w, "url query required", http.StatusBadRequest)
		return
	}
	if err := DeleteFileBookmark(s.bookmarksFilePath(), urlQ); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]interface{}{"ok": true, "deleted": urlQ})
}
