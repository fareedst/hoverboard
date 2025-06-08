// features
//
// const showContentTagsInHover = dtrue;
const hoverShowRecentTags = dtrue
const hoverShowTooltips = false /// dtrue;
const showHoverOnPageLoad = dfalse
const showHoverOPLOnlyIfNoTags = dtrue
const showHoverOPLOnlyIfSomeTags = dfalse
// const displayOverlayTest = dfalse;
const inhibitSitesOnPageLoad = dtrue
const initRecentPostsCount = 15

const setIconOnLoad = dtrue
// const iconBadgeTextShowPinExists = dfalse;
// const iconBadge_textShowTagCount = dtrue;

const recentTagsCountMax = 32
// const recentPostsCount = 32;

const uxAutoCloseTimeout = 0 // in ms, 0 to disable /// disable timeout on interaction with extension
// const uxBadgeTextIfNotSaved = '-';
// const uxBadge_textIfTagsEq_0 = '0';
const uxRecentRowWithBlock = dtrue
const uxRecentRowWithBookmarkButton = dtrue
const uxRecentRowWithCloseButton = dtrue
const uxRecentRowWithPrivateButton = dtrue
const uxRecentRowWithDeletePin = dtrue
const uxRecentRowWithInput = dtrue
// const uxTooltips = true;

const uxUrlStripHash = dfalse // modify url send to pinboard

// messages
//
// const msgB2fOptions = 'b2fOptions'
const msgBackDeletePin = 'f2bDeletePin'
const msgBackDeleteTag = 'f2bDeleteTag'
const msgBackDev = 'A2bDev'
const msgBackEcho = 'A2bEcho'
const msgBackGetTabId = 'F2bGetTabId'
const msgBackInhibitUrlAppend = 'f2bUpdateInhibit'
const msgBackInjectOnComplete = 'injectOnComplete'
const msgBackReadCurrent = 'f2bReadCurrent'
const msgBackReadOptions = 'f2bReadOptions'
const msgBackReadPin = 'f2bReadPin'
const msgBackReadRecent = 'f2bReadRecent'
const msgBackSaveTag = 'f2bSaveTag'
const msgBackSearchTitle = 'BackSearchTitle'
const msgBackSearchTitleText = 'BackSearchTitleText'
const msgTabCheckPage = 'b2fClickedBrowserAction'
const msgTabCloseIfToRead = 'b2fCloseIfToRead'
const msgTabHideOverlay = 'b2fHideOverlay'
const msgTabRefreshData = 'b2fRefreshData'
const msgTabRefreshHover = 'b2fRefreshHover'
const msgTabToggleHover = 'b2fToggleHover'

const WIDEN = true

// retry
//
const pinRetryCountMax = 2
const pinRetryDelay = 1000 // in ms
