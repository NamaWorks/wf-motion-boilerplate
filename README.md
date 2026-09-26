# Webflow Motion Boilerplate

A reusable motion boilerplate for Webflow projects, designed to handle page loaders, page transitions, and reusable navigation animations.

The system keeps the motion logic outside of Webflow, version-controlled in GitHub, and distributed through a CDN. Webflow remains responsible for the content, structure, and visual design, while the boilerplate provides the animation layer.

## Objective

Build a lightweight, reusable motion system that can be integrated into Webflow projects to provide:

- Initial page loaders.
- Page-to-page transitions.
- Full-screen transition overlays.
- Dynamic page titles during navigation.
- Smooth fade in / fade out animations.
- Reusable animation presets.
- Centralized animation logic.
- Version-controlled releases.
- Easy integration into multiple Webflow projects.

The goal is to create a system that can be installed into a new Webflow project with minimal configuration.

The boilerplate should start simple but provide a foundation that can evolve into a more complete Webflow motion framework.

## Core Concept

The system is divided into two main features:

```
┌─────────────────────────────────────────┐
│         Webflow Motion System           │
├─────────────────────┬───────────────────┤
│     Page Loader     │   Page Transition │
│                     │                   │
│ Initial page load   │ Navigation        │
│        ↓            │       ↓           │
│ Show loader         │ Intercept link    │
│        ↓            │       ↓           │
│ Wait for page       │ Show transition   │
│        ↓            │       ↓           │
│ Reveal website      │ Navigate          │
│                     │       ↓           │
│                     │ Reveal new page   │
└─────────────────────┴───────────────────┘
```

Both systems will share the same underlying animation infrastructure.

## Architecture

The system will consist of three main components:

```
┌─────────────────────┐
│       GitHub        │
│                     │
│  Source code        │
│  JavaScript         │
│  CSS                │
│  Documentation      │
└──────────┬──────────┘
           │
           │ Published version
           ▼
┌─────────────────────┐
│      jsDelivr       │
│                     │
│        CDN          │
└──────────┬──────────┘
           │
           │ HTTP
           ▼
┌─────────────────────┐
│       Webflow       │
│                     │
│  Loads the system   │
│  Executes the code  │
└─────────────────────┘
```

### GitHub

GitHub will be the source of truth for the project.

It will contain:

- JavaScript source code.
- CSS styles.
- Documentation.
- Animation definitions.
- Version history.
- Release versions.

The code should not need to be edited directly inside Webflow.

### jsDelivr

jsDelivr will distribute the files stored in GitHub through a CDN.

For example:

```html
<script src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/dist/webflow-motion.js"></script>
```

Each Webflow project can therefore reference a specific version of the system.

### Webflow

Webflow will provide:

- Page structure.
- Content.
- Design.
- Typography.
- Links.
- Optional configuration through HTML attributes.

The motion system will be loaded through Webflow Custom Code.

## Tools

### JavaScript

JavaScript will control the system's behavior.

It will handle:

- System initialization.
- Page-load detection.
- Navigation detection.
- Internal link detection.
- Destination URL detection.
- Page name detection.
- Loader lifecycle.
- Transition lifecycle.
- Navigation state.
- Animation sequencing.

### CSS

CSS will define:

- Full-screen overlays.
- Initial and final states.
- Typography.
- Layout.
- Visibility states.
- Fallback transitions.
- Responsive behavior.

The system should keep presentation-related styles in CSS wherever possible.

### GSAP

GSAP will be used as the animation engine.

It will provide control over:

- opacity
- transform
- duration
- ease
- timelines
- animation sequencing
- callbacks

This will allow the system to support simple fades initially while leaving room for more sophisticated animations later.

### GitHub

GitHub will provide:

- Source control.
- Version history.
- Releases.
- Collaboration.
- Client/project version management.

### jsDelivr

jsDelivr will act as the distribution layer between GitHub and Webflow.

The production website will load a specific release rather than the development branch.

## System Architecture

The system should be built around a shared core rather than treating loaders and transitions as completely separate systems.

```
             Webflow Motion
                  │
          ┌───────┴───────┐
          │      Core     │
          │               │
          │ Initialization│
          │ Lifecycle     │
          │ Overlay       │
          │ Animation     │
          │ Configuration │
          └───────┬───────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
    Page Loader      Page Transition
         │                 │
         ↓                 ↓
   Initial load       Navigation
```

This allows both features to share the same overlay and animation infrastructure.

## Page Loader

The page loader runs when the user initially enters the website.

The basic lifecycle will be:

```
Browser loads page
        ↓
Motion system initializes
        ↓
Loader becomes visible
        ↓
Page / assets become ready
        ↓
Loader exit animation
        ↓
Website revealed
```

