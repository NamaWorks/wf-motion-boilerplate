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
