# ScaleReach: clips ready

A prototype for the ScaleReach UI exercise. It shows the screen a creator sees when they come back to the clips generated from a long video.

It is a static site with no build step and no dependencies: plain HTML, CSS and ES modules.

## Run it

ES modules need to be served over HTTP, so opening `index.html` from the file system will not work.

```bash
npx serve .            # or
python3 -m http.server 8000
```

To host it, upload the folder as-is to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

## What to try

| Action | What it shows |
| --- | --- |
| Look at the screen for two seconds | The top picks are pre-selected, and "Schedule 4 clips" is the one primary action |
| Untick or tick clips | The schedule button count updates; it disables with a clear label at zero |
| Click any clip | Opens it in the right panel: preview, score with a plain reason, what's said, where it sits in the episode |
| **Schedule 4 clips** | Pick platforms and a start time |
| **Retry** on "Webinar: GTM for SaaS" | Picks up from the failed step using the saved video. Clicking twice still starts one run |
| **Upload video** → `ep42_pricing.mp4` | Same file, same upload key: opens the existing job instead of processing it again |
| Close the tab, come back later | Jobs catch up on the time you were away, as a server-side queue would |

Add `?demo` to the URL to show a "Reset demo data" link.

## Design decisions

- **What stands out first: the top picks.** A creator comes back to decide what to post. The four highest-scoring clips are pre-selected, each with one plain sentence on why it scored well, so the decision is mostly confirming.
- **Where the main action sits: top right, next to the title.** "Schedule 4 clips" is the only filled button and carries the selection count. Download is secondary, because posting is the goal and a file is a step on the way.
- **Hierarchy.** Title, then top picks, then the remaining clips in a smaller grid. Detail lives in the right panel so the grid stays scannable.
- **Typography and spacing.** One family (Geist), with tabular figures for scores and timecodes so they line up; text is never below 12 px; a 4 px spacing scale.
- **Open vs selected.** The clip in the preview gets a dark frame and a dark "Previewing" tag (bottom left). Selected clips get a light blue card and a "Selected" tag (top right). Solid blue is reserved for the Schedule button.
- **Status lives with the job, not the tab.** The uploads list groups jobs into Needs attention, In progress and Ready, so a failed job is visible without crowding the clips.
- **Brand.** Colors, radius and type follow the light theme defined on scalereach.ai: Geist, ScaleReach blue `#2553CB` and the neutral palette. Score weights (hook 40%, pacing 35%, engagement 25%) match the site.

## Code structure

```
index.html              Page shell, dialogs
assets/                 Logo and favicon
css/
  tokens.css            Design tokens (color, type, spacing, radius)
  base.css              Reset, focus styles, utilities
  layout.css            Top bar and three-pane shell, responsive rules
  components.css        Buttons, job list, timeline, clip grid, detail panel, dialogs, toasts
js/
  main.js               Entry point: rendering and the delegated action handlers
  store.js              State container with localStorage persistence
  data.js               Mock data, score weights, upload keys
  selectors.js          Derived data (active job, visible clips, top clip)
  jobs.js               Simulated job queue: processing, catch-up after a closed tab, idempotent retry, upload de-duplication
  views/                Pure functions that turn state into markup
  ui/                   Toasts and native <dialog> helpers
  utils/                Escaping template helper, formatting
```

Rendering is a small one-way loop: actions call `update()`, the store notifies, and each region re-renders only when its markup changed. All interpolated text goes through an escaping `html` template tag, so edited titles and captions cannot inject markup.

All content is mock data.
