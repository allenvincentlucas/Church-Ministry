# Ten Minutes with the Gospel

A short, honest reflection on each day's Catholic Gospel reading — for busy
people who want ten minutes to actually sit with it.

This is the whole site in one repo: a home page, an archive organized by
month, and one hand-built page per day's reflection.

## Structure

```
index.html              Home — features the latest entry
style.css / script.js   Home page files
manifest.json           One line per entry — the site's "index card" of
                         every reflection ever built. Home, Archive, and
                         every month page all read this file.

archive/index.html      Archive — lists every month that has an entry
archive/style.css
archive/script.js

month-page.css          Shared styling for EVERY month page
month-page.js           Shared script for EVERY month page — it reads its
                         own folder (e.g. /2026/07/) to know which month
                         it is, so this file is never edited per month

2026/07/index.html      A month page (copied from templates/month-page/,
                         never edited — see workflow below)
2026/07/21/index.html   A day's reflection — hand-built, own style.css /
                         script.js / og-image.png, same pattern as before

assets/tokens.css        Shared color & font variables for the site chrome
assets/site-nav.css      Shared nav bar / breadcrumb / footer styling

templates/month-page/    Copy this folder's index.html into a new /YYYY/MM/
                         whenever the first entry of a new month is built
templates/day-nav-snippet.html
                         The nav bar + breadcrumb markup to paste into
                         every new day page (with the two CSS links noted
                         inside it)
```

## Workflow: adding a new day's reflection

1. Build that day's reflection exactly as before (Douay-Rheims text,
   re-derived palette, homily, song, Catechism cross-refs, og-image.png,
   the works) and save it at `/YYYY/MM/DD/index.html` (plus its own
   `style.css`, `script.js`, `og-image.png`).
2. Paste the nav snippet from `templates/day-nav-snippet.html` into that
   page (see the comment inside it for the two exact lines to add).
3. If this is the **first entry of a new month**, copy
   `templates/month-page/index.html` into the new `/YYYY/MM/` folder —
   nothing inside it needs editing; it reads its own URL and
   `manifest.json` automatically.
4. Add one entry to the end of `manifest.json`:
   ```json
   {
     "date": "2026-07-21",
     "slug": "2026/07/21",
     "title": "The Sign You Weren't Looking For",
     "lede": "One sentence describing what this reflection is about.",
     "citation": "Matthew 12:38-42",
     "liturgicalDay": "Tuesday of the Sixteenth Week in Ordinary Time"
   }
   ```
5. Upload everything. Home, the Archive, and that month's page will pick up
   the new entry automatically — none of them need manual edits.

## Deploying on GitHub Pages (free tier)

1. Create a new repository (see suggested name below) and upload every
   file above, keeping the folder structure intact.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a
   branch," branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a URL like
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/` — that's the live
   site.

**A limit worth knowing:** GitHub Pages is static hosting only — there's no
database and nothing updates itself on a schedule. Every new day has to be
built and uploaded by hand (or by asking me to build it), same as before.
The `manifest.json` approach above just means Home/Archive/month pages
don't *also* need hand-editing every time — only the one JSON entry does.

## Copyright practices used throughout this site

- **Scripture**: every Gospel passage is reproduced in the public-domain
  Douay-Rheims (Challoner) translation. The official Mass reading (usually
  NABRE) is never reproduced — each day links to its USCCB source instead.
- **Catechism**: cross-references are always paraphrased, never quoted
  verbatim, with a link to the Church's own text.
- **Videos & music**: embedded via standard YouTube iframes, never
  downloaded or rehosted. Song lyrics are never reproduced, in any amount.
- **Images**: every illustration is inline SVG or a generated PNG
  (`og-image.png`) built in-house — nothing that can 404 on GitHub Pages.

## Suggested repo name & "About" description

- **Repo name:** `ten-minutes-with-the-gospel`
- **About:** "A short daily reflection on the Catholic Gospel reading —
  home page, monthly archive, one page per day."
