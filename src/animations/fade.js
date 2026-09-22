// ─── Overlay in ──────────────────────────────────────────────────────────────
// Fades the overlay in, then optionally slides the text label up into view.
// Used by page transitions on the EXIT page (before navigating away).
// onComplete fires after the full sequence — navigation happens there.

function _overlayIn(onComplete) {
  const hasText = _overlay.text.textContent.trim().length > 0;
  const tl = gsap.timeline({ onComplete });

  // Make the overlay interactive while it's visible
  _overlay.el.classList.add('is-active');

  // Fade the overlay background in
  tl.to(_overlay.el, {
    opacity: 1,
    duration: _config.duration,
    ease: _config.ease
  });

  // If there's a text label, slide it up from y:15 to y:0 while fading in.
  // Overlaps slightly with the background fade so it feels like one motion.
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

// ─── Overlay out ─────────────────────────────────────────────────────────────
// Fades the overlay out, sliding the text upward as it exits.
// Used by the loader (after window.load) and by the transition reveal on the
// ENTRY page (after arriving from a navigation).
// onComplete fires when the overlay is fully invisible — cleanup happens there.

function _overlayOut(onComplete) {
  const hasText = _overlay.text.textContent.trim().length > 0;

  const tl = gsap.timeline({
    onComplete() {
      // Clean up after the animation: disable pointer-events and reset GSAP
      // inline styles so the overlay is fully inert until the next use.
      _overlay.el.classList.remove('is-active');
      gsap.set(_overlay.el, { opacity: 0 });
      gsap.set(_overlay.text, { opacity: 0, y: 15 });
      if (onComplete) onComplete();
    }
  });

  // Slide text up and out (y: 0 → -15) while fading — gives a sense of
  // the page content "arriving" as the overlay pulls away.
  if (hasText) {
    tl.to(_overlay.text, {
      opacity: 0,
      y: -15,
      duration: _config.duration * 0.5,
      ease: _config.ease
    });
  }

  // Fade the overlay background out. Starts slightly before the text finishes
  // so both elements feel like part of the same exit motion.
  tl.to(_overlay.el, {
    opacity: 0,
    duration: _config.duration,
    ease: _config.ease
  }, hasText ? `-=${_config.duration * 0.3}` : 0);

  return tl;
}
