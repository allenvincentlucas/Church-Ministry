# Chord Library — Project Instructions

This repo turns a pasted ChordPro (`.cho`) file into a fully formatted, themed
chart page — automatically. This doc explains the folder layout, the one
workflow you need to know, and how the promo step works when you're ready to
publish.

---

## Folder structure

```
chord-library/
├── songs/                   ← PASTE YOUR .cho FILES HERE. That's it.
│   └── example-song.cho     ← reference file showing every supported field
│
├── site/                    ← generated output — this is what GitHub Pages serves
│   ├── index.html           ← homepage catalog (auto-built, do not hand-edit)
│   ├── songs/                ← one page per song (auto-built, do not hand-edit)
│   └── assets/
│       ├── style.css         ← copied from /assets automatically
│       ├── favicon.svg       ← copied from /assets automatically
│       └── cards/             ← generated social share card per song (PNG)
│
├── assets/                  ← SOURCE theme files (edit these, not the copies in /site)
│   ├── style.css             ← shared brand styling for every page
│   └── favicon.svg           ← brand favicon, used on every page
│
├── data/
│   ├── taxonomy.json         ← theme keyword map (edit to teach it new themes)
│   ├── artists.json           ← auto-generated list of artists in the catalog
│   └── themes-in-use.json     ← auto-generated list of themes currently in use
│
├── scripts/
│   ├── build.js               ← the one script you run
│   ├── categorize.js          ← metadata extraction + auto theme detection
│   ├── social-card.js          ← generates the per-song PNG share card
│   └── templates.js            ← HTML templates for homepage + song pages
│
├── .github/workflows/build.yml ← optional: auto-builds + deploys on every push
└── package.json
```

---

## The only workflow you need

1. **Paste your ChordPro chart** into a new file in `/songs`, e.g. `songs/goodness-of-god.cho`.
2. **Add metadata directives** at the top of the file (see field reference below).
   Only `{title: ...}` is required — everything else is optional and just adds
   more to the page.
3. **Run the build:**
   ```
   npm install       (only needed the first time)
   npm run build
   ```
4. Commit and push. If you're using the included GitHub Action, the site
   rebuilds and redeploys automatically on push — you don't even need to run
   `npm run build` yourself, just push the `.cho` file.

That's the entire process. One file in, one themed page out.

---

## Metadata field reference

Put these as ChordPro directives anywhere in the file (top is cleanest):

| Directive | Required? | What it does |
|---|---|---|
| `{title: ...}` | Yes | Song title, page title, catalog card title |
| `{artist: ...}` | Recommended | Groups the song under that artist on the homepage |
| `{key: ...}` | Recommended | Shown as a tag, feeds the call-number (e.g. `G·CAPO2`) |
| `{capo: ...}` | Optional | Shown as a tag, feeds the call-number |
| `{tempo: ...}` | Optional | Shown as a tag (BPM) |
| `{time: ...}` | Optional | Shown as a tag (e.g. `4/4`) |
| `{youtube: URL}` | Optional | Embeds the official video on the song page, if given |
| `{info: ...}` | Optional | Short blurb shown under the title — the "why this song is here" note |
| `{theme: ...}` | Optional | Comma-separated theme tag(s). **If you skip this, the build auto-detects theme(s) from the lyrics** using `data/taxonomy.json` |

Everything else in the file (verses, choruses, chords) is standard ChordPro
and renders as the actual chart.

---

## How auto-categorization works

- **Artist** grouping is literal — whatever you put in `{artist: ...}` becomes
  its own section on the homepage. As the catalog grows, songs just slot into
  existing or new artist sections automatically.
- **Theme** tagging: if you set `{theme: ...}` explicitly, that's used as-is.
  If you don't, the build scans the lyrics against the keyword lists in
  `data/taxonomy.json` and assigns the best-matching theme(s). To teach it a
  new theme or improve accuracy, just add keywords (or a whole new theme) to
  that file — no code changes needed.

---

## Social cards

Every song gets its own minimalist share card (`site/assets/cards/{slug}.png`,
1200×630) generated automatically at build time: title, artist, key/capo call
number, and theme tag on a plain paper card — no clutter, matches the site's
theme. This is the image that shows up when the song's page link is shared
on social media or messaging apps (via the page's Open Graph tags).

---
## A path gotcha to know about

GitHub Pages project sites (like this one) are served under a subpath —
`https://your-username.github.io/your-repo/` — not at the domain root. That
means any link or asset reference starting with a leading `/` (e.g.
`/assets/style.css`) resolves to `your-username.github.io/assets/style.css`,
which doesn't exist, instead of the actual file inside your repo. The
symptom is a page that loads but shows no styling (default browser fonts,
no colors) — the HTML rendered fine, the CSS just 404'd silently.

`scripts/templates.js` avoids this by using **relative paths** instead of
absolute ones:
- `site/index.html` (site root) links to `assets/style.css`
- `site/songs/{slug}.html` (one folder down) links to `../assets/style.css`

This is handled by the `favicon(assetPrefix)` helper and the explicit
`../` prefixes in `songPage()` versus the bare paths in `indexPage()`. If
you ever edit `templates.js` again — new nav links, new asset references,
a new page type — keep using relative paths (`assets/...`, `../assets/...`)
rather than reintroducing a leading `/`. If you add a page at a new folder
depth, its relative prefix needs to match how many folders deep it sits
relative to `/site`.

---

## Favicon

`assets/favicon.svg` is the one brand favicon used across the homepage and
every song page. It's copied into `site/assets/favicon.svg` on every build
and linked from every generated page automatically — you never need to add
it manually to a new page.

To change the favicon everywhere at once, just replace `assets/favicon.svg`
and rebuild.

---

## Publishing a song: the promo step (on request only)

This part is manual and separate from the build — it happens only when you
ask for it, after a song (or the whole site) is live:

1. You tell me a song is published and give me the live page URL
   (e.g. `https://your-username.github.io/your-repo/songs/goodness-of-god.html`).
2. I generate a **1-page Instagram carousel promo image** via Canva, using
   that song's info (title, artist, theme) and the site's visual language.
3. I write an accompanying **social media post**, with the live link you
   provided included as the reference/call-to-action.

You don't need to prepare anything for this step beyond having the page live
and handing me the URL — just ask when you're ready.

---

## First-time setup checklist

- [ ] `npm install`
- [ ] Set `SITE_URL` at the top of `scripts/build.js` to your actual GitHub
      Pages URL (needed for correct social-card and Open Graph links)
- [ ] If using the GitHub Action: enable **GitHub Pages → Source: GitHub
      Actions** in repo Settings → Pages
- [ ] Delete or replace `songs/example-song.cho` once you're adding real charts
