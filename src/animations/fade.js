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
