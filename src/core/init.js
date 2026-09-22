let _bodyHideStyle = null;

function _hideBody() {
  _bodyHideStyle = document.createElement('style');
  _bodyHideStyle.setAttribute('data-wm', '');
  // Use visibility so layout is preserved — no reflow when restored
  _bodyHideStyle.textContent = 'body{visibility:hidden!important}';
  document.head.appendChild(_bodyHideStyle);
}

function _showBody() {
  if (_bodyHideStyle && _bodyHideStyle.parentNode) {
    _bodyHideStyle.parentNode.removeChild(_bodyHideStyle);
  }
  _bodyHideStyle = null;
}

window.WebflowMotion = {
  init(userConfig) {
    Object.assign(_config, userConfig || {});

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      _config.duration = 0.01;
    }

    // Check for incoming transition before DOMContentLoaded so we can
    // hide the body immediately, preventing a flash of page content
    const hasIncoming = !!sessionStorage.getItem('wm_transition');
    const shouldHide = (_config.loader && !hasIncoming) || (hasIncoming && _config.pageTransitions);
    if (shouldHide) _hideBody();

    function setup() {
      _buildOverlay();
      _resetOverlay();

      // Restore body visibility — the overlay will cover it if needed
      _showBody();

      const isEntry = _config.pageTransitions && _revealOnEntry();

      if (!isEntry && _config.loader) {
        _isTransitioning = true;
        _runLoader();
      }

      if (_config.pageTransitions) {
        _initTransitions();
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
      setup();
    }
  }
};
