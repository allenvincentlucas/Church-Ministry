const fs = require('fs');
const path = require('path');
const ChordSheetJS = require('chordsheetjs');
const { extractDirectives, detectThemes, slugify } = require('./categorize');
const { generateCard } = require('./social-card');
const { songPage, indexPage } = require('./templates');

const ROOT = path.join(__dirname, '..');
const SONGS_DIR = path.join(ROOT, 'songs');
const SITE_DIR = path.join(ROOT, 'site');
const CARDS_DIR = path.join(SITE_DIR, 'assets', 'cards');

// >>> Set this to your published GitHub Pages URL (no trailing slash) <<<
const SITE_URL = 'https://allenvincentlucas.github.io/Church-Ministry/worship-chord-library';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// Splits a key label like "B", "F#m", "Bb", "C#m7" into its root note and
// whatever suffix follows (m, 7, maj7, sus4, etc.), normalizing flats to
// the equivalent sharp so everything indexes into NOTES_SHARP consistently.
function parseKey(key) {
  const m = key.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!m) return null;
  const [, root, suffix] = m;
  const normalizedRoot = FLAT_TO_SHARP[root] || root;
  const idx = NOTES_SHARP.indexOf(normalizedRoot);
  if (idx === -1) return null;
  return { idx, suffix };
}

// Transposes a key label by `delta` semitones, preserving its suffix.
function transposeKeyName(key, delta) {
  const parsed = parseKey(key);
  if (!parsed) return key;
  const newIdx = ((parsed.idx + delta) % 12 + 12) % 12;
  return NOTES_SHARP[newIdx] + parsed.suffix;
}

// Keys an open-position guitarist can play without a capo. Anything else
// gets an automatic capo recommendation (see computeCapoSuggestion below).
const FRIENDLY_MAJOR = ['C', 'G', 'D', 'A', 'E'];
const FRIENDLY_MINOR = ['A', 'E', 'B', 'F#', 'D']; // Am, Em, Bm, F#m, Dm

function isGuitarFriendly(key) {
  const parsed = parseKey(key);
  if (!parsed) return false;
  const root = NOTES_SHARP[parsed.idx];
  const suffix = parsed.suffix.toLowerCase();
  const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
  return isMinor ? FRIENDLY_MINOR.includes(root) : FRIENDLY_MAJOR.includes(root);
}

// Works out what shape/key a guitarist should finger. A capo raises pitch,
// so the shape played is `capo` semitones BELOW the sounding key — e.g. key
// Bb with capo 1 means the guitarist fingers A shapes (Bb - 1 semitone = A)
// and the capo brings it back up to Bb.
//
// If the chart itself declares a {capo: ...}, that's the contributor's own
// call and is honored as-is. Otherwise, if the stated key isn't one of the
// guitar-friendly open-position keys, the smallest capo fret (1-11) that
// lands on a friendly shape is recommended automatically. Returns null when
// no capo is needed — no directive AND an already-friendly key.
function computeCapoSuggestion(key, capo) {
  if (!key) return null;

  const explicit = parseInt(capo, 10);
  if (!isNaN(explicit) && explicit > 0) {
    return { capo: explicit, shapeKey: transposeKeyName(key, -explicit), source: 'chart' };
  }

  if (isGuitarFriendly(key)) return null;

  for (let c = 1; c <= 11; c++) {
    const shapeKey = transposeKeyName(key, -c);
    if (isGuitarFriendly(shapeKey)) {
      return { capo: c, shapeKey, source: 'auto' };
    }
  }
  return null; // shouldn't happen — every key has a friendly shape within an octave
}

function callNumber(key, capo) {
  const k = key ? key.replace('#', 'S') : 'XX';
  return capo ? `${k}·CAPO${capo}` : k;
}

const { execSync } = require('child_process');

// Song only exposes transposeUp()/transposeDown() (1 semitone each), not a
// single transpose(delta) call, so chain them to reach the target delta.
function transposeSong(song, delta) {
  let result = song;
  if (delta > 0) {
    for (let i = 0; i < delta; i++) result = result.transposeUp();
  } else if (delta < 0) {
    for (let i = 0; i < -delta; i++) result = result.transposeDown();
  }
  return result;
}

