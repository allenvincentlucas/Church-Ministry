# AGENTS.md — Paste-to-Publish Workflow

This file documents exactly what happens, step by step, from the moment a
ChordPro chart is pasted to the moment it's a live, formatted page on the
site. It's written so either a human contributor or an AI assistant helping
in this repo can follow it without guessing.

It assumes the repo already has the structure and scripts described in
`PROJECT_INSTRUCTIONS.md`. This file is the procedural companion to that one:
`PROJECT_INSTRUCTIONS.md` explains *what things are*, this file explains
*what to do, in order*.

---

## Trigger

Any time a person pastes ChordPro-formatted text (raw `.cho`/`.crd`/`.pro`
content — chord brackets like `[G]`, directive lines like `{title: ...}`) and
asks for it to be added to the site, run this workflow.

---

## Step 1 — Validate the pasted chart

Before creating anything, check the pasted text for:

1. **A `{title: ...}` directive exists.** This is the only required field.
   If missing, ask for a title before proceeding — don't invent one.
2. **Chord brackets are balanced.** Every `[` has a matching `]`. If not,
   flag the specific line back to the person rather than silently guessing
   at the intended chord.
3. **Directive lines are well-formed.** Each metadata line should match
   `{keyword: value}`. Malformed lines (e.g. missing colon, unclosed brace)
   should be pointed out, not dropped silently.
4. **No duplicate title.** Check `songs/*.cho` for an existing file whose
   `{title: ...}` matches. If one exists, this is an **update**, not a new
   song — see Step 5.

If the pasted text is missing optional metadata (`artist`, `key`, `youtube`,
`info`, `theme`, etc.), don't block on it — those fields simply won't render
on the page. Mention what's missing so the person can add it if they want to,
but proceed either way.

---

## Step 2 — Derive the filename

1. Take the `{title: ...}` value.
2. Slugify it the same way `scripts/categorize.js` does: lowercase, replace
   any run of non-alphanumeric characters with a single hyphen, trim leading/
   trailing hyphens.
   - `"Goodness of God"` → `goodness-of-god`
   - `"O Come, O Come Emmanuel"` → `o-come-o-come-emmanuel`
3. The file goes at `songs/{slug}.cho`. Nowhere else.

---

## Step 3 — Write the file

1. Create `songs/{slug}.cho` with the pasted content, verbatim, except:
   - Normalize line endings to `\n`.
   - Trim trailing whitespace per line.
   - Do **not** reformat, reorder, or "clean up" the chart body — the whole
     point is that what's pasted is what renders.
2. If the person didn't include a `{theme: ...}` directive, leave it out
   entirely — don't guess one and hardcode it into the file. Auto-detection
   at build time (via `data/taxonomy.json`) handles that dynamically, and
   hardcoding a guess into the source file would make it stale if the
   taxonomy improves later.

---

## Step 4 — Commit

1. Stage only the new/changed file: `songs/{slug}.cho`.
2. Commit message convention:
   - New song: `Add song: {Title}`
   - Update: `Update song: {Title}`
3. Push to `main`.

Do not manually touch anything under `/site` — that directory is entirely
generated output and gets overwritten on every build. Committing hand-edits
there will be silently clobbered on the next push.

---

## Step 5 — Updating an existing song

If Step 1 found a duplicate title:

1. Confirm with the person that this is meant to replace the existing chart
   (not a duplicate/typo).
2. Overwrite `songs/{slug}.cho` in place — same filename, so the page URL
   and social card filename stay stable (important: anything already shared
   on social media keeps working).
3. Commit message: `Update song: {Title}`.

---

## Step 6 — What happens automatically (GitHub Action)

Once pushed, `.github/workflows/build.yml` triggers on any change under
`songs/**` (also `scripts/**`, `assets/**`, or `data/taxonomy.json`):

1. **Checkout** the repo.
2. **Install** dependencies (`npm install`).
3. **Build** (`npm run build`), which runs `scripts/build.js` and:
   - Reads every `.cho` file in `/songs`
   - Extracts metadata directives per file
   - Auto-detects theme(s) for any file without an explicit `{theme: ...}`
   - Renders the chord chart body via ChordSheetJS
   - Writes `site/songs/{slug}.html` from the shared template (same theme,
     favicon, and CSS as every other page)
   - Generates `site/assets/cards/{slug}.png`, the minimalist social card
   - Regenerates `site/index.html` with the full, re-grouped catalog
   - Regenerates `data/artists.json` and `data/themes-in-use.json`
4. **Deploy** the contents of `/site` to GitHub Pages.

No manual build step is needed if the Action is enabled — pushing the `.cho`
file is the entire publish action.

---

## Step 7 — Confirm back to the person

Once the Action completes (or once a manual `npm run build` finishes, if not
using the Action), report back:

- The live song page URL: `{SITE_URL}/songs/{slug}.html`
- Which theme(s) it was categorized under (explicit or auto-detected)
- Which artist section it landed in
- Whether a YouTube embed and info blurb are present (i.e. whether those
  optional fields were filled in)

This confirmation is also the natural point to ask whether they want the
promo step (IG carousel + social post) — but only offer that, never start it
without an explicit request, per `PROJECT_INSTRUCTIONS.md`.

---

## Error cases and how to handle them

| Situation | What to do |
|---|---|
| No `{title: ...}` in pasted text | Ask for a title. Don't proceed. |
| Unbalanced `[` `]` brackets | Point out the exact line. Don't silently fix. |
| Duplicate title, person didn't mention it's an update | Ask for confirmation before overwriting. |
| `{youtube: ...}` isn't a valid YouTube URL | Still write the file, but note the video won't embed — the template only embeds recognized YouTube ID patterns. |
| Pasted text includes multiple songs in one block | Split into separate `.cho` files, one per song, each following Steps 1–4 independently. |
| `{theme: ...}` given but not in `data/taxonomy.json` | Fine — explicit themes bypass the taxonomy entirely. It'll simply show as a new tag. |

---

## Non-goals

This workflow does **not**:
- Modify `scripts/`, `assets/`, or `data/taxonomy.json` as a side effect of
  publishing a song. Those only change when someone deliberately updates the
  system itself.
- Touch `/site` directly. It's build output, not source.
- Generate the IG carousel or social post automatically. That's a separate,
  request-only step.
