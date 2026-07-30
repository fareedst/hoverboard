# [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] — :root.hb-theme-dark block in popup.css so ThemeManager dark applies to popup. Contract: root and ThemeManager vars; popup uses dark/light vars.

## MAIN

- [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] How: Logical block for IMPL-POPUP_THEME_CSS.
- Contract:
  - INPUT: document.documentElement (root); ThemeManager sets hb-theme-dark and --hb-* vars
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: popup body uses dark background/text when theme is dark (same vars as prefers-color-scheme block)
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: popup.css :root.hb-theme-dark { --bg-primary: #1e1e1e; --text-primary: ...; ... }
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Prefer hb-theme-dark, else prefers-color-scheme, else light; elements use --bg-primary etc.
  - 1. Style resolution:
  - 2.   IF root has class hb-theme-dark: APPLY :root.hb-theme-dark variables to popup
  - 3.   ELSE IF prefers-color-scheme dark: APPLY @media (prefers-color-scheme: dark) variables
  - 4.   ELSE: APPLY light variables
  - 5. Popup elements USE --bg-primary, --text-primary, etc. from resolved rule