// Looks up when a song file was last committed, for the homepage's
// "Recently added" section. Returns null (rather than throwing) if git
// isn't available or the repo history doesn't go back far enough to see
// it — a shallow CI checkout only sees the most recent commit, so this
// will only resolve for files touched in that commit unless the workflow
// checkout step uses `fetch-depth: 0`.
function getDateAdded(relativeFilePath) {
  try {
    const out = execSync(`git log -1 --format=%aI -- "${relativeFilePath}"`, {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim();
    return out || null;
  } catch (e) {
    return null;
  }
}

// Builds a Nashville Number System rendering of the chord chart: each
// chord symbol converted to its scale degree relative to `key`. Numbers
// don't change with transposition or capo choice, so this is rendered
// once, not once per frame like the letter-chord version.
function buildNashvilleHtml(baseSong, key, formatter) {
  if (!key) return '';
  try {
    const numericSong = baseSong.mapItems(item => {
      if (item instanceof ChordSheetJS.ChordLyricsPair && item.chords) {
        try {
          const parsedChord = ChordSheetJS.Chord.parse(item.chords);
          if (parsedChord) {
            const numeric = parsedChord.toNumeric(key);
            const clone = item.clone();
            clone.chords = numeric.toString();
            return clone;
          }
        } catch (e) {
          // Leave this individual chord as a letter chord if it can't be
          // converted (unusual notation, etc.) rather than failing the
          // whole chart.
        }
      }
      return item;
    });
    return formatter.format(numericSong).replace(/(<td class="chord)(">\(\d+x\)<\/td>)/gi, '$1 repeat-marker$2');
  } catch (e) {
    return '';
  }
}

// extractDirectives collects REPEATED directive keys (e.g. multiple
// {comment: ...} lines, as in a chart with "Post Chorus" / "Tag" / "Last
// Chorus" comments) into an array rather than a single string. `info` is
// rendered as plain text/HTML-escaped text downstream (songPage's
// info-blurb and og:description), which expects a string, not an array.
// Normalize here so any directive value — single or repeated — becomes a
// single display-ready string, regardless of how many times it appeared
// in the source chart.
function toDisplayString(value) {
  if (Array.isArray(value)) return value.join(' · ');
  return value || '';
}

async function build() {
  fs.mkdirSync(path.join(SITE_DIR, 'songs'), { recursive: true });
  fs.mkdirSync(CARDS_DIR, { recursive: true });
  fs.mkdirSync(path.join(SITE_DIR, 'assets'), { recursive: true });

  // Copy shared assets into the site output
  fs.copyFileSync(path.join(ROOT, 'assets', 'style.css'), path.join(SITE_DIR, 'assets', 'style.css'));

  const files = fs.readdirSync(SONGS_DIR).filter(f => /\.(cho|crd|pro|chopro)$/i.test(f));

  if (files.length === 0) {
    console.log(`No .cho files found in /songs. Paste a ChordPro file there and run again.`);
    return;
  }

  const songsByArtist = {};
  const songsByTheme = {};
  const songsByCategory = {};

  for (const file of files) {
    const raw = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
    const meta = extractDirectives(raw);

    const title = meta.title || meta.t || file.replace(/\.(cho|crd|pro|chopro)$/i, '');
    const artist = toDisplayString(meta.artist || meta.subtitle) || 'Unknown Artist';
    const key = toDisplayString(meta.key);
    const capo = toDisplayString(meta.capo);
    const tempo = toDisplayString(meta.tempo);
    const time = toDisplayString(meta.time);
    const youtube = toDisplayString(meta.youtube || meta.video);
    const info = toDisplayString(meta.info || meta.comment);
    const themes = detectThemes(raw, meta.theme);
    const category = toDisplayString(meta.category) || 'Worship Song';
    const slug = slugify(title);
    const callnum = callNumber(key, capo);

    // Render the chord chart body at all 12 chromatic rotations (0-11
    // semitones up from however it was written). Any transpose+capo
    // combination the client asks for reduces to one of these 12 frames,
    // since shifting by a then b is the same as shifting once by a+b.
    const parser = new ChordSheetJS.ChordProParser();
    const baseSong = parser.parse(raw);
    const formatter = new ChordSheetJS.HtmlTableFormatter();

    const frames = [];
    // ChordSheetJS renders any bracketed token as a `.chord` cell, including
    // repeat-count markers like [(2x)] used to keep them on the same visual
    // line as the chords they follow. Tag those specifically so they can be
    // styled as plain annotations instead of colored/bolded like real chords.
    const REPEAT_MARKER_RE = /(<td class="chord)(">\(\d+x\)<\/td>)/gi;
    for (let i = 0; i < 12; i++) {
      const song = transposeSong(baseSong, i);
      let html = formatter.format(song);
      html = html.replace(REPEAT_MARKER_RE, '$1 repeat-marker$2');
      const frameKey = key ? transposeKeyName(key, i) : '';
      frames.push({ index: i, html, frameKey });
    }
    const chordSheetHtml = frames
      .map(f => `<div class="chord-sheet-frame" data-transpose="${f.index}" data-key="${f.frameKey}"${f.index === 0 ? '' : ' hidden'}>${f.html}</div>`)
      .join('\n');

    // Nashville Number System rendering (letters vs numbers is a page
    // toggle, not tied to the transpose/capo frames above).
    const nashvilleHtml = buildNashvilleHtml(baseSong, key, formatter);

    // If the song's stated key isn't guitar-friendly, suggest an easier
    // shape key + capo fret that sounds identical to the original key
    // (auto-computed unless the chart already declares its own {capo: ...}).
    const capoSuggestion = computeCapoSuggestion(key, capo);

    // Default capo the picker starts on: the suggestion (auto or
    // chart-declared), or no capo (0) if the key is already guitar-friendly.
    const initialCapo = capoSuggestion ? capoSuggestion.capo : 0;

    // When was this chart added? Used for the homepage's recently-added
    // list. See getDateAdded's caveat about shallow CI checkouts.
    const dateAdded = getDateAdded(path.join('songs', file));

    // Generate the social card
    const cardFilename = `${slug}.png`;
    await generateCard({
      title,
      artist,
      callnum,
      theme: themes[0] === 'Uncategorized' ? '' : themes[0],
      outPath: path.join(CARDS_DIR, cardFilename)
    });

    // Write the individual song page
    const pageUrl = `${SITE_URL}/songs/${slug}.html`;
    const cardImageUrl = `${SITE_URL}/assets/cards/${cardFilename}`;
    const html = songPage({
      title, artist, key, capo, tempo, time, callnum, themes, category, info, youtube,
      chordSheetHtml, nashvilleHtml, initialCapo, capoSuggestion,
      cardImage: cardImageUrl, pageUrl, slug
    });
    fs.writeFileSync(path.join(SITE_DIR, 'songs', `${slug}.html`), html);

    // Index for the homepage
    const entry = {
      title, artist, callnum, slug, themes, category, dateAdded,
      friendly: key ? !capoSuggestion : null,
      capoHint: capoSuggestion ? capoSuggestion.capo : null
    };
    (songsByArtist[artist] ||= []).push(entry);
    for (const t of themes) {
      (songsByTheme[t] ||= []).push(entry);
    }
    (songsByCategory[category] ||= []).push(entry);

    console.log(`Built: ${title} (${artist}) -> /songs/${slug}.html [${category}] [${themes.join(', ')}]`);
  }

  // Sort each artist's songs alphabetically by title
  for (const artist of Object.keys(songsByArtist)) {
    songsByArtist[artist].sort((a, b) => a.title.localeCompare(b.title));
  }

  // Recently added: only meaningful if at least one file resolved a real
  // git date (see getDateAdded's shallow-checkout caveat).
  const allEntries = Object.values(songsByArtist).flat();
  const recentSongs = allEntries
    .filter(e => e.dateAdded)
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 5);

  // Generate the homepage's own social card (distinct from any song card)
  await generateCard({
    title: 'Chord Library',
    artist: 'Worship chord charts, ready to play from',
    callnum: `${files.length} SONGS`,
    theme: '',
    outPath: path.join(CARDS_DIR, 'home.png')
  });
  const homeCardUrl = `${SITE_URL}/assets/cards/home.png`;

  const html = indexPage({ songsByArtist, songsByTheme, songsByCategory, totalCount: files.length, recentSongs, cardImage: homeCardUrl, pageUrl: `${SITE_URL}/index.html` });
  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html);

  // Save taxonomy indexes for reference / future tooling
  fs.writeFileSync(path.join(ROOT, 'data', 'artists.json'), JSON.stringify(Object.keys(songsByArtist).sort(), null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'themes-in-use.json'), JSON.stringify(Object.keys(songsByTheme).sort(), null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'categories-in-use.json'), JSON.stringify(Object.keys(songsByCategory).sort(), null, 2));

  console.log(`\nDone. ${files.length} song page(s) written to /site.`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
