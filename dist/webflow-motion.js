/* Webflow Motion v1.0.0 | MIT License */
(function (gsap) {
  'use strict';

  if (!gsap) {
    console.error('[WebflowMotion] GSAP not found. Load GSAP before this script.');
    return;
  }

// ── core/state.js ──
// ─── Shared configuration ────────────────────────────────────────────────────
// Default values. Anything here can be overridden by the user via
// WebflowMotion.init({ ... }). Object.assign in init.js merges user values in.
const _config = {
  loader: true,            // run the full-screen loader on initial page visit
  pageTransitions: true,   // intercept internal links and animate between pages
  showPageName: true,      // display the destination page name on the overlay
  loaderColor: '#000000',  // overlay background for the loader (black)
  loaderText: 'Loading',   // text shown inside the loader overlay
  transitionColor: '#1a5c38', // overlay background for page transitions (green)
  duration: 0.7,           // animation duration in seconds (all GSAP tweens use this)
  ease: 'power2.inOut',    // GSAP easing applied to all overlay animations

  // Custom animation functions — replace the default fade when provided.
  // Both receive the overlay object and a done callback.
  //
  //   overlay.el   — the full-screen background <div>
  //   overlay.text — the text label <span>
  //   done()       — must be called when the animation finishes
  //
  // Example:
  //   animateIn: (overlay, done) => {
  //     gsap.fromTo(overlay.el, { yPercent: 100 }, { yPercent: 0, duration: 0.6, onComplete: done });
  //   },
  //   animateOut: (overlay, done) => {
  //     gsap.to(overlay.el, { yPercent: -100, duration: 0.6, onComplete: done });
  //   }
  animateIn: null,
  animateOut: null
};

// ─── Runtime state ───────────────────────────────────────────────────────────

// The single overlay DOM node shared by both the loader and transition system.
// Set once in _buildOverlay() and referenced everywhere else.
let _overlay = null;

// Guard flag — prevents a second transition from starting while one is already
// running. Checked in _handleClick() and reset when the overlay fully exits.
let _isTransitioning = false;

// ── core/overlay.js ──
// ─── Overlay DOM ─────────────────────────────────────────────────────────────
// Creates the single overlay element that both the loader and transition system
// share. Called once during setup, before any animations run.

function _buildOverlay() {
  const el = document.createElement('div');
  el.className = 'wm-overlay';
  el.setAttribute('aria-hidden', 'true'); // hide from screen readers

  const text = document.createElement('span');
  text.className = 'wm-text';

  el.appendChild(text);
  document.body.appendChild(el);

  // Store both nodes on the shared _overlay reference so the rest of the
  // system can reach them without querying the DOM again.
  _overlay = { el, text };
}

// ─── Overlay helpers ─────────────────────────────────────────────────────────

// Sets the overlay background — called with loaderColor or transitionColor
// before each animation sequence.
function _setOverlayColor(color) {
  _overlay.el.style.backgroundColor = color;
}

// Sets the text label inside the overlay (e.g. "Loading" or "About").
// Passing an empty string clears it so _overlayIn skips the text animation.
function _setOverlayText(str) {
  _overlay.text.textContent = str || '';
}

// Shows the overlay immediately at full opacity — no animation.
// Used by the loader (which must cover the page before the first paint)
// and by the transition reveal on the destination page.
function _showOverlayInstant(color, str) {
  _setOverlayColor(color);
  _setOverlayText(str);
  gsap.set(_overlay.el, { opacity: 1 });
  gsap.set(_overlay.text, { opacity: 1, y: 0 });
  _overlay.el.classList.add('is-active'); // enables pointer-events (CSS)
}

// Resets overlay to its hidden, neutral state.
// Called at the start of setup() so the overlay is invisible on page load
// before we decide whether to run the loader or the transition reveal.
function _resetOverlay() {
  gsap.set(_overlay.el, { opacity: 0 });
  gsap.set(_overlay.text, { opacity: 0, y: 15 }); // text starts slightly below
  _overlay.el.classList.remove('is-active');
}

// ── core/lifecycle.js ──
// ─── Page ready detection ─────────────────────────────────────────────────────
// Fires callback when all page assets (images, fonts, scripts) have loaded.
// The loader holds the overlay visible until this resolves.

function _onPageReady(callback) {
  let fired = false;

  // Wrap callback in a once-guard so it can't fire twice (e.g. if both the
  // timeout and the load event happen to trigger in the same tick).
  function complete() {
    if (fired) return;
    fired = true;
    callback();
  }

  // Safety timeout — if a slow or broken asset never loads, we still exit the
  // loader after 8 seconds rather than blocking the user indefinitely.
  setTimeout(complete, 8000);

  // If the page is already fully loaded when this runs (e.g. loaded from
  // bfcache or the script executed very late), fire immediately.
  if (document.readyState === 'complete') {
    complete();
  } else {
    window.addEventListener('load', complete, { once: true });
  }
}

// ── animations/fade.js ──
// ─── Overlay in ──────────────────────────────────────────────────────────────
// Runs when the overlay needs to appear — on exit page transitions and loader.
// If _config.animateIn is provided, delegates to that. Otherwise uses the
// default fade with an optional text slide-up.

function _overlayIn(onComplete) {
  _overlay.el.classList.add('is-active');

  // Custom animation — user is responsible for the full sequence.
  // is-active is already added above so pointer-events work during the animation.
  if (_config.animateIn) {
    _config.animateIn(_overlay, onComplete || function () {});
    return;
  }

  // ─── Default fade ───────────────────────────────────────────────────────────
  const hasText = _overlay.text.textContent.trim().length > 0;
  const tl = gsap.timeline({ onComplete });

  tl.to(_overlay.el, {
    opacity: 1,
    duration: _config.duration,
    ease: _config.ease
  });

  // If there's a text label, slide it up from y:15 to y:0 while fading in.
  // Overlaps slightly with the background fade so it feels like one motion.
  if (hasText) {
    tl.to(_overlay.text, {
      opacity: 1,
      y: 0,
      duration: _config.duration * 0.7,
      ease: _config.ease
    }, `-=${_config.duration * 0.5}`);
  }

  return tl;
}

// ─── Overlay out ─────────────────────────────────────────────────────────────
// Runs when the overlay needs to disappear — on entry page reveal and loader exit.
// If _config.animateOut is provided, delegates to that. Otherwise uses the
// default fade with an optional text slide-up exit.

function _overlayOut(onComplete) {
  // Custom animation — cleanup (removing is-active, resetting GSAP styles)
  // is handled internally after the user's done() callback fires.
  if (_config.animateOut) {
    _config.animateOut(_overlay, function () {
      _overlay.el.classList.remove('is-active');
      gsap.set(_overlay.el, { opacity: 0 });
      gsap.set(_overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    });
    return;
  }

  // ─── Default fade ───────────────────────────────────────────────────────────
  const hasText = _overlay.text.textContent.trim().length > 0;

  const tl = gsap.timeline({
    onComplete() {
      _overlay.el.classList.remove('is-active');
      gsap.set(_overlay.el, { opacity: 0 });
      gsap.set(_overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    }
  });

  // Slide text up and out (y: 0 → -15) while fading — gives a sense of
  // the page content "arriving" as the overlay pulls away.
  if (hasText) {
    tl.to(_overlay.text, {
      opacity: 0,
      y: -15,
      duration: _config.duration * 0.5,
      ease: _config.ease
    });
  }

  // Fade the overlay background out. Starts slightly before the text finishes
  // so both elements feel like part of the same exit motion.
  tl.to(_overlay.el, {
    opacity: 0,
    duration: _config.duration,
    ease: _config.ease
  }, hasText ? `-=${_config.duration * 0.3}` : 0);

  return tl;
}

// ── loader/loader.js ──
// ─── Page loader ─────────────────────────────────────────────────────────────
// Runs on the initial visit to the site (no sessionStorage transition flag).
// By the time this runs, _hideBody() has already made the body invisible and
// the overlay is about to cover it — so the user never sees a flash of content.
//
// Sequence:
//   1. Show overlay instantly (black, "Loading" text)
//   2. Animate the text in
//   3. Wait for window.load (or 8s timeout)
//   4. Fade the overlay out, revealing the page

function _runLoader() {
  // Cover the page immediately — _hideBody() kept it invisible until now,
  // _showBody() in setup() restored visibility, but the overlay takes over.
  _showOverlayInstant(_config.loaderColor, _config.loaderText);

  // Reset text so we can animate it in from the bottom
  gsap.set(_overlay.text, { opacity: 0, y: 15 });
  gsap.to(_overlay.text, {
    opacity: 1,
    y: 0,
    duration: _config.duration * 0.7,
    ease: _config.ease,
    delay: 0.15 // small pause before text appears, feels more intentional
  });

  // Once the page is fully loaded, exit the loader
  _onPageReady(() => {
    _overlayOut(() => {
      _isTransitioning = false;
    });
  });
}

// ── transitions/page-transition.js ──
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

// ── core/init.js ──
// ─── Flash of content prevention ─────────────────────────────────────────────
// When the script loads before </body>, the page is already painted. To prevent
// the user from briefly seeing page content before the overlay covers it, we
// inject a <style> tag that hides the body immediately. It is removed in
// setup() right before the overlay takes over.
//
// visibility:hidden is used instead of display:none or opacity:0 so that
// layout is preserved and there's no reflow when the style is removed.

// ─── Flash of content prevention ─────────────────────────────────────────────
// Inline styles on <html> have the highest possible specificity — no stylesheet
// can override them. Setting opacity and background directly on the root element
// is faster and more reliable than injecting a <style> tag.
//
// The head snippet (added to Webflow's <head> custom code) does the same thing
// synchronously before the browser renders anything:
//
//   <script>
//     (function(){
//       var bg='#000000';
//       var raw=sessionStorage.getItem('wm_transition');
//       if(raw){try{bg=JSON.parse(raw).color||bg;}catch(e){}}
//       document.documentElement.style.opacity='0';
//       document.documentElement.style.backgroundColor=bg;
//     })();
//   </script>

function _hideBody() {
  const hasIncoming = !!sessionStorage.getItem('wm_transition');
  const bg = hasIncoming ? _config.transitionColor : _config.loaderColor;
  document.documentElement.style.opacity = '0';
  document.documentElement.style.backgroundColor = bg;
}

function _showBody() {
  document.documentElement.style.opacity = '';
  document.documentElement.style.backgroundColor = '';
}

// ─── Public API ───────────────────────────────────────────────────────────────
// WebflowMotion.init() is the only thing exposed to the outside world.
// Everything else in this file is private to the IIFE.

window.WebflowMotion = {
  init(userConfig) {
    // Merge user options into the shared _config object
    Object.assign(_config, userConfig || {});

    // Honour the OS-level reduced motion preference — collapse all durations
    // so animations still run (callbacks still fire) but are imperceptible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      _config.duration = 0.01;
    }

    // Decide whether to hide the body before DOMContentLoaded fires.
    // We check sessionStorage synchronously here because _hideBody() must
    // run before the browser's next paint — waiting for DOM ready is too late.
    const hasIncoming = !!sessionStorage.getItem('wm_transition');
    const shouldHide =
      (_config.loader && !hasIncoming) ||          // loader path: hide until overlay covers
      (hasIncoming && _config.pageTransitions);     // transition entry path: hide until overlay shows
    if (shouldHide) _hideBody();

    // ─── Setup (runs after DOM is available) ─────────────────────────────────
    function setup() {
      _buildOverlay();  // create the shared overlay DOM node
      _resetOverlay();  // set overlay to opacity:0 / inert state

      // Set up the overlay BEFORE restoring body visibility.
      // Both _revealOnEntry and _runLoader call _showOverlayInstant synchronously,
      // putting the overlay at opacity:1 before the body becomes visible.
      // This closes the gap where the body was briefly visible but uncovered.
      const isEntry = _config.pageTransitions && _revealOnEntry();

      if (!isEntry && _config.loader) {
        _isTransitioning = true;
        _runLoader();
      }

      // Restore body visibility now — the overlay is already covering the page.
      // If neither loader nor transition entry ran, the page just shows normally.
      _showBody();

      // Attach the click listener for future navigations on this page
      if (_config.pageTransitions) {
        _initTransitions();
      }
    }

    // Run setup as soon as the DOM is available. If the script is placed in
    // <head> it waits for DOMContentLoaded; if it's before </body> the DOM
    // is already ready and setup runs synchronously.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
      setup();
    }
  }
};

})(window.gsap);
