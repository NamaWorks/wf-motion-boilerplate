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
