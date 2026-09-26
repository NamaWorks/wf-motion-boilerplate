// ─── Shared configuration ────────────────────────────────────────────────────
// Default values. Anything here can be overridden by the user via
// WebflowMotion.init({ ... }). Object.assign in init.js merges user values in.
const _config = {
  loader: true,            // run the full-screen loader on initial page visit
  pageTransitions: true,   // intercept internal links and animate between pages
  showPageName: true,      // display the destination page name on the overlay
  loaderColor: '#000000',  // overlay background for the loader (black)
  loaderText: 'Loading',   // text shown inside the loader overlay
  loaderLottie: null,      // path/URL to a Lottie JSON — when set, replaces the text loader
  loaderWaitForLoop: true, // waits for the animation to complete one full loop before exiting
  transitionColor: '#353535', // overlay background for page transitions
  duration: 0.7,           // animation duration in seconds (all GSAP tweens use this)
  ease: 'power2.inOut',    // GSAP easing applied to all overlay animations

  // Custom animation functions — replace the default fade when provided.
  // Both receive the overlay object and a done callback.
  //
  //   overlay.el   — the full-screen background <div>
  //   overlay.text — the text label <span>
  //   done()       — must be called when the animation finishes
  //
  // Example:
  //   animateIn: (overlay, done) => {
  //     gsap.fromTo(overlay.el, { yPercent: 100 }, { yPercent: 0, duration: 0.6, onComplete: done });
  //   },
  //   animateOut: (overlay, done) => {
  //     gsap.to(overlay.el, { yPercent: -100, duration: 0.6, onComplete: done });
  //   }
  animateIn: null,
  animateOut: null
};

// ─── Runtime state ───────────────────────────────────────────────────────────

let _loaderOverlay = null;
let _transitionOverlay = null;

// Guard flag — prevents a second transition from starting while one is already
// running. Checked in _handleClick() and reset when the overlay fully exits.
let _isTransitioning = false;
