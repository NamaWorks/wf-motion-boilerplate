# Implementation Plan — Potential Problems & Solutions

## 1. Dist File Management (No Build Pipeline)

**Problem:** jsDelivr serves files directly from the GitHub repository. Without a build step, there is no minified or bundled `dist/` file unless it is committed manually. Source lives in `src/`, but Webflow loads from `dist/`.

**Options:**

- A. Commit `dist/` manually before each release tag.
- B. Write a minimal Node script (`scripts/build.js`) that concatenates source files in order and writes `dist/webflow-motion.js` and `dist/webflow-motion.css` — no bundler needed.
- C. Use a GitHub Action to auto-generate `dist/` on tag push.

**Recommended approach for MVP:** Option B. A single Node script using `fs` to concatenate files and write the output. Run it manually before tagging a release. Can be upgraded to Option C later.

---

## 2. Webflow JS Conflicts

**Problem:** Webflow injects its own scripts — IX2 (interactions), CMS, e-commerce, etc. These may:

- Intercept or call `preventDefault` on link clicks before the motion system does.
- Re-render the DOM after navigation, resetting the overlay.
- Conflict with GSAP transforms already applied to elements.
- Add links dynamically (e.g. Finsweet CMS Load) that attached listeners will miss.

**Solutions:**

- Use event delegation on `document` rather than attaching listeners to individual `<a>` elements — this catches dynamically added links automatically.
- Check `e.defaultPrevented` before intercepting a click, so Webflow's own handlers take priority when they need to.
- Add `aria-hidden="true"` and a dedicated class to the overlay so Webflow IX2 ignores it.
- If IX2 triggers on page reveal, hook into `window.Webflow.require('ix2').init()` to re-initialize after a transition completes.

---

## 3. Back / Forward Navigation (popstate)

**Problem:** When the user presses the browser back or forward button, no `click` event fires. The transition flow is skipped and the page changes without any animation.

**Solutions:**

- Listen to `window.addEventListener('popstate', ...)` separately from click interception.
- On `popstate`, run a simplified reveal animation (skip the overlay-enter phase since the page already changed — just reveal the new page).
- Or: manage navigation timing with `history.pushState` during transitions, then handle `popstate` consistently.

**Note:** This is the most complex part of any page transition system. The MVP can treat it as a known limitation — the page changes normally without a transition. Document it and implement it post-MVP.

---

## 4. GSAP Load Order

**Problem:** The system depends on GSAP. If the motion script loads before GSAP, `gsap` will be `undefined` at initialization.

**Solution:** Load GSAP before the motion script in Webflow Custom Code:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.x.x/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/dist/webflow-motion.js"></script>
```

Document this required load order clearly in the README. Bundling GSAP into the dist file removes the dependency entirely but adds weight — keep it external for now.

---

## 5. Race Conditions (Overlapping Transitions)

**Problem:** If a user clicks a link while a transition is already running, a second transition starts before the first finishes — causing visual glitches or broken navigation state.

**Solution:** Add an `isTransitioning` flag. While `true`, ignore new link clicks. Reset it only after the full transition sequence completes, or after a timeout in case something goes wrong.

```js
let isTransitioning = false;

function handleLinkClick(e) {
  if (isTransitioning) {
    e.preventDefault();
    return;
  }
  isTransitioning = true;
  // run transition, then set isTransitioning = false on completion
}
```

---

## 6. DOM Ready vs Window Load

**Problem:** `DOMContentLoaded` fires when the HTML is parsed but before images and fonts load. `window.load` fires after everything — but waiting for it can make the loader feel slow or appear broken on media-heavy pages.

**Solution:**

- Show the loader immediately on `DOMContentLoaded` (or inline in `<head>` via CSS) so it appears before any content.
- Wait for `window.load` before running the loader exit animation.
- Add a maximum timeout (e.g. 8 seconds) so the loader never blocks indefinitely if an asset fails to load.

---

## 7. Accessibility

**Problem:** Page transitions can break screen readers and keyboard navigation:

- Focus is lost when the overlay covers the page.
- Users with `prefers-reduced-motion` should not see animations.
- Screen readers may announce the overlay content unexpectedly.

**Solutions:**

- Check `prefers-reduced-motion` and skip or shorten all animations when it is set.
- Move focus to a logical element (e.g. `<main>` or `<h1>`) after each transition completes.
- Add `aria-hidden="true"` to the overlay so screen readers ignore it.
- Ensure overlay children are not focusable (`tabindex="-1"`).

---

## 8. CSS Specificity Conflicts

**Problem:** Webflow generates CSS with high specificity. Overlay styles may be overridden unexpectedly, or the motion system's classes may collide with project-specific class names.

**Solutions:**

- Prefix all overlay classes (e.g. `.wm-overlay`, `.wm-loader`, `.wm-title`) to avoid collision.
- Set explicit values for `font-family`, `color`, `box-sizing`, and `line-height` on overlay elements — never rely on inherited styles.
- Use `z-index` values above Webflow's own layers. Webflow's editor uses up to `9999`; set the overlay to `10000` or higher.

---

## Priority Order for MVP

| # | Problem | MVP | Notes |
|---|---------|-----|-------|
| 1 | Dist file build script | Yes | Required before any release |
| 2 | Event delegation for links | Yes | Catches dynamic and future links |
| 3 | `isTransitioning` guard | Yes | Simple flag, prevents visible bugs |
| 4 | GSAP load order | Yes | Document clearly in README |
| 5 | DOM ready vs `window.load` | Yes | Affects loader feel and reliability |
| 6 | `prefers-reduced-motion` | Yes | Accessibility baseline |
| 7 | Overlay CSS prefixing | Yes | Prevents random breakage across projects |
| 8 | Webflow IX2 conflicts | Partial | Handle basics, document the rest |
| 9 | `popstate` / back button | No | Known limitation for v1 |
| 10 | Focus management after transitions | No | Post-MVP accessibility pass |
