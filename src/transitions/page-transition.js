// ─── Page name from URL ───────────────────────────────────────────────────────
// Derives a human-readable page name from a URL path.
// /about → "About", /our-work → "Our work"
// Falls back to "Home" for the root path, empty string on parse error.

function _pageNameFromUrl(href) {
  try {
    const { pathname } = new URL(href, window.location.origin);
    const segment = pathname.replace(/\/$/, '').split('/').pop();
    if (!segment) return 'Home';
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ');
  } catch {
    return '';
  }
}

// ─── Internal link detection ──────────────────────────────────────────────────
// Returns true only for links that should trigger a page transition.
// Ignores: external URLs, hash anchors, mailto/tel/javascript, new-tab links.

function _isInternalLink(el) {
  if (!el || el.tagName !== 'A') return false;
  const href = el.getAttribute('href');
  if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return false;
  if (el.target === '_blank') return false;
  try {
    return new URL(href, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

// ─── Click handler ────────────────────────────────────────────────────────────
// Attached to document so it catches dynamically added links (e.g. CMS items).
// Bails out early for modifier keys so browser-native behaviour is preserved
// (Cmd+click opens in a new tab, Shift+click opens in a new window, etc.).

function _handleClick(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (_isTransitioning) return; // block double-clicks while a transition is running

  const link = e.target.closest('a'); // walk up the DOM in case the click hit a child element
  if (!_isInternalLink(link)) return;

  const href = link.getAttribute('href');
  const dest = new URL(href, window.location.origin).pathname;
  if (dest === window.location.pathname) return; // same page — do nothing

  e.preventDefault();
  _isTransitioning = true;

  // data-page attribute takes precedence over the URL-derived name,
  // allowing manual control over what's displayed on the overlay.
  const pageName = link.getAttribute('data-page') || _pageNameFromUrl(href);

  // Prepare the overlay for the transition (green, destination page name)
  _setOverlayColor(_config.transitionColor);
  _setOverlayText(_config.showPageName ? pageName : '');
  gsap.set(_overlay.text, { opacity: 0, y: 15 });

  // Fade the overlay in, then navigate. Navigation only happens after the
  // overlay is fully visible so the exit feels intentional, not abrupt.
  _overlayIn(() => {
    // Store the transition state in sessionStorage so the destination page
    // knows it arrived via a transition and should reveal with the overlay.
    sessionStorage.setItem('wm_transition', JSON.stringify({
      pageName,
      color: _config.transitionColor,
      timestamp: Date.now()
    }));
    window.location.href = href;
  });
}

// ─── Entry reveal ─────────────────────────────────────────────────────────────
// Called on the destination page. Reads the sessionStorage flag set by the
// EXIT page, shows the overlay instantly (matching color and page name),
// holds briefly so the user registers the page name, then fades out.
// Returns true if a transition entry was handled, false if not (loader runs instead).

function _revealOnEntry() {
  const raw = sessionStorage.getItem('wm_transition');
  sessionStorage.removeItem('wm_transition'); // always clear — prevents stale state
  if (!raw) return false;

  let data;
  try { data = JSON.parse(raw); } catch { return false; }

  // Ignore entries older than 10 seconds — could happen if the user navigated
  // back from an external page or the tab was suspended mid-transition.
  if (Date.now() - data.timestamp > 10000) return false;

  const pageName = data.pageName || '';
  const color = data.color || _config.transitionColor;

  // Show overlay immediately at full opacity so there's no flash of page content
  _showOverlayInstant(color, _config.showPageName ? pageName : '');

  // Hold for a moment so the user can read the page name, then exit
  gsap.delayedCall(0.4, () => {
    _overlayOut(() => {
      _isTransitioning = false;
    });
  });

  return true;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Attaches the click listener. Called once from init.js setup().

function _initTransitions() {
  document.addEventListener('click', _handleClick);

  // When the browser restores this page from bfcache (back/forward button),
  // the overlay is frozen at full opacity from the transition that preceded
  // the navigation — _isTransitioning is still true and nothing clears it.
  // Detect the restore and fade the overlay out so the page is usable again.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || !_overlay) return;
    _isTransitioning = false;
    _overlayOut();
  });
}
