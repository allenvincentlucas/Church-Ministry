# Church Ministry

Official hub site for Allen Vincent Lucas's church tech and worship ministry projects — training for AV volunteers, a daily Gospel reflection archive, and a smart chord chart tool, all under one brand.

**Live site:** https://allenvincentlucas.github.io/Church-Ministry/

---

## What's here

### 🎛️ [Tech Worship Academy](tech-worship-academy/index.html)
Volunteer training for church AV/media teams — OBS, Zoom, FreeShow, PowerPoint, Google Slides, and the Behringer X32/L12 mixers, organized module by module across 16 topic pages and 4 category pages. Static HTML, no build step.

#### 🎵 Music Ministry — content roadmap
The [Music Ministry category](tech-worship-academy/categories/music/index.html) currently has 10 topics live, organized into 4 weekly themes. Planned topics are outlined lesson-by-lesson below so this doubles as a build tracker.

**Week 1 — Vocal Leading** *(live)*
- [x] MU.02 — Finding Your Vocal Range *(live · 6 lessons)*
  1. Why knowing your range matters
  2. Testing your range, step by step
  3. Voice types & where you fit
  4. Warming up before you sing
  5. Breathing technique for sustained notes
  6. Picking keys & talking to the band
- [x] MU.03 — Leading Congregational Singing vs. Performing *(live · 6 lessons)*
  1. The core difference
  2. Vocal cues that help people follow you
  3. Mic technique: distance & handling
  4. Body language & eye contact
  5. Staying out of the spotlight
  6. Nerves & staying focused on the room
- [x] MU.08 — Harmony Basics for Backup Vocalists *(live · 5 lessons)*
  1. Why harmony matters
  2. Hearing intervals: thirds & sixths
  3. Finding your part by ear
  4. Blending: volume, tone & vowels
  5. Staying in your lane

**Week 2 — Keys** *(MU.09/10 live; MU.11 planned)*
- [x] MU.09 — Keyboard Basics for Worship (voicing, pads vs. piano) *(live · 5 lessons)*
  1. Why keys matter in a worship band
  2. Piano vs. pad sounds — when to use each
  3. Basic voicing technique
  4. Building a simple pad sound in your patch
  5. Reading a Nashville Number chart on keys
- [x] MU.10 — Transposing on Keys Without Losing the Groove *(live · 5 lessons)*
  1. Why keys transposing is different
  2. Recognizing chord shapes across keys
  3. Transposition drills
  4. Keeping the groove while you transpose
  5. Common transposing mistakes in live sets
- [ ] MU.11 — Layering Keys with a Full Band
  1. Understanding your role in the mix — supporting, not competing
  2. Frequency awareness: staying out of guitar's and bass's space
  3. Dynamic layering — building through a song and pulling back
  4. Communicating with the sound engineer about your levels
  5. Staying out of the way: knowing when not to play

**Week 3 — Click Tracks & In-Ears** *(planned)*
- [ ] MU.12 — What a Click Track Is (and Why We Use One)
  1. What a click track actually is
  2. Why worship teams use them
  3. How a click reaches you (in-ears, monitor mix)
  4. Common misconceptions about clicks
  5. What to expect the first time you play with one
- [ ] MU.13 — Building a Click + Guide Track in FreeShow/Ableton
  1. What a guide track adds beyond a plain click
  2. Setting up a click track in FreeShow (or Ableton)
  3. Building a guide track: cues, count-ins, structure markers
  4. Syncing the guide track to the song's tempo map
  5. Exporting/routing it to the team's in-ears
- [ ] MU.14 — Troubleshooting Click/Track Sync Issues
  1. Common causes of drift/sync issues
  2. What to do if you lose the click mid-song
  3. Latency issues between click and in-ear monitors
  4. Testing your setup before service
  5. When to fall back to no click

