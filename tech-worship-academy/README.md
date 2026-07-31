# Tech & Worship Academy

A growing, self-paced learning hub for church ministry volunteers — plain HTML/CSS/JS, no build step, hosted free on GitHub Pages.

## Structure

```
index.html                        Home page (lists ministry areas)
assets/css/style.css               Master copy of the shared theme (see note below)
assets/js/site.js                  Master copy of the shared behavior (see note below)
categories/tech-media/index.html   Tech & Media Ministry — lists its topics
categories/music/index.html        Music Ministry — lists its topics
topics/l12next/index.html          Topic: Zoom LiveTrak L12next
topics/freeshow/index.html         Topic: FreeShow
topics/guitar-capo/index.html      Topic: Guitar Capo for Worship
topics/vocal-range/index.html      Topic: Finding Your Vocal Range
topics/leading-vs-performing/index.html            Topic: Leading Congregational Singing vs. Performing
topics/guitar-open-chords-foundations/index.html   Topic: Worship Guitar, Part 1 (Days 1-7)
topics/guitar-rhythm-strumming/index.html          Topic: Worship Guitar, Part 2 (Days 8-14)
topics/guitar-barre-fingerpicking/index.html       Topic: Worship Guitar, Part 3 (Days 15-21)
topics/guitar-theory-essentials/index.html         Topic: Worship Guitar, Part 4 (Days 22-30)
topics/harmony-basics/index.html                   Topic: Harmony Basics for Backup Vocalists
```

**Important — the CSS and JS are inlined in every page.** Each `index.html` file already contains its own copy of the theme (inside a `<style>` block) and the progress-tracking script (inside a `<script>` block at the bottom). This is deliberate: GitHub's drag-and-drop uploader can silently flatten subfolders, which breaks the link to `assets/css/style.css` and leaves the page unstyled. Inlining removes that failure point entirely — every page renders correctly on its own, no matter how the folder structure survives upload.

The files under `assets/` are kept as a master reference copy for editing. If you change the theme, edit `assets/css/style.css`, then paste the updated CSS into the `<style>` block of every page (same for `assets/js/site.js` and each page's `<script>` block).

## Deploying to GitHub Pages (free)

1. Create a new **public** repository on GitHub (e.g. `tech-worship-academy`).
2. Upload every file in this folder to the repo, keeping the same folder structure (drag-and-drop on github.com works fine — just make sure `assets/`, `categories/`, and `topics/` land as real subfolders, not flattened).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
5. GitHub gives you a URL like `https://yourusername.github.io/tech-worship-academy/` within a minute or two.

## Adding a new topic later

1. Duplicate an existing topic folder under `topics/` (e.g. copy `topics/guitar-capo/` to `topics/new-topic/`).
2. Update its `<title>`, headings, lesson content, and the `data-topic="..."` value on `<body>` (must be unique — this is the key used for saved progress).
3. Add a `<a class="cue-row">` entry pointing to it on the relevant `categories/.../index.html` page.
4. If it's the first topic in a brand-new ministry area, copy the `categories/tech-media/` folder as a starting template for the new category page, then add a new card to `index.html`.

Everything shares `assets/css/style.css` and `assets/js/site.js`, so new topics automatically match the site's look and behavior — no extra setup needed.

## Notes on the free GitHub Pages plan

- The repo (and site) will be publicly visible.
- No server, database, or login — this is a static site.
- Progress checkmarks are saved per-browser via `localStorage`, not synced across devices.
- Storage/bandwidth limits are generous for a site like this; you won't come close under normal use.
