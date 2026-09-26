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
  loaderLottie: null,      // path/URL to a Lottie JSON — when set, replaces the text loader
  loaderWaitForLoop: true, // waits for the animation to complete one full loop before exiting
  transitionColor: '#353535', // overlay background for page transitions
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

let _loaderOverlay = null;
let _transitionOverlay = null;

// Guard flag — prevents a second transition from starting while one is already
// running. Checked in _handleClick() and reset when the overlay fully exits.
let _isTransitioning = false;

// ── core/overlay.js ──
// ─── Overlay DOM ─────────────────────────────────────────────────────────────
// Creates an overlay element. Returns the { el, text } object.
// Called once per overlay instance during setup.

function _buildOverlay() {
  const el = document.createElement('div');
  el.className = 'wm-overlay';
  el.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'wm-text';

  el.appendChild(text);
  document.body.appendChild(el);

  return { el, text };
}

// ─── Overlay helpers ─────────────────────────────────────────────────────────

function _setOverlayColor(overlay, color) {
  overlay.el.style.backgroundColor = color;
}

function _setOverlayText(overlay, str) {
  overlay.text.textContent = str || '';
}

function _showOverlayInstant(overlay, color, str) {
  _setOverlayColor(overlay, color);
  _setOverlayText(overlay, str);
  gsap.set(overlay.el, { opacity: 1 });
  gsap.set(overlay.text, { opacity: 1, y: 0 });
  overlay.el.classList.add('is-active');
}

