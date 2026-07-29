# [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING]
# Record visit and optional referrer; debounce; persist usage + nav edges in chrome.storage.local.

cleanUrl(url): trim, strip trailing slash (match bookmark-router)

recordVisit(url, referrer?):
  url = cleanUrl(url); if !url return
  IF now - _lastRecordedVisit[url] < DEBOUNCE_MS return  // debounce
  _lastRecordedVisit[url] = now
  usage = read usage[url] or create { visitCount:0, firstVisitedAt:'', lastVisitedAt:'', recentVisits:[] }
  usage.visitCount++; usage.lastVisitedAt = now; if !usage.firstVisitedAt then usage.firstVisitedAt = now
  usage.recentVisits = [now, ...usage.recentVisits].slice(0, RECENT_VISITS_CAP)
  write usage map
  IF referrer: ref = cleanUrl(referrer); IF ref && ref !== url && /^https?:/.test(ref): add/increment edge ref→url; write edges map

getUsage(url), getAllUsage(): read from storage; return normalized records
getMostFrequent(n), getMostRecent(n): sort by visitCount / lastVisitedAt; return top n
getInboundLinks(url): edges[url] or []
getOutboundLinks(url): all edges where sourceUrl === url (scan edges map)
getNavigationGraph(): all edges as { sourceUrl, targetUrl, count, ... }
clearUsage(url): delete usage[url]; delete edges[url]; remove url from any edge as sourceUrl
