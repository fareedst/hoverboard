# Demo animated GIF standard

This document summarizes the standard for all side-panel demo animated GIFs (e.g. Bookmarks, Tabs, This Page, By Tag, Usage). The **reference implementation** is `scripts/record-demo-side-panel-bookmarks.js`. When adding or updating any `record-demo-side-panel-*.js` script, follow this standard so GIFs are consistent and loop-friendly.

**Authoritative detail:** [IMPL-DEMO_OVERLAY](tied/implementation-decisions/IMPL-DEMO_OVERLAY.yaml) → `demo_gif_standard` in the TIED YAML.

---

## Timing

| Rule | Description |
|------|-------------|
| **Start** | 1 s with no overlay (removeOverlay, wait `1000*RATE` ms, one snap = frame 0). The first frame is a useful static image. |
| **Presentation rate** | `RATE = 1.25` (25% slower). Multiply all wait durations by RATE. |
| **Before interstitial** | 0.5 s pause (wait `500*RATE` ms) after the last content step, then inject logo and snap. |
| **Interstitial in GIF** | Last frame duration 0.5 s (Hoverboard icon centered). |

## Overlay

| Rule | Description |
|------|-------------|
| **Header background** | `rgba(0,0,0,0.78)` (slightly more opaque than default 0.72). |
| **Descriptions** | 30–50% longer overlay text (action + achievement) for context. |

## Interstitial

| Rule | Description |
|------|-------------|
| **Placement** | Once per loop, at **end only**. No intro logo so the first frame stays a useful static image. |
| **Content** | Full-screen overlay with Hoverboard icon (e.g. `chrome.runtime.getURL('icons/hoverboard_128.png')`) centered. |
| **Capture** | One frame; in GIF build give that frame 0.5 s duration. |

## GIF build

| Rule | Description |
|------|-------------|
| **Structure** | 3-part: (1) No-overlay segment from frame 0, duration 1 s. (2) Main segment from overlay steps, 1 fps per frame. (3) End segment from last frame (logo), duration 0.5 s. |
| **Concat** | Use **concat filter + re-encode** to output GIF. Do **not** use concat demuxer with `-c copy` (it can yield a single-frame output). |
| **Pipeline** | Palette from all frames → build nooverlay.gif, main.gif, end.gif → merge with filter e.g. `[0:v][1:v][2:v]concat=n=3:v=1:a=0`, then `-c:v gif`. |

---

## Scripts to align

- `scripts/record-demo-side-panel-bookmarks.js` — **reference** (implements this standard).
- `scripts/record-demo-side-panel-tabs.js`
- `scripts/record-demo-side-panel-this-page.js`
- `scripts/record-demo-side-panel-by-tag.js`
- `scripts/record-demo-side-panel-usage.js`

Update the above scripts to match this standard when touching demo recording or regenerating GIFs.
