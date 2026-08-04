# WORKFLOW.md — Build Standards for Church-Ministry

This document exists so that any build session — whether it's a continuation
of an earlier conversation or a brand new one — produces output that's
indistinguishable in quality and structure from everything that came before
it. Read this before creating or editing content in this repo.

---

## 0. Session workflow (every session, every push)

1. **Sync first.** Always `git pull origin main --ff-only` before making any
   edits. This repo has had multiple sessions push directly to `main`
   concurrently — pulling first is not optional.
2. **Check for numbering collisions before claiming a number.** Topic codes
   (`MU.0X`, etc.) get reserved by whoever pushes first. If your planned
   number was taken while you worked, defer to what's already live and take
   the next open number — check the README tracker (§6) for the current
   state before assuming a number is free.
3. **Review before pushing new content.** For any new topic page, reflection,
   or song, build it, copy it to `/mnt/user-data/outputs/` and show it to the
   person before pushing — unless they've already said "push it" for this
   specific piece of work.
4. **Confirm the build actually deployed.** After every push, poll
   `GET /repos/allenvincentlucas/Church-Ministry/pages/builds/latest` until
   `status` is `built` and the `commit` matches what you just pushed. GitHub's
   Pages build webhook does not always fire reliably — if it's stuck on an
   old commit after ~2 minutes of polling, tell the person to toggle the
   Pages source branch off and back on in Settings → Pages, then re-check.
5. **Draft the social posts automatically.** Every new piece of content
   (Tech Worship Academy topic, Gospel reflection, Chord Library song) gets
   Facebook, Instagram, and X/Twitter posts drafted in the same turn it's
   built, without being asked separately.
6. **Never leave broken markup in `<head>`.** Before considering any page
   done, grep it for `^<rect width=%22100%22` — a leftover orphaned SVG
   favicon fragment that has appeared in multiple templates. It breaks
   crawler parsing and causes the wrong social-preview image to show. Remove
   it if found.
7. **Every page needs its own unique social preview card.** Never let a page
   inherit a generic or another page's `og:image`. This applies to hub/index
   pages too, not just content pages — the root `index.html` and each
   sub-project's homepage need real `og:image`/`og:url`/`twitter:image` tags,
   not just a `<meta name="description">`.

---

## 1. Tech Worship Academy topic pages

**Location:** `tech-worship-academy/topics/<slug>/index.html` +
`og-image.png` in the same folder.

**Build by copying the most recently built topic page as a template**, then
adapt. Do not build from scratch — the inline `<style>` block, rail-nav
progress-tracking script, and lesson-section markup must stay byte-identical
across topics.

**Required structure per topic:**
- 5–6 lesson `<section>` blocks, each with:
  - `<div class="lesson-head-top">` with a time estimate and a "Mark this
    lesson complete" button
  - An `<h2>` and 1–2 paragraphs of real, specific instructional content —
    never a stub or placeholder
  - At least one of: a `.checklist` (checkbox list), a `.callout`, a
    `<table>` comparison, or a real embedded YouTube video (`.video-card`)
- Hero section: `Cue N · MU.0X` eyebrow, `<h1>`, and a lede paragraph ending
  in "Work through these in order."
- Rail nav (`<a class="rail-link">`) with one entry per lesson, matching
  lesson order exactly, plus a `rail-progress-label` showing "0 of N lessons
  complete" (N must match the actual lesson count — the page's own script
  computes progress dynamically via `document.querySelectorAll`, so this
  only needs to be right on page load).
- Breadcrumb: `Home / Music Ministry (or relevant category) / <Topic Name>`.
- Footer link back to the category page.

**Videos:** always search for and confirm a real, existing YouTube video ID
before embedding — never invent one. Prefer reputable, on-topic sources
(Bishop Barron / Word on Fire for Catholic teaching content; well-known
worship artists for music).

