# [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX]
# Block 1: When handleSearch receives response.success === false and response indicates no matches,
# do not call showError; call showSearchNoMatchFeedback(). Other failures (e.g. "Already on last match") still call showError.
handleSearch(response):
  IF response.success:
    showSuccess(...); RETURN
  isNoMatch = (response.message === "No matching tabs found" OR response.matchCount === 0)
  IF isNoMatch:
    showSearchNoMatchFeedback()
  ELSE:
    showError(response.message OR "No matching tabs found")

# [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX]
# Block 2: showSearchNoMatchFeedback adds class to elements.searchBtn; after 2s remove class. Ensures bright red border then fade to default.
showSearchNoMatchFeedback():
  IF NOT elements.searchBtn: RETURN
  elements.searchBtn.classList.add("search-no-match")
  setTimeout(2000, () => elements.searchBtn.classList.remove("search-no-match"))

# [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX]
# Block 3: CSS class on search button sets border to bright red and transition (2s) to default; when class removed, border fades back.
# .button.secondary.search-no-match { border-color: #e00 or similar; transition: border-color 2s ease; }

# [IMPL-TAB_SEARCH_NO_MATCH_UI] handleSearch scroll restore when side panel (uiManager.container) exists
handleSearch_try_finally_scroll():
  scrollContainer = uiManager?.container
  savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
  TRY:
    setLoading(true)   # may reset scroll in UI
    # ... search logic ...
  FINALLY:
    setLoading(false)
    IF scrollContainer != null AND savedScrollTop !== undefined:
      scrollContainer.scrollTop = savedScrollTop
