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
