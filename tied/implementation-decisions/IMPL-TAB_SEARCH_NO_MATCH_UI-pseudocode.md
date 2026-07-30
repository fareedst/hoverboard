# [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] — Block 1: When handleSearch receives response.success === false and response indicates no matches, do not call showError; call showSearchNoMatchFeedback(). Other failures (e.g. "Already on last match") still call showError.

## HANDLE_SEARCH

- [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Implements handleSearch(response) behavior for IMPL-TAB_SEARCH_NO_MATCH_UI.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: HANDLE_SEARCH
  - IF response.success:
  - showSuccess(...); RETURN
  - isNoMatch = (response.message === "No matching tabs found" OR response.matchCount === 0)
  - IF isNoMatch:
  - showSearchNoMatchFeedback()
  - ELSE:
  - showError(response.message OR "No matching tabs found")

## SHOW_SEARCH_NO_MATCH_FEEDBACK

- [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 2: showSearchNoMatchFeedback adds class to elements.searchBtn; after 2s remove class. Ensures bright red border then fade to default.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: SHOW_SEARCH_NO_MATCH_FEEDBACK
  - IF NOT elements.searchBtn: RETURN
  - elements.searchBtn.classList.add("search-no-match")
  - setTimeout(2000, () => elements.searchBtn.classList.remove("search-no-match"))

## HANDLE_SEARCH_TRY_FINALLY_SCROLL

- [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 3: CSS class on search button sets border to bright red and transition (2s) to default; when class removed, border fades back. .button.secondary.search-no-match { border-color: #e00 or similar; transition: border-color 2s ease; }
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: HANDLE_SEARCH_TRY_FINALLY_SCROLL
  - scrollContainer = uiManager?.container
  - savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
  - TRY:
  - setLoading(true)   # may reset scroll in UI
  - How (sub-block): # ... search logic ...
  - FINALLY:
  - setLoading(false)
  - IF scrollContainer != null AND savedScrollTop !== undefined:
  - scrollContainer.scrollTop = savedScrollTop
