# [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] — Record visit and optional referrer; debounce; persist usage + nav edges in chrome.storage.local.
> Five-backend note: usage events apply across BookmarkRouter backends (pinboard|local|file|sync|browser); persistence may be local.


## RECORD_VISIT

- [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] How: Implements recordVisit(url, referrer?) behavior for IMPL-BOOKMARK_USAGE_TRACKING.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: Http, IO
  - TERMINATION: total
- PROCEDURE: RECORD_VISIT
  - url = cleanUrl(url); if !url return
  - IF now - _lastRecordedVisit[url] < DEBOUNCE_MS return  // debounce
  - _lastRecordedVisit[url] = now
  - usage = read usage[url] or create { visitCount:0, firstVisitedAt:'', lastVisitedAt:'', recentVisits:[] }
  - usage.visitCount++; usage.lastVisitedAt = now; if !usage.firstVisitedAt then usage.firstVisitedAt = now
  - usage.recentVisits = [now, ...usage.recentVisits].slice(0, RECENT_VISITS_CAP)
  - write usage map
  - IF referrer: ref = cleanUrl(referrer); IF ref && ref !== url && /^https?:/.test(ref): add/increment edge ref→url; write edges map
  - 1. getUsage(url), getAllUsage(): read from storage; return normalized records
  - 2. getMostFrequent(n), getMostRecent(n): sort by visitCount / lastVisitedAt; return top n
  - 3. getInboundLinks(url): edges[url] or []
  - 4. getOutboundLinks(url): all edges where sourceUrl === url (scan edges map)
  - 5. getNavigationGraph(): all edges as { sourceUrl, targetUrl, count, ... }
  - 6. clearUsage(url): delete usage[url]; delete edges[url]; remove url from any edge as sourceUrl