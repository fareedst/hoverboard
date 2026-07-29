# [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME]
# :root.hb-theme-dark block in popup.css so ThemeManager dark applies to popup.
# Contract: root and ThemeManager vars; popup uses dark/light vars.
INPUT: document.documentElement (root); ThemeManager sets hb-theme-dark and --hb-* vars
OUTPUT: popup body uses dark background/text when theme is dark (same vars as prefers-color-scheme block)
DATA: popup.css :root.hb-theme-dark { --bg-primary: #1e1e1e; --text-primary: ...; ... }

# Prefer hb-theme-dark, else prefers-color-scheme, else light; elements use --bg-primary etc.
Style resolution:
  IF root has class hb-theme-dark: APPLY :root.hb-theme-dark variables to popup
  ELSE IF prefers-color-scheme dark: APPLY @media (prefers-color-scheme: dark) variables
  ELSE: APPLY light variables
Popup elements USE --bg-primary, --text-primary, etc. from resolved rule
