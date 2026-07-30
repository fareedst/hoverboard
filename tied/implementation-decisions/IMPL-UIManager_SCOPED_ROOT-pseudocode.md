# [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] — Summary: Scoped DOM resolution so UIManager runs in popup (document) or side-panel Bookmark subtree (container) without duplicate ids.

## CACHE_ELEMENTS

- [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: How — composed_with IMPL-SIDE_PANEL_BOOKMARK: pre — Bookmark panel subtree mounted with data-popup-ref values matching popup element keys; ordering — container passed into UIManager constructor before cacheElements; post — this.elements[key] reference nodes under container (or null if missing); shared data — elementKeys and data-popup-ref attribute names align with popup ids.
- Contract:
  - INPUT: constructor options { container?: Element }; cacheElements() at init; updateSectionLabelsVisibility(showLabels: boolean)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: this.elements populated; section title nodes toggled visible/hidden | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: container (optional); elementKeys; data-popup-ref attribute names matching popup ids
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: CACHE_ELEMENTS
  - FOR each key in elementKeys:
  - IF this.container:
  - this.elements[key] = this.container.querySelector('[data-popup-ref="' + key + '"]')
  - ELSE:
  - this.elements[key] = document.getElementById(key)
  - How (sub-block): How — section labels: scope query to container or document; no throw on empty NodeList.

## UPDATE_SECTION_LABELS_VISIBILITY

- [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] How: Implements updateSectionLabelsVisibility(showLabels) behavior for IMPL-UIManager_SCOPED_ROOT.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: UPDATE_SECTION_LABELS_VISIBILITY
  - root = this.container || document
  - sectionTitles = root.querySelectorAll('.section-title')
  - FOR each title in sectionTitles:
  - IF showLabels THEN title.style.display = ''
  - ELSE title.style.display = 'none'