**Week 4 — Guitar & Bass** *(guitar content live, bass/electric pending)*
- [x] MU.01 — Guitar Capo for Worship *(live)*
- [x] MU.04–MU.07 — 30-Day Worship Guitar Journey *(live, see below)*
- [ ] MU.15 — Bass Basics: Locking in with the Drummer/Click
  1. The bass player's core job: locking with the drummer
  2. Playing to a click without rushing or dragging
  3. Root note fundamentals and when to add movement
  4. Listening to the kick drum vs. the click
  5. Common mistakes bass players make live
- [ ] MU.16 — Electric Guitar Textures (ambient, lead fills)
  1. Texture vs. rhythm guitar roles
  2. Ambient/pad-like electric guitar tones
  3. Using effects (reverb, delay) tastefully
  4. Lead fills: when and how much
  5. Leaving space for vocals and other instruments

MU.04–MU.07 form a single 30-day worship guitar journey, split into 4 standalone topic pages (one per week) rather than one bundled page, each with a real worship song to play along with — sourced from the Worship Chord Library. See [content-calendar.md](tech-worship-academy/topics/guitar-beginner-30day/content-calendar.md) for the full day-by-day breakdown and which page covers which days.

Each new topic gets its own folder under `tech-worship-academy/topics/`, following the pattern in the editing guide below, plus a link from `categories/music/index.html`.

### ✝️ [Ten Minutes with the Gospel](ten-minutes-with-the-gospel/index.html)
A short daily reflection on the Catholic Gospel reading — Scripture text (Douay-Rheims, public domain), a real-world reflection, a linked homily video and reflection song, and Catechism cross-references, archived by month. 16 daily entries and counting. Static HTML, driven by a site-wide `manifest.json`.

### 🎸 [Worship Chord Library](worship-chord-library/site/index.html)
Paste a ChordPro (`.cho`) file, get a themed chart page with live transpose, capo suggestions, Nashville Number System view, and a generated social-share card. Organized by artist, theme, and category (Worship Song / Liturgical Songs). 8 songs and growing. Node.js build pipeline — **not static**, see below.

---

## Repo structure

```
/                              landing/hub page (index.html)
/_shared/                      shared brand assets used by every page
  theme.css                    brand tokens: Paper/Ink/Index Blue/Stone + fonts, hub nav/footer styles
  favicon.svg, favicon-*.png,  standardized favicon set (SVG + PNG fallbacks + apple-touch-icon)
  apple-touch-icon.png
/tech-worship-academy/         training site (static HTML)
  topics/                      one folder per lesson topic
  categories/                  topic category index pages
/ten-minutes-with-the-gospel/  daily reflection site (static HTML)
  2026/MM/DD/                  one folder per daily reflection (index.html, style.css, script.js, og-image.png)
  archive/                     month-by-month archive, reads from manifest.json
  manifest.json                single source of truth for every entry (title, date, citation, lede, liturgical day)
  assets/tokens.css            shared site chrome tokens (nav ribbon, footer) — NOT the per-day palette
/worship-chord-library/        song catalog — Node build pipeline
  songs/*.cho                  ChordPro source files (edit these)
  scripts/build.js             generates site/ from songs/ + data/
  scripts/templates.js         HTML templates (index page, song page, shared head/fonts)
  scripts/categorize.js        theme/category auto-detection + capo suggestion logic
  data/taxonomy.json           recognized themes, categories, and their keyword triggers
  site/                        BUILD OUTPUT — do not hand-edit, regenerated by npm run build
```

Every page across all three projects also carries a small "← Church Ministry" link (bottom-left, hidden when printing) back to this hub, and the same standardized favicon.

---

## Brand system

One shared visual identity across every project, defined in [`_shared/theme.css`](_shared/theme.css):

| Token | Hex | Use |
|---|---|---|
| Paper | `#FAF9F6` | background |
| Paper Raised | `#FFFFFF` | cards/surfaces |
| Ink | `#191B1F` | body text |
| Index Blue | `#2A4B8D` | primary accent |
| Stone | `#84806F` | secondary accent |

