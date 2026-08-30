# CLAUDE.md

Guidance for Claude (and other contributors) working in this repo.

## What this repo is

A personal GitHub Pages site (`AlexManev.github.io`) that acts as a **hub for
small web apps and experiments**. It is served **statically** — there is no
server, no framework, and **no build pipeline that runs on deploy**. Whatever is
committed is exactly what ships to `https://alexmanev.github.io`.

```
/
├─ index.html      # the hub: renders a searchable grid of app cards
├─ apps.json       # the manifest the hub reads (profile + list of apps)
├─ apps/           # one folder per app, each with its own index.html
│  ├─ hello-world/          # minimal plain-HTML example
│  └─ contraction-timer/    # React example (vendored deps, pre-transpiled)
├─ README.md
└─ CLAUDE.md
```

## The golden rule

**The hub does not auto-discover apps.** An app is only visible once it has an
entry in `apps.json`. Adding files under `apps/` without updating `apps.json`
ships a page that nobody can reach from the hub. Always do both.

## How to add a new app

1. **Create the folder** `apps/<slug>/` with an `index.html` as its entry point.
   Use a lowercase-hyphenated slug (`sleep-tracker`, not `Sleep Tracker`).
   GitHub Pages serves it at `https://alexmanev.github.io/apps/<slug>/`.

2. **Add an entry** to the `apps` array in `apps.json`. New apps go **first**
   (the array is rendered in order):

   ```json
   {
     "title": "Sleep Tracker",
     "description": "One sentence on what it does and who it's for.",
     "path": "apps/sleep-tracker/",
     "tags": ["health", "tool"],
     "emoji": "😴"
   }
   ```

   - `path` must end in a trailing slash and be relative to the repo root.
   - `title`, `description`, `tags`, and `emoji` are the only fields the hub
     renders. `tags` feed the search box, so pick words someone might type.

3. **Add a "Back to home" link** in the app so people can return to the hub.
   Since apps live two levels deep, link to `../../`:

   ```html
   <a href="../../">← Back to home</a>
   ```

4. **Validate `apps.json`** before committing — a syntax error breaks the whole
   hub (it renders an error state instead of the grid):

   ```
   python3 -c "import json; json.load(open('apps.json'))"
   ```

5. **Verify it renders** with a local server (never open via `file://` — relative
   fetches and paths behave differently):

   ```
   python3 -m http.server 8000
   # then visit http://localhost:8000/ and click through to the app
   ```

## Two app patterns

### Plain static (default — prefer this)

Self-contained HTML/CSS/vanilla-JS in one `index.html`. No dependencies, nothing
to build. `apps/hello-world/` is the template — copy it. Reach for this first.

### React / needs a build step

`apps/contraction-timer/` is the reference. Because deploys are static, do **not**
rely on a CDN or in-browser Babel at runtime. Instead:

- **Vendor dependencies locally** under the app's own `vendor/` folder (e.g. the
  React + ReactDOM UMD builds). No external CDN requests at runtime — the app
  works offline and can't break when a CDN does.
- **Keep JSX source separate and pre-transpile it.** Source lives in
  `app.src.jsx`; the page loads the compiled `app.js`. The rebuild command is
  documented in a header comment at the top of `app.src.jsx` — after editing the
  source, regenerate `app.js` and commit both.
- Dependencies are installed from **npm** (the only reachable package source in
  this environment — public CDNs like cdnjs are blocked here). Fetch UMD builds
  via `npm install <pkg>` and copy them into `vendor/`.

Only take on a build step when an app genuinely needs a framework. A small app
should stay plain static.

## Porting a Claude artifact into an app

Apps like the Contraction Timer originated as Claude artifacts, which run against
the artifact **runtime APIs**. Those globals don't exist on a plain web page, so
shim them:

- `window.storage` (async `get`/`set`) → back it with `localStorage`, wrapped in
  `try/catch` with an in-memory fallback so a blocked storage jar (private mode)
  doesn't crash the app. See the shim in `apps/contraction-timer/index.html`.
- Other artifact capabilities (`window.claude.*`, shared state, etc.) have no
  static equivalent — if an artifact depends on them, flag it rather than fake
  it.

Keep user data **on-device**. These are personal, private tools; don't add
analytics, network calls, or third-party embeds without being asked.

## Conventions

- **No secrets, keys, or tokens** in the repo — everything here is public and
  served as-is.
- **Mobile-first and responsive.** Many of these are used on a phone; test at a
  narrow width. Respect `prefers-reduced-motion` for anything animated.
- **Theme-aware where it makes sense** — the hub follows the visitor's light/dark
  system setting; individual apps may commit to their own look.
- **Keep the hub's editable content in `apps.json`**, not hard-coded in
  `index.html`. The header name, tagline, and links come from the `profile`
  object there.
- **Match the surrounding style** of whatever file you're editing.

## Editing the hub header

Name, tagline, and profile links render from the `profile` object at the top of
`apps.json`. Edit them there, not in `index.html`.
