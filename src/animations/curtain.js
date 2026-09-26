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
