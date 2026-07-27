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

// Precomputed transpose range: -6..+5 semitones covers all 12 possible keys
// relative to whatever key the chart was originally written in.
const TRANSPOSE_MIN = -6;
const TRANSPOSE_MAX = 5;

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// Transposes a key label like "B", "F#m", "Bb" by `delta` semitones,
// preserving any suffix (m, 7, maj7, sus4, etc.) after the root note.
function transposeKeyName(key, delta) {
  const m = key.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!m) return key;
  const [, root, suffix] = m;
  const normalizedRoot = FLAT_TO_SHARP[root] || root;
  const idx = NOTES_SHARP.indexOf(normalizedRoot);
  if (idx === -1) return key;
  const newIdx = ((idx + delta) % 12 + 12) % 12;
  return NOTES_SHARP[newIdx] + suffix;
}

function callNumber(key, capo) {
  const k = key ? key.replace('#', 'S') : 'XX';
  return capo ? `${k}·CAPO${capo}` : k;
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

    // Render the chord chart body, precomputed at every transposition from
    // TRANSPOSE_MIN to TRANSPOSE_MAX semitones, so the page can offer a
    // transpose control without needing any chord-parsing logic client-side.
    const parser = new ChordSheetJS.ChordProParser();
    const baseSong = parser.parse(raw);
    const formatter = new ChordSheetJS.HtmlTableFormatter();

    // If a capo is specified, moving the capo by the same number of frets
    // as the transpose delta keeps the same finger shapes usable at the
    // new key. baseCapoNum is null when no capo directive is present.
    const baseCapoNum = capo && !isNaN(parseInt(capo, 10)) ? parseInt(capo, 10) : null;

    // Song only exposes transposeUp()/transposeDown() (1 semitone each),
    // not a single transpose(delta) call, so chain them to reach delta.
    function transposeSong(song, delta) {
      let result = song;
      if (delta > 0) {
        for (let i = 0; i < delta; i++) result = result.transposeUp();
      } else if (delta < 0) {
        for (let i = 0; i < -delta; i++) result = result.transposeDown();
      }
      return result;
    }

    const transposedFrames = [];
    for (let delta = TRANSPOSE_MIN; delta <= TRANSPOSE_MAX; delta++) {
      const song = transposeSong(baseSong, delta);
      const html = formatter.format(song);
      const transposedKey = key ? transposeKeyName(key, delta) : '';
      const transposedCapo = baseCapoNum !== null ? baseCapoNum + delta : null;
      transposedFrames.push({ delta, html, transposedKey, transposedCapo });
    }
    const chordSheetHtml = transposedFrames
      .map(f => `<div class="chord-sheet-frame" data-transpose="${f.delta}" data-key="${f.transposedKey}" data-capo="${f.transposedCapo !== null ? f.transposedCapo : ''}"${f.delta === 0 ? '' : ' hidden'}>${f.html}</div>`)
      .join('\n');

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
      chordSheetHtml, cardImage: cardImageUrl, pageUrl, slug
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
