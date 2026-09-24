// ─── Shared configuration ────────────────────────────────────────────────────
// Default values. Anything here can be overridden by the user via
// WebflowMotion.init({ ... }). Object.assign in init.js merges user values in.
const _config = {
  loader: true,            // run the full-screen loader on initial page visit
  pageTransitions: true,   // intercept internal links and animate between pages
  showPageName: true,      // display the destination page name on the overlay
  loaderColor: '#000000',  // overlay background for the loader (black)
  loaderText: 'Loading',   // text shown inside the loader overlay
  transitionColor: '#1a5c38', // overlay background for page transitions (green)
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

// The single overlay DOM node shared by both the loader and transition system.
// Set once in _buildOverlay() and referenced everywhere else.
let _overlay = null;

// Guard flag — prevents a second transition from starting while one is already
// running. Checked in _handleClick() and reset when the overlay fully exits.
let _isTransitioning = false;
