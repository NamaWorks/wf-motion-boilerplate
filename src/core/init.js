// ─── Flash of content prevention ─────────────────────────────────────────────
// When the script loads before </body>, the page is already painted. To prevent
// the user from briefly seeing page content before the overlay covers it, we
// inject a <style> tag that hides the body immediately. It is removed in
// setup() right before the overlay takes over.
//
// visibility:hidden is used instead of display:none or opacity:0 so that
// layout is preserved and there's no reflow when the style is removed.

let _bodyHideStyle = null;

function _hideBody() {
  // Skip if the head snippet already handled this
  if (document.head.querySelector('[data-wm-init]')) return;

  // Match the html background to the overlay color so the browser-native
  // flash between page loads shows the right color instead of white.
  const hasIncoming = !!sessionStorage.getItem('wm_transition');
  const bg = hasIncoming ? _config.transitionColor : _config.loaderColor;

  _bodyHideStyle = document.createElement('style');
  _bodyHideStyle.setAttribute('data-wm', '');
  _bodyHideStyle.textContent = `html{background-color:${bg}!important}body{visibility:hidden!important}`;
  document.head.appendChild(_bodyHideStyle);
}

function _showBody() {
  // Remove head snippet (Layer 1)
  const headStyle = document.head.querySelector('[data-wm-init]');
  if (headStyle) headStyle.parentNode.removeChild(headStyle);

  // Remove runtime fallback (Layer 2)
  if (_bodyHideStyle && _bodyHideStyle.parentNode) {
    _bodyHideStyle.parentNode.removeChild(_bodyHideStyle);
  }
  _bodyHideStyle = null;
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
      _buildOverlay();   // create the shared overlay DOM node
      _resetOverlay();   // set overlay to opacity:0 / inert state

      // Restore body visibility now — the overlay will cover the page
      // immediately after this if either the loader or a transition entry runs.
      _showBody();

      // If we arrived here from a page transition, show the overlay and
      // fade it out to reveal the new page. Skip the loader in this case.
      const isEntry = _config.pageTransitions && _revealOnEntry();

      if (!isEntry && _config.loader) {
        _isTransitioning = true;
        _runLoader();
      }

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
