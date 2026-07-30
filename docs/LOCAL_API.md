# Hoverboard Local Query API

[REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]

Opt-in **localhost** HTTP API for scripts and integrations. This is **not** a public/cloud REST API.

## Scope

| Phase | Data source | Methods |
|-------|-------------|---------|
| Phase 1 | `~/.hoverboard/hoverboard-bookmarks.json` (File backend) | `GET /v1/health`, `GET /v1/bookmarks` |
| Phase 2 | Prefer `aggregate-snapshot.json` when present; File write | `POST`/`PATCH`/`DELETE /v1/bookmarks` (File only) |

## Security

- Binds **`127.0.0.1` only** (never `0.0.0.0`).
- Requires `Authorization: Bearer <token>` where token is in `~/.hoverboard/api-token` (created on first start, mode `0600`).

## Start

```bash
cd native_host
go build -o hoverboard-local-api ./cmd/hoverboard-local-api
./hoverboard-local-api
# or after install.sh copies it to ~/.hoverboard/
~/.hoverboard/hoverboard-local-api
```

Environment:

- `HOVERBOARD_HOME` — install dir (default `~/.hoverboard`)
- `HOVERBOARD_API_PORT` — port (default `8787`)

## Examples

```bash
TOKEN=$(tr -d '\n' < ~/.hoverboard/api-token)
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8787/v1/health
curl -s -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8787/v1/bookmarks?q=pinboard'
curl -s -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8787/v1/bookmarks?tag=read'
curl -s -H "Authorization: Bearer $TOKEN" 'http://127.0.0.1:8787/v1/bookmarks?url=https://example.com/'
```

### File writes (Phase 2)

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/","description":"Example","extended":"notes","tags":"a b"}' \
  http://127.0.0.1:8787/v1/bookmarks
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" \
  'http://127.0.0.1:8787/v1/bookmarks?url=https://example.com/'
```

## Aggregate snapshot

When the extension writes `~/.hoverboard/aggregate-snapshot.json` (Local + File + Sync + Browser), the API prefers that file for `GET` list/search. Writes still target File JSON only.