**og-image.png:** 1200×630, dark ink background (`#191B1F`), brand mark
("TWA" in a rounded square), `CUE N · MU.0X` eyebrow in Index Blue
(`#2A4B8D`/lightened `#7A9BE0`-ish for dark bg), title in Space Grotesk,
subtitle in Inter, a small custom icon on the right relevant to the topic
(mic, keyboard, guitar, etc.), footer text with the site URL. Generate with
the PIL script pattern established in this project (fonts pulled from
`raw.githubusercontent.com/google/fonts` since Google Fonts' own domain
isn't in the network allowlist).

**After building, always update:**
- The category page (`tech-worship-academy/categories/<category>/index.html`)
  — add the topic to its live list/week grouping.
- `tech-worship-academy/index.html` — bump the category's topic count.
- Root `README.md` roadmap tracker (§6).

---

## 2. Ten Minutes with the Gospel (daily reflections)

**Location:** `ten-minutes-with-the-gospel/YYYY/MM/DD/index.html` +
`og-image.png`, `style.css`, `script.js` (copy `style.css`/`script.js`
verbatim from the most recent day — they're identical boilerplate, not
themed per-day).

**Before building, confirm the day:** fetch the USCCB reading link
(`bible.usccb.org/bible/readings/MMDDYY.cfm` or the named memorial URL) to
get the correct citation and liturgical day title. Don't assume — verify.

**Required structure:**
- Douay-Rheims (Challoner) Scripture text, quoted accurately and in full for
  the passage — this translation is public domain and is the only one
  reproduced on the page. Note in the `.translation-note` that the official
  NABRE reading is linked out to USCCB, and that other translations are
  copyrighted and not reproduced.
- Original reflection: 2 paragraphs building toward one specific, ownable
  thesis (not a generic summary of the passage) — pick a real interpretive
  angle and commit to it in both the `<h1>` and the reflection body.
- One `.scenario-box` connecting the passage to an ordinary modern situation.
- One `.question-callout` — a single, specific, personally-directed question.
- Two embedded videos: one homily/teaching video (search for real, on-topic,
  reputable Catholic content — Bishop Barron is the house default), one
  worship song thematically matched to the passage (avoid repeating a song
  used in a recent nearby entry).
- Three Catechism cross-references, each with a real, defensible CCC
  paragraph number and a plain-language explanation of the connection — link
  each one to the `catholiccrossreference.online` search URL for that
  passage. If the person didn't supply a Catechism link for a given day,
  select the paragraphs yourself using the same standard of confidence and
  say so when presenting the work.
- Closing prayer: 2–3 sentences, directly tied to the day's thesis.
- Footer crediting Scripture translation, video, and music sources.

**og-image.png:** 1200×630, light cream background (`#FAF9F6`), ink text
(`#191B1F`), Index Blue ribbon brand mark top-left, `AUGUST N, 2026 · <day
name>` eyebrow, title in Space Grotesk (wrap to 2 lines), citation pull in
mono, 2-line lede in Inter, footer with the site URL.

**Hero SVG illustration:** a custom abstract landscape scene re-derived for
each day's specific imagery — never reuse a previous day's palette or
composition. Match the palette to the passage's setting/mood (e.g. warm
terracotta for a coastal Mediterranean scene, gold/light for the
Transfiguration, muted purple-grey for the cross).

**After building, always add an entry to** `ten-minutes-with-the-gospel/manifest.json`
(date, slug, title, lede, citation, liturgicalDay) — the homepage and month
archive page both pull dynamically from this file, so no other page needs
manual edits.

---

## 3. Worship Chord Library (songs)

**Location:** `.cho` source in `worship-chord-library/songs/`; everything
under `worship-chord-library/site/` is generated — never hand-edit it.

**`.cho` file requirements:**
- `{title}`, `{artist}`, `{category}` (`Worship Song` or `Liturgical Songs`),
  `{key}`, `{tempo}`, `{time}`, `{youtube}` (a real, confirmed video URL) —
  all required at the top of the file.
- Themes are auto-detected by the build script from lyric content — do not
  hand-tag themes unless overriding is genuinely necessary.
