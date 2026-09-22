function _onPageReady(callback) {
  let fired = false;

  function complete() {
    if (fired) return;
    fired = true;
    callback();
  }

  // Safety timeout — never block forever on a failed asset
  setTimeout(complete, 8000);

  if (document.readyState === 'complete') {
    complete();
  } else {
    window.addEventListener('load', complete, { once: true });
  }
}
