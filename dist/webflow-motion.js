/* Webflow Motion v1.0.0 | MIT License */
(function (gsap) {
  'use strict';

  if (!gsap) {
    console.error('[WebflowMotion] GSAP not found. Load GSAP before this script.');
    return;
  }

// ── core/state.js ──
const _config = {
  loader: true,
  pageTransitions: true,
  showPageName: true,
  loaderColor: '#000000',
  loaderText: 'Loading',
  transitionColor: '#1a5c38',
  duration: 0.7,
  ease: 'power2.inOut'
};

let _overlay = null;
let _isTransitioning = false;

// ── core/overlay.js ──
function _buildOverlay() {
  const el = document.createElement('div');
  el.className = 'wm-overlay';
  el.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'wm-text';

  el.appendChild(text);
  document.body.appendChild(el);

  _overlay = { el, text };
}

function _setOverlayColor(color) {
  _overlay.el.style.backgroundColor = color;
}

function _setOverlayText(str) {
  _overlay.text.textContent = str || '';
}

function _showOverlayInstant(color, str) {
  _setOverlayColor(color);
  _setOverlayText(str);
  gsap.set(_overlay.el, { opacity: 1 });
  gsap.set(_overlay.text, { opacity: 1, y: 0 });
  _overlay.el.classList.add('is-active');
}

function _resetOverlay() {
  gsap.set(_overlay.el, { opacity: 0 });
  gsap.set(_overlay.text, { opacity: 0, y: 15 });
  _overlay.el.classList.remove('is-active');
}

// ── core/lifecycle.js ──
function _onPageReady(callback) {
  let fired = false;

  function complete() {
    if (fired) return;
    fired = true;
    callback();
  }

  // Safety timeout — never block forever on a failed asset
  setTimeout(complete, 8000);

  if (document.readyState === 'complete') {
    complete();
  } else {
    window.addEventListener('load', complete, { once: true });
  }
}

// ── animations/fade.js ──
function _overlayIn(onComplete) {
  const hasText = _overlay.text.textContent.trim().length > 0;
  const tl = gsap.timeline({ onComplete });

  _overlay.el.classList.add('is-active');

  tl.to(_overlay.el, {
    opacity: 1,
    duration: _config.duration,
    ease: _config.ease
  });

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

function _overlayOut(onComplete) {
  const hasText = _overlay.text.textContent.trim().length > 0;

  const tl = gsap.timeline({
    onComplete() {
      _overlay.el.classList.remove('is-active');
      gsap.set(_overlay.el, { opacity: 0 });
      gsap.set(_overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    }
  });

  if (hasText) {
    tl.to(_overlay.text, {
      opacity: 0,
      y: -15,
      duration: _config.duration * 0.5,
      ease: _config.ease
    });
  }

  tl.to(_overlay.el, {
    opacity: 0,
    duration: _config.duration,
    ease: _config.ease
  }, hasText ? `-=${_config.duration * 0.3}` : 0);

  return tl;
}

// ── loader/loader.js ──
function _runLoader() {
  // Show overlay instantly — it was already covering the body via body-hide
  _showOverlayInstant(_config.loaderColor, _config.loaderText);

  // Animate text in after the overlay is already covering the page
  gsap.set(_overlay.text, { opacity: 0, y: 15 });
  gsap.to(_overlay.text, {
    opacity: 1,
    y: 0,
    duration: _config.duration * 0.7,
    ease: _config.ease,
    delay: 0.15
  });

  _onPageReady(() => {
    _overlayOut(() => {
      _isTransitioning = false;
    });
  });
}

// ── transitions/page-transition.js ──
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

function _handleClick(e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (_isTransitioning) return;

  const link = e.target.closest('a');
  if (!_isInternalLink(link)) return;

  const href = link.getAttribute('href');
  const dest = new URL(href, window.location.origin).pathname;
  if (dest === window.location.pathname) return;

  e.preventDefault();
  _isTransitioning = true;

  const pageName = link.getAttribute('data-page') || _pageNameFromUrl(href);

  _setOverlayColor(_config.transitionColor);
  _setOverlayText(_config.showPageName ? pageName : '');
  gsap.set(_overlay.text, { opacity: 0, y: 15 });

  _overlayIn(() => {
    sessionStorage.setItem('wm_transition', JSON.stringify({
      pageName,
      color: _config.transitionColor,
      timestamp: Date.now()
    }));
    window.location.href = href;
  });
}

function _revealOnEntry() {
  const raw = sessionStorage.getItem('wm_transition');
  sessionStorage.removeItem('wm_transition');
  if (!raw) return false;

  let data;
  try { data = JSON.parse(raw); } catch { return false; }
  if (Date.now() - data.timestamp > 10000) return false;

  const pageName = data.pageName || '';
  const color = data.color || _config.transitionColor;

  _showOverlayInstant(color, _config.showPageName ? pageName : '');

  // Brief pause so the user registers the page name before the overlay exits
  gsap.delayedCall(0.4, () => {
    _overlayOut(() => {
      _isTransitioning = false;
    });
  });

  return true;
}

function _initTransitions() {
  document.addEventListener('click', _handleClick);
}

// ── core/init.js ──
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

})(window.gsap);
