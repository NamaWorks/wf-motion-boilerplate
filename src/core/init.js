// ─── Flash of content prevention ─────────────────────────────────────────────
// Two-layer approach:
//
// Layer 1 — inline <head> script (added to Webflow's head custom code):
//   Hides the body synchronously before the browser renders any content.
//   This is the only reliable way to prevent a flash when the main script
//   loads near </body> (too late to hide before first paint).
//
//   <script>
//     (function(){
//       var s=document.createElement('style');
//       s.setAttribute('data-wm-init','');
//       s.textContent='body{visibility:hidden}';
//       document.head.appendChild(s);
//     })();
//   </script>
//
// Layer 2 — _hideBody() below:
//   Fallback for when the head snippet isn't present. Runs synchronously
//   inside init() before DOMContentLoaded — still closes the flash window
//   for most modern browsers.

let _bodyHideStyle = null;

function _hideBody() {
  // Don't inject a duplicate if the head snippet already hid the body
  if (document.head.querySelector('[data-wm-init]')) return;
  _bodyHideStyle = document.createElement('style');
  _bodyHideStyle.setAttribute('data-wm', '');
  // visibility:hidden preserves layout — no reflow when restored
  _bodyHideStyle.textContent = 'body{visibility:hidden!important}';
  document.head.appendChild(_bodyHideStyle);
}

function _showBody() {
  // Remove the head inline snippet (Layer 1)
  const headStyle = document.head.querySelector('[data-wm-init]');
  if (headStyle) headStyle.parentNode.removeChild(headStyle);

  // Remove the runtime fallback (Layer 2)
  if (_bodyHideStyle && _bodyHideStyle.parentNode) {
    _bodyHideStyle.parentNode.removeChild(_bodyHideStyle);
  }
  _bodyHideStyle = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

window.WebflowMotion = {
  init(userConfig) {
    Object.assign(_config, userConfig || {});

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      _config.duration = 0.01;
    }

    // Synchronously decide whether to hide the body before DOMContentLoaded.
    // PerformanceNavigationTiming is available immediately — no need to wait
    // for the DOM to check if this is a back/forward navigation.
    const hasIncoming = !!sessionStorage.getItem('wm_transition');
    const isBackForward = _config.pageTransitions && _isBackForwardNavigation();
    const shouldHide =
      (hasIncoming && _config.pageTransitions) ||
      isBackForward ||
      (_config.loader && !hasIncoming && !isBackForward);

    if (shouldHide) _hideBody();

    function setup() {
      _buildOverlay();
      _resetOverlay();

      // Restore body — the overlay takes over immediately after this
      _showBody();

      // Priority order: transition entry → back/forward → loader → nothing
      const isEntry = _config.pageTransitions && _revealOnEntry();

      if (!isEntry && isBackForward && _config.pageTransitions) {
        _isTransitioning = true;
        _revealBackForward();
      } else if (!isEntry && !isBackForward && _config.loader) {
        _isTransitioning = true;
        _runLoader();
      }

      if (_config.pageTransitions) {
        _initTransitions();
        _initBackForward(); // pageshow listener for bfcache restores
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
      setup();
    }
  }
};
