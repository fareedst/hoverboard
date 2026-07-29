# [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK]
# Summary: Scoped DOM resolution so UIManager runs in popup (document) or side-panel Bookmark subtree (container) without duplicate ids.

# [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
# How — composed_with IMPL-SIDE_PANEL_BOOKMARK: pre — Bookmark panel subtree mounted with data-popup-ref values matching popup element keys; ordering — container passed into UIManager constructor before cacheElements; post — this.elements[key] reference nodes under container (or null if missing); shared data — elementKeys and data-popup-ref attribute names align with popup ids.

# How — INPUT/OUTPUT/DATA contract (same tokens as summary).
INPUT: constructor options { container?: Element }; cacheElements() at init; updateSectionLabelsVisibility(showLabels: boolean)
OUTPUT: this.elements populated; section title nodes toggled visible/hidden
DATA: container (optional); elementKeys; data-popup-ref attribute names matching popup ids

# How — constructor stores optional container then resolves elements.
UIManager constructor({ container, ... }):
  this.container = container || null
  cacheElements()

# How — cacheElements: per key resolve element; null if missing (caller must tolerate).
cacheElements():
  FOR each key in elementKeys:
    IF this.container:
      this.elements[key] = this.container.querySelector('[data-popup-ref="' + key + '"]')
    ELSE:
      this.elements[key] = document.getElementById(key)

# How — section labels: scope query to container or document; no throw on empty NodeList.
updateSectionLabelsVisibility(showLabels):
  root = this.container || document
  sectionTitles = root.querySelectorAll('.section-title')
  FOR each title in sectionTitles:
    IF showLabels THEN title.style.display = ''
    ELSE title.style.display = 'none'