A simple implementation could display:

```
┌──────────────────────────────┐
│                              │
│                              │
│           STUDIO             │
│                              │
│           0 — 100%           │
│                              │
└──────────────────────────────┘
```

The loader should be configurable so that projects can choose whether to display:

- A logo.
- A page name.
- A loading percentage.
- A simple animation.
- Custom content.
- Nothing other than the overlay itself.

## Page Transitions

Page transitions run when the user navigates between internal pages.

The basic lifecycle will be:

```
User clicks internal link
        ↓
Navigation intercepted
        ↓
Destination detected
        ↓
Destination page name retrieved
        ↓
Overlay enters
        ↓
Page name appears
        ↓
Current page exits
        ↓
Navigate to destination
        ↓
New page loads
        ↓
New page enters
        ↓
Overlay exits
```

For example:

```
HOME
  │
  │ click → ABOUT
  ▼
┌──────────────────────────┐
│                          │
│          ABOUT           │
│                          │
└──────────────────────────┘
          ↓
        fade
          ↓
┌──────────────────────────┐
│                          │
│          ABOUT           │
│                          │
│       New content        │
│                          │
└──────────────────────────┘
```

## Overlays

The loader and page transition system each use their own independent overlay element. Both are created during initialization and remain in the DOM for the lifetime of the page.

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│             ABOUT                │
│                                  │
│                                  │
└──────────────────────────────────┘
```

Using separate overlays means any class or style applied by a custom animation (e.g. the curtain gradient) stays isolated to its overlay and never bleeds into the other.

Both overlays share the same helper functions — `_setOverlayColor`, `_setOverlayText`, `_showOverlayInstant`, `_resetOverlay` — which each receive the overlay object as their first argument.

## Page Name Detection

The system should avoid requiring manual configuration for every page.

The first approach will use information already available in the document.

For example:

```html
<title>About — Studio</title>
```

The system can extract:

```
About
```

For projects requiring more control, a custom attribute can be used:

```html
<body data-page="About">
```

The custom attribute should take precedence over the document title.

This makes it possible to separate the browser page title from the visual title used by the transition.

## Configuration

The system should support project-level configuration.

For example:

```js
WebflowMotion.init({
  loader: true,
  pageTransitions: true,
  showPageName: true
});
```

Future configuration could include:

```js
WebflowMotion.init({
  loader: true,
  pageTransitions: true,
  showPageName: true,
  animation: "fade",
  duration: 0.8,
  ease: "power2.inOut"
});
```

The exact API will be defined during implementation.

The goal is to keep project-specific configuration separate from the core animation logic.

## Initial Project Structure

The first version should remain lightweight.

A possible structure:

```text
webflow-motion/
│
├── src/
│   ├── core/
│   │   ├── state.js
│   │   ├── overlay.js
│   │   ├── lifecycle.js
│   │   ├── init.js
│   │   └── presets.js
│   │
│   ├── loader/
│   │   └── loader.js
│   │
│   ├── transitions/
│   │   └── page-transition.js
│   │
│   ├── animations/
│   │   ├── fade.js
│   │   └── curtain.js
│   │
│   └── styles/
│       └── main.css
│
├── scripts/
│   └── build.js
│
├── dist/
│   ├── webflow-motion.js
│   └── webflow-motion.css
│
├── README.md
└── LICENSE
```

Initially, we will avoid unnecessary tooling.

The architecture should remain simple enough to understand and maintain without introducing a complex build pipeline.

## Webflow Integration

The final integration should be minimal.

For example:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/dist/webflow-motion.css"
>

<script
  src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/dist/webflow-motion.js">
</script>
```

After loading, the system initializes automatically or through a small project configuration.

The Webflow project should not contain the actual animation implementation.

## Link Handling

The transition system should only intercept appropriate navigation.

It should handle:

- `/about`
- `/work`
- `/contact`

and ignore:

- `https://external-site.com`
- `mailto:`
- `tel:`
- `#section`

It should also account for:

- Modifier keys.
- New-tab navigation.
- Browser navigation.
- Accessibility.
- Keyboard interaction.

The goal is to enhance navigation without breaking standard browser behavior.

## Local Development

Clone the repository and serve the test pages with any static server.

```bash
npx serve .
```

Then open `http://localhost:3000/test/` in your browser.

- `test/index.html` — home page, runs the **loader** on first visit
- `test/about.html`, `work.html`, `contact.html` — inner pages for testing **transitions**

### Building

After editing any source file, rebuild the dist manually:

```bash
node scripts/build.js
```

Or run watch mode to rebuild automatically on every save:

```bash
node scripts/build.js --watch
```

