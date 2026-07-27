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

// Uses whatever capo the chart itself specifies (its {capo: ...}
// directive) to work out what shape/key the guitarist is actually
// fingering. A capo raises pitch, so the shape played is `capo` semitones
// BELOW the sounding key — e.g. key Bb with {capo: 3} means the guitarist
// fingers G shapes (Bb - 3 semitones = G) and the capo brings it up to Bb.
// Returns null whenever the chart doesn't specify a capo (no directive,
// blank, "0", or unparseable) — no suggestion is shown in that case.
function suggestCapoFromChart(key, capo) {
  if (!key || !capo) return null;
  const capoNum = parseInt(capo, 10);
  if (isNaN(capoNum) || capoNum <= 0) return null;
  const shapeKey = transposeKeyName(key, -capoNum);
  return { capo: capoNum, shapeKey };
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
    return formatter.format(numericSong);
  } catch (e) {
    return '';
  }
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

    // Nashville Number System rendering (letters vs numbers is a page
    // toggle, not tied to the transpose/capo frames above).
    const nashvilleHtml = buildNashvilleHtml(baseSong, key, formatter);

    // Default capo the picker starts on: whatever the chart specified, or
    // no capo (0) if it didn't say.
    const initialCapo = capo && !isNaN(parseInt(capo, 10)) ? parseInt(capo, 10) : 0;

    // If the song's stated key isn't guitar-friendly, suggest an easier
    // shape key + capo fret that sounds identical to the original key.
    const capoSuggestion = suggestCapoFromChart(key, capo);

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
      title, artist, key, capo, tempo, time, callnum, themes, info, youtube,
      chordSheetHtml, nashvilleHtml, initialCapo, capoSuggestion,
      cardImage: cardImageUrl, pageUrl, slug
    });
    fs.writeFileSync(path.join(SITE_DIR, 'songs', `${slug}.html`), html);

    // Index for the homepage
    const entry = {
      title, artist, callnum, slug, themes, dateAdded,
      friendly: key ? !capoSuggestion : null,
      capoHint: capoSuggestion ? capoSuggestion.capo : null
    };
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

  // Recently added: only meaningful if at least one file resolved a real
  // git date (see getDateAdded's shallow-checkout caveat).
  const allEntries = Object.values(songsByArtist).flat();
  const recentSongs = allEntries
    .filter(e => e.dateAdded)
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 5);

  const html = indexPage({ songsByArtist, songsByTheme, totalCount: files.length, recentSongs });
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
