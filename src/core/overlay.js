// ─── Overlay DOM ─────────────────────────────────────────────────────────────
// Creates an overlay element. Returns the { el, text } object.
// Called once per overlay instance during setup.

function _buildOverlay() {
  const el = document.createElement('div');
  el.className = 'wm-overlay';
  el.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'wm-text';

  el.appendChild(text);
  document.body.appendChild(el);

  return { el, text };
}

// ─── Overlay helpers ─────────────────────────────────────────────────────────

function _setOverlayColor(overlay, color) {
  overlay.el.style.backgroundColor = color;
}

function _setOverlayText(overlay, str) {
  overlay.text.textContent = str || '';
}

function _showOverlayInstant(overlay, color, str) {
  _setOverlayColor(overlay, color);
  _setOverlayText(overlay, str);
  gsap.set(overlay.el, { opacity: 1 });
  gsap.set(overlay.text, { opacity: 1, y: 0 });
  overlay.el.classList.add('is-active');
}

function _resetOverlay(overlay) {
  gsap.set(overlay.el, { opacity: 0 });
  gsap.set(overlay.text, { opacity: 0, y: 15 });
  overlay.el.classList.remove('is-active');
}