Open two terminal tabs — one for the server, one for the watcher:

```
Tab 1: npx serve .
Tab 2: node scripts/build.js --watch
```

Then hard-refresh the browser (`Cmd+Shift+R` / `Ctrl+Shift+R`) after each save to pick up the new dist.

## Getting Started

There are two ways to integrate the system: a quick paste method for testing, and a CDN-based setup for production.

### Option A — Quick test (paste directly into Webflow)

Use this to try the system out before setting up a GitHub repository.

In **Site Settings → Custom Code → Head**, add both the anti-flash snippet and the stylesheet:

```html
<!-- Hides the page before the first paint to prevent flash of content.
     Sets opacity and background directly on <html> as inline styles —
     highest possible specificity, cannot be overridden by any stylesheet.
     Removed by the motion script once the overlay is in place. -->
<script>
  (function(){
    var bg = '#000000';
    var raw = sessionStorage.getItem('wm_transition');
    if (raw) { try { bg = JSON.parse(raw).color || bg; } catch(e){} }
    document.documentElement.style.opacity = '0';
    document.documentElement.style.backgroundColor = bg;
  })();
</script>

<style>
  /* paste the full contents of dist/webflow-motion.css here */
</style>
```

In **Site Settings → Custom Code → Footer**, add:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
  /* paste the full contents of dist/webflow-motion.js here */
</script>
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
    showPageName: true
  });
</script>
```

Publish the site and test the loader and transitions.

---

### Option B — Production setup (GitHub + jsDelivr)

This is the recommended approach for live projects. The system is served from a CDN and tied to a specific version, so updates to the repository never affect existing client sites.

**1. Push the repository to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin master
```

**2. Create a release tag**

```bash
git tag v1.0.0
git push origin v1.0.0
```

jsDelivr automatically serves any tagged GitHub release. The first request to a new tag can take 2–3 minutes to propagate — if the URL returns a 404, wait a moment and try again.

**3. Add the anti-flash snippet and stylesheet**

In **Site Settings → Custom Code → Head**:

```html
<!-- Hides the page before the first paint to prevent flash of content.
     Sets opacity and background directly on <html> as inline styles —
     highest possible specificity, cannot be overridden by any stylesheet.
     Removed by the motion script once the overlay is in place. -->
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
  href="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@v1.0.0/dist/webflow-motion.css"
>
```

**4. Load GSAP and the motion script**

In **Site Settings → Custom Code → Footer**:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@v1.0.0/dist/webflow-motion.js"></script>
```

GSAP must load before the motion script.

**5. Initialize**

Immediately after the script tags:

```html
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
    showPageName: true
  });
</script>
```

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `loader` | boolean | `true` | Show the full-screen loader on initial page load |
| `pageTransitions` | boolean | `true` | Enable page transition animations |
| `showPageName` | boolean | `true` | Display the destination page name during transitions |
| `loaderColor` | string | `#000000` | Background color of the loader overlay |
| `loaderText` | string | `Loading` | Text displayed during the loader |
| `loaderLottie` | string | `null` | Path or URL to a Lottie JSON file — replaces the text loader when set |
| `loaderWaitForLoop` | boolean | `true` | Wait for one full Lottie loop to complete before exiting the loader |
| `transitionColor` | string | `#353535` | Background color of the transition overlay |
| `duration` | number | `0.7` | Animation duration in seconds |
| `ease` | string | `power2.inOut` | GSAP easing function |
| `animateIn` | function | `null` | Custom enter animation — replaces the default fade |
| `animateOut` | function | `null` | Custom exit animation — replaces the default fade |

### Custom animations

By default the overlay fades in and out with a subtle text slide. To replace this with your own animation, pass `animateIn` and `animateOut` functions to `init()`.

Both functions receive:
- `overlay.el` — the full-screen background `<div>`
- `overlay.text` — the text label `<span>`
- `done` — a callback you **must** call when the animation finishes (triggers navigation or page reveal)

**Example — slide up:**

```html
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
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
</script>
```

**Example — clip path wipe:**

```html
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
    animateIn: function(overlay, done) {
      gsap.fromTo(overlay.el,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power2.inOut', onComplete: done }
      );
    },
    animateOut: function(overlay, done) {
      gsap.to(overlay.el,
        { clipPath: 'inset(0 0 0 100%)', duration: 0.7, ease: 'power2.inOut', onComplete: done }
      );
    }
  });
</script>
```

If only one function is provided, the other falls back to the default fade.

### Animation presets

The boilerplate ships with a built-in curtain preset accessible via `WebflowMotion.presets`. Presets are available after the script loads and can be passed directly to `init()`.

**Available presets:**

