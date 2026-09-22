// ─── Page ready detection ─────────────────────────────────────────────────────
// Fires callback when all page assets (images, fonts, scripts) have loaded.
// The loader holds the overlay visible until this resolves.

function _onPageReady(callback) {
  let fired = false;

  // Wrap callback in a once-guard so it can't fire twice (e.g. if both the
  // timeout and the load event happen to trigger in the same tick).
  function complete() {
    if (fired) return;
    fired = true;
    callback();
  }

  // Safety timeout — if a slow or broken asset never loads, we still exit the
  // loader after 8 seconds rather than blocking the user indefinitely.
  setTimeout(complete, 8000);

  // If the page is already fully loaded when this runs (e.g. loaded from
  // bfcache or the script executed very late), fire immediately.
  if (document.readyState === 'complete') {
    complete();
  } else {
    window.addEventListener('load', complete, { once: true });
  }
}
