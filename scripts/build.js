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
const SITE_URL = 'https://allenvincentlucas.github.io/worship-chord-library';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// Open-chord keys most guitarists find easiest to play without a capo.
const FRIENDLY_MAJOR_ROOTS = ['C', 'D', 'E', 'G', 'A'];
const FRIENDLY_MINOR_ROOTS = ['A', 'D', 'E']; // Am, Dm, Em

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

// A key is "minor" for this purpose if its suffix starts with m but isn't
// "maj" (so "Bm" is minor, "Bmaj7" is major).
function isMinorSuffix(suffix) {
  return /^m(?!aj)/.test(suffix);
}

// If `key` isn't in the open-chord-friendly set, suggests the closest
// friendly key of the same major/minor quality and the capo fret needed
// to sound the original key while fingering that friendlier shape.
// Returns null if the key is already friendly or can't be parsed.
function suggestCapoForKey(key) {
  if (!key) return null;
  const parsed = parseKey(key);
  if (!parsed) return null;
  const minor = isMinorSuffix(parsed.suffix);
  const friendlyRoots = minor ? FRIENDLY_MINOR_ROOTS : FRIENDLY_MAJOR_ROOTS;
  const rootName = NOTES_SHARP[parsed.idx];
  if (friendlyRoots.includes(rootName)) return null; // already friendly

  let best = null;
  for (const fr of friendlyRoots) {
    const frIdx = NOTES_SHARP.indexOf(fr);
    const capoNeeded = ((parsed.idx - frIdx) % 12 + 12) % 12;
    if (capoNeeded === 0) continue;
    if (!best || capoNeeded < best.capo) {
      best = { capo: capoNeeded, shapeRoot: fr };
    }
  }
  if (!best) return null;
  const shapeKey = best.shapeRoot + (minor ? 'm' : '');
  return { capo: best.capo, shapeKey };
}

function callNumber(key, capo) {
  const k = key ? key.replace('#', 'S') : 'XX';
  return capo ? `${k}·CAPO${capo}` : k;
}

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

async function build() {
  fs.mkdirSync(path.join(SITE_DIR, 'songs'), { recursive: true });
  fs.mkdirSync(CARDS_DIR, { recursive: true });
  fs.mkdirSync(path.join(SITE_DIR, 'assets'), { recursive: true });

  // Copy shared assets into the site output
  fs.copyFileSync(path.join(ROOT, 'assets', 'style.css'), path.join(SITE_DIR, 'assets', 'style.css'));
  fs.copyFileSync(path.join(ROOT, 'assets', 'favicon.svg'), path.join(SITE_DIR, 'assets', 'favicon.svg'));

  const files = fs.readdirSync(SONGS_DIR).filter(f => /\.(cho|crd|pro|chopro)$/i.test(f));

  if (files.length === 0) {
    console.log(`No .cho files found in /songs. Paste a ChordPro file there and run again.`);
    return;
  }

  const songsByArtist = {};
  const songsByTheme = {};

  for (const file of files) {
    const raw = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
    const meta = extractDirectives(raw);

    const title = meta.title || meta.t || file.replace(/\.(cho|crd|pro|chopro)$/i, '');
    const artist = meta.artist || meta.subtitle || 'Unknown Artist';
    const key = meta.key || '';
    const capo = meta.capo || '';
    const tempo = meta.tempo || '';
    const time = meta.time || '';
    const youtube = meta.youtube || meta.video || '';
    const info = meta.info || meta.comment || '';
    const themes = detectThemes(raw, meta.theme);
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
    for (let i = 0; i < 12; i++) {
      const song = transposeSong(baseSong, i);
      const html = formatter.format(song);
      const frameKey = key ? transposeKeyName(key, i) : '';
      frames.push({ index: i, html, frameKey });
    }
    const chordSheetHtml = frames
      .map(f => `<div class="chord-sheet-frame" data-transpose="${f.index}" data-key="${f.frameKey}"${f.index === 0 ? '' : ' hidden'}>${f.html}</div>`)
      .join('\n');

    // Default capo the picker starts on: whatever the chart specified, or
    // no capo (0) if it didn't say.
    const initialCapo = capo && !isNaN(parseInt(capo, 10)) ? parseInt(capo, 10) : 0;

    // If the song's stated key isn't guitar-friendly, suggest an easier
    // shape key + capo fret that sounds identical to the original key.
    const capoSuggestion = suggestCapoForKey(key);

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
      title, artist, key, capo, tempo, time, callnum, themes, info, youtube,
      chordSheetHtml, initialCapo, capoSuggestion,
      cardImage: cardImageUrl, pageUrl, slug
    });
    fs.writeFileSync(path.join(SITE_DIR, 'songs', `${slug}.html`), html);

    // Index for the homepage
    const entry = { title, artist, callnum, slug, themes };
    (songsByArtist[artist] ||= []).push(entry);
    for (const t of themes) {
      (songsByTheme[t] ||= []).push(entry);
    }

    console.log(`Built: ${title} (${artist}) -> /songs/${slug}.html [${themes.join(', ')}]`);
  }

  // Sort each artist's songs alphabetically by title
  for (const artist of Object.keys(songsByArtist)) {
    songsByArtist[artist].sort((a, b) => a.title.localeCompare(b.title));
  }

  const html = indexPage({ songsByArtist, songsByTheme, totalCount: files.length });
  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), html);

  // Save taxonomy indexes for reference / future tooling
  fs.writeFileSync(path.join(ROOT, 'data', 'artists.json'), JSON.stringify(Object.keys(songsByArtist).sort(), null, 2));
  fs.writeFileSync(path.join(ROOT, 'data', 'themes-in-use.json'), JSON.stringify(Object.keys(songsByTheme).sort(), null, 2));

  console.log(`\nDone. ${files.length} song page(s) written to /site.`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
