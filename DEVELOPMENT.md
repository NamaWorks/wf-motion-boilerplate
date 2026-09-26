# Development Guide

Quick reference for working on this boilerplate.

---

## How it works

Source files live in `src/`. A Node build script concatenates them into a single IIFE in `dist/`. Webflow loads `dist/` via jsDelivr CDN.

```
src/ → scripts/build.js → dist/ → jsDelivr → Webflow
```

The concatenation order matters — files share the same IIFE scope:

```
core/state.js                    shared config + runtime flags
core/overlay.js                  overlay DOM creation + helpers
core/lifecycle.js                window.load detection
animations/fade.js               default fade animation
animations/curtain.js            curtain preset animation
loader/loader.js                 initial page load sequence (text or Lottie)
transitions/page-transition.js   navigation interception
core/init.js                     public API (WebflowMotion.init)
core/presets.js                  named animation presets (WebflowMotion.presets)
```

---

## Local development

**Start a local server:**
```bash
npx serve .
```
Open `http://localhost:3000/test/` — `index.html` runs the loader, the other pages test transitions.

**Build once:**
```bash
node scripts/build.js
```

**Watch mode** (rebuilds on every save):
```bash
node scripts/build.js --watch
```

Run both in separate terminal tabs. After each save, hard-refresh the browser (`Cmd+Shift+R`).

---

## Full workflow — from fix to Webflow

This is the complete process every time you make a change, using a bug fix as an example.

**1. Start the dev environment**
```bash
npx serve .                       # terminal tab 1
node scripts/build.js --watch     # terminal tab 2
```

**2. Edit the source file**

For example, fix a bug in `src/transitions/page-transition.js`. Save the file — the watcher rebuilds `dist/` automatically.

**3. Test locally**

Open `http://localhost:3000/test/` and hard-refresh (`Cmd+Shift+R`). Verify the fix works.

**4. Commit the change**
```bash
git add src/transitions/page-transition.js dist/
git commit -m "fix(transitions): describe what was fixed"
```

**5. Tag the new version**
```bash
git tag v1.0.2
```

**6. Push everything**
```bash
git push origin master
git push origin v1.0.2
```

**7. Wait for jsDelivr**

Open this URL in the browser to confirm it's live (can take 2–3 min):
```
https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.2/dist/webflow-motion.js
```

**8. Update Webflow**

In Site Settings → Custom Code, update the version number in both the `<link>` and `<script>` tags:
```
@v1.0.1  →  @v1.0.2
```

Publish the Webflow site. Done.

---

## Git commit structure

Follow conventional commits with module scopes:

```
feat(core):           new feature in core
feat(transitions):    new feature in transitions
feat(loader):         new feature in loader
fix(transitions):     bug fix
docs(readme):         documentation only
chore(build):         build script or dist changes
test:                 test pages
```

**Version bumping:**
- Bug fix → `v1.0.0` → `v1.0.1`
- New feature → `v1.0.0` → `v1.1.0`
- Breaking change → `v1.0.0` → `v2.0.0`

---

## Webflow integration

**Head custom code** — anti-flash snippet + stylesheet:
```html
<script>
  (function(){
    var bg = '#000000';
    var raw = sessionStorage.getItem('wm_transition');
    if (raw) { try { bg = JSON.parse(raw).color || bg; } catch(e){} }
    document.documentElement.style.opacity = '0';
    document.documentElement.style.backgroundColor = bg;
  })();
</script>

<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.0/dist/webflow-motion.css"
>
```

**Footer custom code** — GSAP + Lottie (optional) + motion script + init:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<!-- include lottie-web only if using the Lottie loader -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.0/dist/webflow-motion.js"></script>
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
    showPageName: false,
    animateIn: WebflowMotion.presets.curtain.animateIn,
    animateOut: WebflowMotion.presets.curtain.animateOut
  });
</script>
```

**With Lottie loader:**
```html
<script>
  WebflowMotion.init({
    loader: true,
    loaderLottie: 'https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.0/src/lotties/your-animation.json',
    loaderWaitForLoop: true,
    pageTransitions: true,
    showPageName: false,
    animateIn: WebflowMotion.presets.curtain.animateIn,
    animateOut: WebflowMotion.presets.curtain.animateOut
  });
</script>
```

To update a project to a new version, change the version number in both URLs.

---

## Configuration options

| Option | Default | Description |
|---|---|---|
| `loader` | `true` | Full-screen loader on initial visit |
| `pageTransitions` | `true` | Animated transitions between pages |
| `showPageName` | `true` | Show destination page name on overlay |
| `loaderColor` | `#000000` | Loader overlay color |
| `loaderText` | `Loading` | Loader text |
| `loaderLottie` | `null` | Path or URL to a Lottie JSON file — replaces the text loader |
| `loaderWaitForLoop` | `true` | Wait for one full Lottie loop before exiting |
| `transitionColor` | `#353535` | Transition overlay color |
| `duration` | `0.7` | Animation duration in seconds |
| `ease` | `power2.inOut` | GSAP easing |
| `animateIn` | `null` | Custom enter animation function |
| `animateOut` | `null` | Custom exit animation function |

---

## Custom animations

Pass `animateIn` and `animateOut` to replace the default fade. Both receive:
- `overlay.el` — the background `<div>`
- `overlay.text` — the text `<span>`
- `done` — **must** be called when the animation finishes

```js
WebflowMotion.init({
  animateIn: function(overlay, done) {
    gsap.fromTo(overlay.el,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.6, ease: 'power2.inOut', onComplete: done }
    );
  },
  animateOut: function(overlay, done) {
    gsap.to(overlay.el,
      { yPercent: -100, duration: 0.6, ease: 'power2.inOut', onComplete: done }
    );
  }
});
```

If only one is provided, the other falls back to the default fade.

---

## Animation presets

`WebflowMotion.presets` exposes named animations that can be passed directly to `init()`. Presets are defined in `src/core/presets.js` and bundled last so they can reference animation functions from earlier files.

**Current presets:**

| Key | Description |
|---|---|
| `presets.curtain` | Slides overlay up from below the viewport on exit, off the top on entry. Gradient fades at both ends so no hard edge is visible. |

```js
WebflowMotion.init({
  animateIn: WebflowMotion.presets.curtain.animateIn,
  animateOut: WebflowMotion.presets.curtain.animateOut
});
```

To add a new preset, define the animation functions in a new `src/animations/your-name.js` file, add it to `jsFiles` in `scripts/build.js` before `core/presets.js`, then register it in `src/core/presets.js`.

---

## Lottie loader

When `loaderLottie` is set and `window.lottie` is available, `_runLoader()` switches to a Lottie branch: it mounts the animation inside `.wm-lottie` container div on the loader overlay and waits for page ready. If `loaderWaitForLoop: true`, it also waits for the first `loopComplete` event before fading out — whichever comes last.

If `loaderLottie` is not set or `window.lottie` is missing, the text loader path runs as normal.

The `.wm-lottie` container has `aspect-ratio: 1920 / 1080` by default — adjust this in `src/styles/main.css` to match the composition canvas size of each Lottie file.

lottie-web must be loaded **before** `webflow-motion.js`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
```

---

## Custom page names

By default the page name is derived from the URL path (`/about` → `About`). Override per-link with `data-page`:

```html
<a href="/about" data-page="Our Story">Our Story</a>
```