- **Repeat-marker notation:** wrap standalone repeat counts in their own
  bracket token — `[(2x)]`, `[(3x)]` — so they render as their own cell in
  the chord row instead of trailing the lyric text. This is the default for
  markers that follow a bare chord line (e.g. an intro/interlude/instrumental
  bar). A marker that follows sung lyrics on the same line (e.g. "...you'll
  see (2x)") stays as plain trailing text, unbracketed — that's an
  established, deliberate exception, not an inconsistency to "fix."

**Build process (always in this order):**
1. `cd worship-chord-library && npm run build` (installs deps first if
   `node_modules` is missing).
2. **Re-inject the hub back-link into every song page** — the build wipes it
   on every run, on every song, not just the new one. Use the standard
   snippet (a `position:fixed` bottom-left link styled with the brand
   tokens) inserted right after `<body>`, and check with
   `grep -L "hub-back-link" site/songs/*.html` that none were missed.
3. Verify `git status --short` only shows the expected files changed — the
   new song's `.cho`/`.html`/card PNG, plus `data/artists.json`,
   `site/index.html`, and `site/assets/cards/home.png` (all three regenerate
   on every build because they reflect the full catalog).

**Homepage/hub-level social cards:** if ever adding a new hub page to this
sub-project, its `og:image` must be generated via `generateCard()` in
`scripts/social-card.js` and wired through `scripts/build.js` +
`scripts/templates.js` — never hardcoded directly into generated HTML, since
that gets overwritten on the next build.

---

## 4. Site-wide meta/SEO checklist (every page, every sub-project)

Every page that could be shared as a direct link needs, at minimum:
```
<meta property="og:type" content="website"> (or "article" for reflections)
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...its own unique image...">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:url" content="...">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
```
No exceptions for hub/index pages — they're shared just as often as content
pages and have been caught missing this entirely before.

---

## 5. Social share bar (every page, every sub-project)

Every content page — topic pages, Gospel reflections, chord library songs —
gets a share bar near the bottom, just before `</footer>`: Facebook, X, and
Instagram icon buttons, plus a small "Share this" label.

**Use this exact snippet** (paste as-is; it reads `window.location.href` and
`document.title` at click time, so it needs no per-page editing):

```html
<div class="share-bar" aria-label="Share this page" style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;margin:1.5rem 0;padding-top:1.25rem;border-top:1px solid var(--brand-paper-line,var(--stone,#E3E0D8));">
  <span style="font-family:var(--brand-font-mono,var(--font-mono,'JetBrains Mono',monospace));font-size:0.72rem;letter-spacing:0.04em;text-transform:uppercase;color:var(--brand-ink-soft,var(--accent,#84806F));">Share this</span>

  <button class="share-btn" data-share="facebook" aria-label="Share on Facebook" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid var(--brand-paper-line,var(--stone,#E3E0D8));background:var(--brand-paper-raised,#FFFFFF);cursor:pointer;color:var(--brand-ink,var(--ink,#191B1F));">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>
  </button>

  <button class="share-btn" data-share="x" aria-label="Share on X" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid var(--brand-paper-line,var(--stone,#E3E0D8));background:var(--brand-paper-raised,#FFFFFF);cursor:pointer;color:var(--brand-ink,var(--ink,#191B1F));">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.6 8.7L23.3 22H16.7l-5.2-6.8L5.5 22H2.3l8.1-9.3L1.4 2h6.8l4.7 6.2Zm-1.2 18h1.7L7.4 3.9H5.6Z"/></svg>
  </button>

  <button class="share-btn" data-share="instagram" aria-label="Copy link for Instagram" style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid var(--brand-paper-line,var(--stone,#E3E0D8));background:var(--brand-paper-raised,#FFFFFF);cursor:pointer;color:var(--brand-ink,var(--ink,#191B1F));">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c2.7 0 3.1 0 4.1.06 1.1.05 1.8.22 2.5.47a5 5 0 0 1 1.8 1.17 5 5 0 0 1 1.17 1.8c.25.7.42 1.4.47 2.5.05 1 .06 1.4.06 4.1s0 3.1-.06 4.1c-.05 1.1-.22 1.8-.47 2.5a5 5 0 0 1-1.17 1.8 5 5 0 0 1-1.8 1.17c-.7.25-1.4.42-2.5.47-1 .05-1.4.06-4.1.06s-3.1 0-4.1-.06c-1.1-.05-1.8-.22-2.5-.47a5 5 0 0 1-1.8-1.17 5 5 0 0 1-1.17-1.8c-.25-.7-.42-1.4-.47-2.5C2 15.1 2 14.7 2 12s0-3.1.06-4.1c.05-1.1.22-1.8.47-2.5A5 5 0 0 1 3.7 3.6a5 5 0 0 1 1.8-1.17c.7-.25 1.4-.42 2.5-.47C8.9 2 9.3 2 12 2Zm0 1.8c-2.65 0-2.97 0-4 .06-.9.04-1.4.19-1.7.32a3.2 3.2 0 0 0-1.2.76 3.2 3.2 0 0 0-.76 1.2c-.13.4-.28.9-.32 1.8-.06 1-.06 1.35-.06 4s0 2.97.06 4c.04.9.19 1.4.32 1.7.15.4.35.8.76 1.2.4.4.8.6 1.2.76.3.13.8.28 1.7.32 1 .06 1.35.06 4 .06s2.97 0 4-.06c.9-.04 1.4-.19 1.7-.32.4-.15.8-.35 1.2-.76.4-.4.6-.8.76-1.2.13-.3.28-.8.32-1.7.06-1 .06-1.35.06-4s0-2.97-.06-4c-.04-.9-.19-1.4-.32-1.7a3.2 3.2 0 0 0-.76-1.2 3.2 3.2 0 0 0-1.2-.76c-.3-.13-.8-.28-1.7-.32-1-.06-1.35-.06-4-.06Zm0 3.5a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm4.9-2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/></svg>
  </button>

  <span class="share-bar__toast" hidden style="font-size:0.8rem;color:var(--brand-ink-soft,var(--accent,#84806F));">Link copied — paste it in your Instagram bio, story, or DM.</span>
</div>

<script>
(function(){
  var bar = document.querySelector('.share-bar');
  if (!bar) return;
  var pageUrl = window.location.href;
  var pageTitle = document.title;
  bar.querySelectorAll('[data-share]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var type = btn.getAttribute('data-share');
      if (type === 'facebook') {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl), '_blank', 'noopener,width=600,height=500');
      } else if (type === 'x') {
        window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(pageTitle), '_blank', 'noopener,width=600,height=500');
      } else if (type === 'instagram') {
        navigator.clipboard.writeText(pageUrl).then(function(){
          var toast = bar.querySelector('.share-bar__toast');
          if (toast) {
            toast.hidden = false;
            setTimeout(function(){ toast.hidden = true; }, 4000);
          }
        });
      }
    });
  });
})();
</script>
```

**Why Instagram works differently:** Facebook and X both have an official
web "share intent" URL that opens pre-filled with a given link — Instagram
does not. There is no supported way to open Instagram with a link
pre-attached from a website; Instagram sharing only happens from inside
their app, manually. The Instagram button here copies the page link to the
clipboard and tells the person where to paste it (bio, story, DM) — that's
the honest, working equivalent, not a broken imitation of the FB/X buttons.

**The preview card is already handled — nothing extra to build here.** Since
every page already carries its own unique `og:image`/`twitter:image` (§4),
Facebook's and X's share dialogs will automatically pull the correct card
for whatever page the button was clicked on. Instagram doesn't parse link
previews at all (it's not a link-sharing platform the way FB/X are), so
there's no card to attach there regardless — the copied link is the most
useful thing that platform can receive.

**Style variables used** (`--brand-paper-line`, `--brand-ink-soft`, etc.)
already exist site-wide with sensible fallbacks baked into the snippet
(`var(--stone,#E3E0D8)` etc.), so this drops into any of the three
sub-projects — Tech Worship Academy, Gospel reflections, Chord Library —
without needing per-theme edits.

**This applies to future builds going forward.** Pages already live before
this rule was written don't have it yet; treat backfilling them as a
separate, explicitly-requested task rather than assuming it's included in
an unrelated edit to an old page.

---

## 6. Keeping the README tracker accurate

The root `README.md`'s content roadmap is a build tracker, not just a list —
keep it literally accurate after every push:
- Check off the box and add `*(live)*` the moment a topic/entry goes live.
- Keep the lesson-by-lesson outline for planned-but-unbuilt topics so the
  next session (or the next person) knows exactly what to build without
  re-deriving it.
- Update the total topic-page count in the repo description line.
- Update the relevant category's topic count on its parent hub page
  (e.g. `tech-worship-academy/index.html`'s `category-count` spans).

---

## 7. Known bugs to check for on every page you touch

- **Orphaned SVG favicon fragment** (§0.6) — grep for
  `^<rect width=%22100%22` before calling any page done.
- **Missing back-link after a Chord Library rebuild** (§3, step 2).
- **Stale topic/category counts** on hub pages after adding new content —
  these are easy to forget and have shipped wrong at least twice.
- **GitHub Pages build lag** — always confirm via the API, don't assume a
  push means the live site updated.
