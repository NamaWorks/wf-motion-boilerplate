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

## Shared Overlay

The loader and page transition system should use a shared overlay component.

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│             ABOUT                │
│                                  │
│                                  │
└──────────────────────────────────┘
```

This overlay will be controlled by the core animation system.

This allows the same component to be used for:

- Initial page loading.
- Page transitions.
- Future modal transitions.
- Future route changes.
- Custom project-specific animations.

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
│   │   ├── init.js
│   │   ├── lifecycle.js
│   │   └── overlay.js
│   │
│   ├── loader/
│   │   └── loader.js
│   │
│   ├── transitions/
│   │   └── page-transition.js
│   │
│   ├── animations/
│   │   └── fade.js
│   │
│   └── styles/
│       └── main.css
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

## Versioning

Production projects should always reference a specific version.

For example:

```html
<script src="https://cdn.jsdelivr.net/gh/USER/REPO@v1.0.0/dist/webflow-motion.js"></script>
```

Rather than:

```html
<script src="https://cdn.jsdelivr.net/gh/USER/REPO@main/dist/webflow-motion.js"></script>
```

This prevents changes to the repository from unexpectedly affecting existing client websites.

A project can therefore remain on `v1.0.0` while a newer project uses `v1.2.0`.

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
