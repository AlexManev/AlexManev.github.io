# AlexManev.github.io

My personal GitHub Pages site — a hub that lists and hosts small web apps and
experiments. Live at **https://alexmanev.github.io**.

## How it works

- **`index.html`** is the landing page. It reads **`apps.json`** and renders a
  searchable grid of cards, one per app. No build step — it's plain HTML/CSS/JS.
- Each app lives in its own folder under **`apps/`** with its own `index.html`.
- GitHub Pages serves everything statically, so any folder with an `index.html`
  is reachable at `https://alexmanev.github.io/<path>/`.

## Adding a new app

1. Create a folder, e.g. `apps/my-app/`, with an `index.html` inside it
   (copy `apps/hello-world/` as a starting point).
2. Add an entry to the `apps` array in `apps.json`:

   ```json
   {
     "title": "My App",
     "description": "What it does.",
     "path": "apps/my-app/",
     "tags": ["tool"],
     "emoji": "🚀"
   }
   ```

3. Commit and push to `main`. GitHub Pages redeploys automatically.

## Editing the header

The name, tagline, and profile links come from the `profile` object at the top
of `apps.json` — edit them there.
