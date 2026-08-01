# Brave side-panel / sidebar window arrange

**Status:** Open browser bug (not a Hoverboard code defect)
**Affects:** Brave Browser when a side panel or native sidebar is visible
**Upstream:** [brave-browser#55575](https://github.com/brave/brave-browser/issues/55575)

## Symptoms

Without a side panel or Brave native sidebar:

- Maximizing / filling the display works
- Half-screen arrange (top, bottom, left, right) works

With Hoverboard’s **side panel** and/or Brave’s **native sidebar** visible:

- Maximizing / filling the display makes the window wider than the display
- Most OS window-arrange keystrokes do not trigger or behave erratically

## Repro matrix

| Configuration | Expected arrange behavior |
|---------------|---------------------------|
| Neither panel nor sidebar open | Maximize and half-screen arrange work |
| Hoverboard **side panel** only (`chrome.sidePanel`) | Maximize overshoots; arrange keys often fail |
| Brave **native sidebar** only (e.g. sidebar UI / `Ctrl+B` on platforms that use it) | Same broken arrange behavior |
| Both open | Same broken arrange behavior |

This reproduces without depending on Hoverboard panel content or CSS; the same class of failure appears with Brave’s own sidebar.

## Why Hoverboard cannot fix this

- OS snap / maximize is owned by the OS and Brave’s window chrome.
- The Side Panel API does not let an extension set browser window bounds or display work-area geometry.
- Hoverboard’s panel document only fills the width/height the browser already reserved for the panel (`width: 100%` / `100vh` inside the panel). It does not resize the OS window.

Related tiling-WM reports (e.g. AeroSpace + Brave side panel overflowing the screen) point at the same browser chrome interaction, not extension layout.

## Workaround

1. Close Hoverboard’s side panel and/or Brave’s native sidebar.
2. Run the OS window arrange action (maximize or half-screen).
3. Reopen the panel or sidebar if needed.

## References

- Product note: [README.md](../../README.md) (Supported Browsers → Brave)
- Upstream: [brave-browser#55575 — Window scaling issue with Brave sidebar](https://github.com/brave/brave-browser/issues/55575)
- Related discussion: [AeroSpace #2175 — Brave window expands when side panel opened](https://github.com/nikitabobko/AeroSpace/discussions/2175)
