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