function _resetOverlay(overlay) {
  gsap.set(overlay.el, { opacity: 0 });
  gsap.set(overlay.text, { opacity: 0, y: 15 });
  overlay.el.classList.remove('is-active');
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

function _overlayIn(overlay, onComplete) {
  overlay.el.classList.add('is-active');

  // Custom animation — user is responsible for the full sequence.
  // is-active is already added above so pointer-events work during the animation.
  if (_config.animateIn) {
    _config.animateIn(overlay, onComplete || function () {});
    return;
  }

  // ─── Default fade ───────────────────────────────────────────────────────────
  const hasText = overlay.text.textContent.trim().length > 0;
  const tl = gsap.timeline({ onComplete });

  tl.to(overlay.el, {
    opacity: 1,
    duration: _config.duration,
    ease: _config.ease
  });

  // If there's a text label, slide it up from y:15 to y:0 while fading in.
  // Overlaps slightly with the background fade so it feels like one motion.
  if (hasText) {
    tl.to(overlay.text, {
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

function _overlayOut(overlay, onComplete) {
  // Custom animation — cleanup (removing is-active, resetting GSAP styles)
  // is handled internally after the user's done() callback fires.
  if (_config.animateOut) {
    _config.animateOut(overlay, function () {
      overlay.el.classList.remove('is-active');
      gsap.set(overlay.el, { opacity: 0 });
      gsap.set(overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    });
    return;
  }

  // ─── Default fade ───────────────────────────────────────────────────────────
  const hasText = overlay.text.textContent.trim().length > 0;

  const tl = gsap.timeline({
    onComplete() {
      overlay.el.classList.remove('is-active');
      gsap.set(overlay.el, { opacity: 0 });
      gsap.set(overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    }
  });

  // Slide text up and out (y: 0 → -15) while fading — gives a sense of
  // the page content "arriving" as the overlay pulls away.
  if (hasText) {
    tl.to(overlay.text, {
      opacity: 0,
      y: -15,
      duration: _config.duration * 0.5,
      ease: _config.ease
    });
  }

  // Fade the overlay background out. Starts slightly before the text finishes
  // so both elements feel like part of the same exit motion.
  tl.to(overlay.el, {
    opacity: 0,
    duration: _config.duration,
    ease: _config.ease
  }, hasText ? `-=${_config.duration * 0.3}` : 0);

  return tl;
}

// ── animations/curtain.js ──
const _animateCurtainIn = (_overlay, done) => {
  _overlay.el.classList.add('wm-curtain');
  _overlay.el.style.backgroundColor = '';
  gsap.fromTo(_overlay.el,
    { yPercent: 100, opacity: 1 },
    { yPercent: 0, duration: _config.duration, ease: _config.ease, onComplete: done }
  );
};

const _animateCurtainOut = (_overlay, done) => {
  _overlay.el.classList.add('wm-curtain');
  _overlay.el.style.backgroundColor = '';
  gsap.to(_overlay.el,
    { yPercent: -100, duration: _config.duration, ease: _config.ease, onComplete: done }
  );
};

// ── loader/loader.js ──
// ─── Page loader ─────────────────────────────────────────────────────────────
// Runs on the initial visit to the site (no sessionStorage transition flag).
// Branches on whether a Lottie animation path is configured.
//
// Lottie path:
//   1. Show overlay instantly
//   2. Play Lottie animation
//   3. Wait for page ready AND (optionally) one full loop
//   4. Fade the overlay out
//
// Text path:
//   1. Show overlay instantly (black, "Loading" text)
//   2. Animate the text in
//   3. Wait for window.load (or 8s timeout)
//   4. Fade the overlay out, revealing the page

function _runLoader() {
  if (_config.loaderLottie && window.lottie) {
    _showOverlayInstant(_loaderOverlay, _config.loaderColor, '');

    const container = document.createElement('div');
    container.className = 'wm-lottie';
    _loaderOverlay.el.appendChild(container);

    const anim = window.lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: _config.loaderLottie
    });

    function _exitLoader() {
      gsap.to(_loaderOverlay.el, {
        opacity: 0,
        duration: _config.duration,
        ease: _config.ease,
        onComplete: () => {
          anim.destroy();
          container.remove();
          _loaderOverlay.el.classList.remove('is-active');
          _isTransitioning = false;
        }
      });
    }

    if (_config.loaderWaitForLoop) {
      let pageReady = false;
      let loopDone = false;
      anim.addEventListener('loopComplete', () => { loopDone = true; if (pageReady) _exitLoader(); });
      _onPageReady(() => { pageReady = true; if (loopDone) _exitLoader(); });
    } else {
      _onPageReady(_exitLoader);
    }

  } else {
    _showOverlayInstant(_loaderOverlay, _config.loaderColor, _config.loaderText);
    gsap.set(_loaderOverlay.text, { opacity: 0, y: 15 });
    gsap.to(_loaderOverlay.text, {
      opacity: 1, y: 0,
      duration: _config.duration * 0.7,
      ease: _config.ease,
      delay: 0.15
    });
    _onPageReady(() => {
      _overlayOut(_loaderOverlay, () => { _isTransitioning = false; });
    });
  }
}

// ── transitions/page-transition.js ──
// ─── URL resolution ───────────────────────────────────────────────────────────
// Resolves a potentially relative href against the current page.
// Uses document.baseURI so it respects any <base> tag and correctly handles
// both .html file paths and clean URLs (e.g. /about, /work).

function _resolveUrl(href) {
  return new URL(href, document.baseURI).href;
}

// ─── Page name from URL ───────────────────────────────────────────────────────
// Derives a human-readable page name from a URL path.
// /about → "About", /our-work → "Our work"
// Falls back to "Home" for the root path, empty string on parse error.

function _pageNameFromUrl(href) {
  try {
    const { pathname } = new URL(_resolveUrl(href));
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
    return new URL(_resolveUrl(href)).origin === window.location.origin;
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
  const resolvedHref = _resolveUrl(href);
  const dest = new URL(resolvedHref).pathname;
  if (dest === window.location.pathname) return; // same page — do nothing

  e.preventDefault();
  _isTransitioning = true;

  // data-page attribute takes precedence over the URL-derived name,
  // allowing manual control over what's displayed on the overlay.
  const pageName = link.getAttribute('data-page') || _pageNameFromUrl(href);

  // Prepare the overlay for the transition
  _setOverlayColor(_transitionOverlay, _config.transitionColor);
  _setOverlayText(_transitionOverlay, _config.showPageName ? pageName : '');
  gsap.set(_transitionOverlay.text, { opacity: 0, y: 15 });

  // Fade the overlay in, then navigate. Navigation only happens after the
  // overlay is fully visible so the exit feels intentional, not abrupt.
  _overlayIn(_transitionOverlay, () => {
    // Store the transition state in sessionStorage so the destination page
    // knows it arrived via a transition and should reveal with the overlay.
    sessionStorage.setItem('wm_transition', JSON.stringify({
      pageName,
      color: _config.transitionColor,
      timestamp: Date.now()
    }));
    window.location.href = resolvedHref;
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
  _showOverlayInstant(_transitionOverlay, color, _config.showPageName ? pageName : '');

  // Hold for a moment so the user can read the page name, then exit
  const hold = _config.showPageName ? 0.4 : 0;
  gsap.delayedCall(hold, () => {
    _overlayOut(_transitionOverlay, () => {
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
    if (!e.persisted || !_transitionOverlay) return;
    _isTransitioning = false;
    _overlayOut(_transitionOverlay);
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
      _loaderOverlay = _buildOverlay();
      _transitionOverlay = _buildOverlay();
      _resetOverlay(_loaderOverlay);
      _resetOverlay(_transitionOverlay);

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

// ── core/presets.js ──
window.WebflowMotion.presets = {
  curtain: {
    animateIn: _animateCurtainIn,
    animateOut: _animateCurtainOut
  }
};

})(window.gsap);
