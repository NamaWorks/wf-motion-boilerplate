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
