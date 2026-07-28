# Chord Library

Chord charts for the worship team, ready to play from. Browse by artist, check the key and capo before rehearsal, and transpose live on your phone or tablet — no printouts, no separate app.

**Live site:** https://allenvincentlucas.github.io/worship-chord-library/

## What this is

A small ChordPro chart repo that builds itself into a static site via GitHub
Pages. Charts live as plain `.cho` files; everything else — the song pages,
the homepage catalog, artist grouping, theme tags, and social preview
cards — is generated automatically on every push.

## How it works

1. **Add a chart.** Drop a ChordPro-formatted `.cho` file into `songs/`.
   The filename is the song title slugified (lowercase, non-alphanumeric
   runs collapsed to a single hyphen) — e.g. `Goodness of God` →
   `songs/goodness-of-god.cho`.
2. **Push to `main`.** A GitHub Action (`.github/workflows/build.yml`)
   picks up any change under `songs/`, `scripts/`, `assets/`, or
   `data/taxonomy.json`.
3. **The build runs automatically:**
   - Reads every `.cho` file and extracts its metadata directives
     (`{title}`, `{artist}`, `{key}`, `{youtube}`, `{info}`, `{theme}`, etc.)
   - Auto-detects a theme for any chart that doesn't specify one, using
     `data/taxonomy.json`
   - Renders the chord chart with ChordSheetJS
   - Writes `site/songs/{slug}.html`
   - Generates a minimalist social card at `site/assets/cards/{slug}.png`
   - Regenerates `site/index.html` with the full, re-grouped catalog
   - Regenerates `data/artists.json` and `data/themes-in-use.json`
4. **Deploy.** The contents of `/site` are published to GitHub Pages.

No manual build step is required — pushing a `.cho` file is the entire
publish action.

## Repo structure

```
songs/                  Source ChordPro charts (.cho) — the only thing you edit by hand
scripts/                Build scripts (categorize.js, build.js)
data/taxonomy.json      Theme auto-detection rules
data/artists.json       Generated — do not edit
data/themes-in-use.json Generated — do not edit
site/                   Generated output, deployed to GitHub Pages — do not edit
.github/workflows/      build.yml — the CI build + deploy Action
```

`/site` is build output. Any hand edits there are overwritten on the next
push — always change the source `.cho` file (or the scripts/taxonomy) instead.

## Adding or updating a song

- **New song:** create `songs/{slug}.cho`, commit as `Add song: {Title}`.
- **Update:** overwrite the existing `songs/{slug}.cho` in place (same
  filename, so the page URL and social card stay stable), commit as
  `Update song: {Title}`.
- Only `{title: ...}` is required. Everything else (`artist`, `key`,
  `youtube`, `info`, `theme`) is optional — missing fields just won't
  render on the page.
- If you don't set `{theme: ...}`, the build auto-detects one from
  `data/taxonomy.json`. If you do set it explicitly, that bypasses
  auto-detection entirely.

## License

Charts are provided for worship team / personal use. Check individual song
copyrights before any public redistribution.