Fonts: **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (labels/mono).

Colors and fonts are baked directly into each page's own CSS (not all pages reference `_shared/theme.css` live), so they stay in sync with the values above — if the palette ever changes, each project's stylesheet needs updating to match.

---

## Editing guide

**Workflow rule:** every new piece of content added to this repo (a new Tech Worship Academy topic, a new daily Gospel reflection, or a new song in the Chord Library) is accompanied by drafted social media posts (Facebook, Instagram, X/Twitter) promoting it, generated at the same time as the content itself.

**Workflow rule:** every shareable page (topic pages, category pages, daily reflections, chord library songs) has its own unique `og:image`/`twitter:image` social preview card — never a generic image reused across multiple pages. Sharing the direct link to any page should show a preview specific to that page's content.

**Workflow rule:** every page's `<head>` — including hub/index pages (the root `index.html` and each sub-project's homepage), not just individual content pages — must have complete, valid Open Graph + Twitter meta tags (`og:type`, `og:url`, `og:title`, `og:description`, `og:image` + width/height/type, `twitter:card`, `twitter:image`), with zero broken or orphaned markup in `<head>`. Watch for a known leftover bug: an orphaned `<rect width=%22100%22...>` SVG fragment from an old favicon implementation, which can break crawler parsing and cause the wrong image (e.g. a video thumbnail) to show when a link is shared on social media.

**Note on the Worship Chord Library build:** its homepage's social preview tags are generated from `worship-chord-library/scripts/templates.js` (`indexPage()`) and `scripts/build.js`, not editable directly in `site/index.html`. Fix the template source, then re-run `npm run build`. Rebuilding regenerates every song page and wipes the separately-injected "← Church Ministry" back-link on each one — re-inject it after every rebuild.

### Add or edit a Tech Worship Academy topic
Copy an existing folder under `tech-worship-academy/topics/`, edit the content, and add a link to it from `tech-worship-academy/index.html` and the relevant category page.

### Add a daily Gospel reflection
1. Create `ten-minutes-with-the-gospel/YYYY/MM/DD/` with `index.html`, `style.css`, `script.js`, `og-image.png`.
2. Add an entry to `ten-minutes-with-the-gospel/manifest.json` (drives both the home page and the month archive).
3. Keep Scripture quotations to the public-domain Douay-Rheims translation; link out to USCCB.org for the official NABRE reading rather than reproducing a copyrighted translation.

### Add a song to the Chord Library
1. Add a `.cho` file to `worship-chord-library/songs/`, following [ChordPro syntax](https://www.chordpro.org/chordpro/chordpro-introduction/). Optional directives this site understands: `{category: Worship Song}` or `{category: Liturgical Songs}` (defaults to Worship Song), `{capo: N}` (overrides auto-suggestion), `{youtube: <url>}`.
2. Rebuild:
   ```
   cd worship-chord-library
   npm install
   npm run build
   ```
3. Commit both the `.cho` source and the regenerated `site/` output.

---

## Attribution & copyright notes

- Scripture on the Gospel reflection site uses the **Douay-Rheims (Challoner revision)**, which is in the public domain. Official Mass readings (NABRE translation) are linked to USCCB.org rather than reproduced.
- Embedded YouTube videos and songs are linked/embedded, never rehosted, and credited by artist/creator on each page.
- Catechism cross-references link to the Vatican's official text.
- This is an independent ministry project and is not an official publication of any diocese.

---

## License

All rights reserved. See [LICENSE](LICENSE) for details. Third-party content (embedded videos, songs, Catechism text) remains the property of its respective owners; public-domain Scripture (Douay-Rheims) is not subject to this license.

---

## Deployment

Served via **GitHub Pages** from the root of the `main` branch (Settings → Pages). A `.nojekyll` file at the repo root disables Jekyll processing — without it, GitHub Pages silently excludes any folder starting with an underscore (like `_shared/`), which would break every page's fonts, colors, and favicon.
