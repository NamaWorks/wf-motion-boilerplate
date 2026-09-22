// ─── Overlay DOM ─────────────────────────────────────────────────────────────
// Creates the single overlay element that both the loader and transition system
// share. Called once during setup, before any animations run.

function _buildOverlay() {
  const el = document.createElement('div');
  el.className = 'wm-overlay';
  el.setAttribute('aria-hidden', 'true'); // hide from screen readers

  const text = document.createElement('span');
  text.className = 'wm-text';

  el.appendChild(text);
  document.body.appendChild(el);

  // Store both nodes on the shared _overlay reference so the rest of the
  // system can reach them without querying the DOM again.
  _overlay = { el, text };
}

// ─── Overlay helpers ─────────────────────────────────────────────────────────

// Sets the overlay background — called with loaderColor or transitionColor
// before each animation sequence.
function _setOverlayColor(color) {
  _overlay.el.style.backgroundColor = color;
}

// Sets the text label inside the overlay (e.g. "Loading" or "About").
// Passing an empty string clears it so _overlayIn skips the text animation.
function _setOverlayText(str) {
  _overlay.text.textContent = str || '';
}

// Shows the overlay immediately at full opacity — no animation.
// Used by the loader (which must cover the page before the first paint)
// and by the transition reveal on the destination page.
function _showOverlayInstant(color, str) {
  _setOverlayColor(color);
  _setOverlayText(str);
  gsap.set(_overlay.el, { opacity: 1 });
  gsap.set(_overlay.text, { opacity: 1, y: 0 });
  _overlay.el.classList.add('is-active'); // enables pointer-events (CSS)
}

// Resets overlay to its hidden, neutral state.
// Called at the start of setup() so the overlay is invisible on page load
// before we decide whether to run the loader or the transition reveal.
function _resetOverlay() {
  gsap.set(_overlay.el, { opacity: 0 });
  gsap.set(_overlay.text, { opacity: 0, y: 15 }); // text starts slightly below
  _overlay.el.classList.remove('is-active');
}