| Preset | Description |
|---|---|
| `WebflowMotion.presets.curtain` | Slides the overlay up from below the viewport on exit, and off the top on entry. Uses a gradient that fades to transparent at both ends. |

**Usage:**

```html
<script>
  WebflowMotion.init({
    loader: true,
    pageTransitions: true,
    animateIn: WebflowMotion.presets.curtain.animateIn,
    animateOut: WebflowMotion.presets.curtain.animateOut
  });
</script>
```

The curtain respects `duration` and `ease` from the config, so its speed is controlled the same way as the default fade.

### Custom page names

By default the transition reads the page name from the URL path (`/about` → `About`). To override it, add a `data-page` attribute to the link:

```html
<a href="/about" data-page="Our Story">Our Story</a>
```

## Versioning

Production projects should always reference a specific version tag rather than `main`.

```html
<!-- ✓ pinned to a version — safe for production -->
<script src="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.0/dist/webflow-motion.js"></script>

<!-- ✗ always latest — a future update could break existing sites -->
<script src="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@main/dist/webflow-motion.js"></script>
```

This means a client site can stay on `v1.0.0` indefinitely while new projects use `v1.2.0`. Changes to the repo never affect live sites unless you manually update the version in Webflow.

### When to create a new tag

Create a new tag whenever you ship a change that should be available to projects:

- Bug fix → increment the patch version: `v1.0.0` → `v1.0.1`
- New feature or config option → increment the minor version: `v1.0.0` → `v1.1.0`
- Breaking change (different API, renamed options) → increment the major version: `v1.0.0` → `v2.0.0`

### How to release a new version

**1. Make your changes in `src/`, then rebuild dist:**

```bash
node scripts/build.js
```

**2. Commit everything:**

```bash
git add src/ dist/
git commit -m "feat: describe what changed"
```

**3. Tag the release and push:**

```bash
git tag v1.0.1
git push origin master
git push origin v1.0.1
```

jsDelivr picks up the new tag automatically within a few minutes.

### How to update a Webflow project to a new version

In Webflow, go to **Site Settings → Custom Code** and update the version number in the two CDN URLs (head and footer):

```html
<!-- change @v1.0.0 to @v1.0.1 in both the CSS and JS links -->
href="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.1/dist/webflow-motion.css"
src="https://cdn.jsdelivr.net/gh/NamaWorks/wf-motion-boilerplate@v1.0.1/dist/webflow-motion.js"
```

Publish the site. The old version keeps working on any other project until you update it there too.

## Version 1.0.0 — MVP

The first version will focus on establishing a reliable foundation.

### Page Loader

- Full-screen loader.
- Loader entrance state.
- Loader exit animation.
- Page-ready detection.
- Optional page name.
- Automatic initialization.

### Page Transitions

- Full-screen transition overlay.
- Internal link detection.
- Destination URL detection.
- Destination page name detection.
- Page name fade in.
- Overlay transition.
- Navigation handling.
- New-page reveal animation.

### Core

- Shared overlay.
- Shared animation lifecycle.
- Basic configuration.
- GSAP integration.
- Webflow compatibility.
- Accessibility-conscious navigation handling.

## Future Development

Once the MVP is stable, the system can evolve into a more complete motion framework.

Potential features include:

- Multiple loader presets.
- Multiple page transition presets.
- Slide transitions.
- Scale transitions.
- Clip-path transitions.
- Direction-aware transitions.
- Page-specific animations.
- Shared element transitions.
- Page preloading.
- Progress indicators.
- Custom loader components.
- Animation hooks.
- `data-*` configuration.
- Barba.js integration.
- JavaScript API.
- Transition presets.
- Project-specific configuration files.

For example:

```html
<a href="/about" data-transition="fade">About</a>
```

or:

```html
<a href="/work" data-transition="slide">Work</a>
```

This would allow the same boilerplate to support different visual languages across different Webflow projects.

## Design Principles

The boilerplate should follow a few core principles.

**Keep Webflow simple**

Webflow should remain responsible for content, structure, and design.

**Keep animation logic external**

Animation logic should live in the GitHub repository rather than being duplicated across Webflow projects.

**Keep the API simple**

A new project should require minimal configuration.

**Make behavior predictable**

Navigation should never be broken simply because the animation system fails.

**Make versions explicit**

Production websites should always use a known version.

**Build for reuse**

Features should be designed so they can be reused across multiple clients and projects.

## Project Philosophy

The core philosophy of the boilerplate is:

> Webflow defines the content and design. GitHub defines the motion logic. The CDN distributes the system.

The final result should be a lightweight motion layer that can be added to any Webflow project and provide a consistent foundation for loaders, page transitions, and future navigation animations.
