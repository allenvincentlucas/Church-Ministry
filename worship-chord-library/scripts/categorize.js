const fs = require('fs');
const path = require('path');

const taxonomy = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'taxonomy.json'), 'utf8')
);

// Pulls every {directive: value} line out of a raw ChordPro file.
// Repeated directives (e.g. multiple {theme: ...} lines) collect into an array.
function extractDirectives(raw) {
  const meta = {};
  const lines = raw.split('\n');
  for (const line of lines) {
    const m = line.match(/^\{(\w+)\s*:\s*(.+?)\}\s*$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (meta[key] === undefined) {
      meta[key] = val;
    } else if (Array.isArray(meta[key])) {
      meta[key].push(val);
    } else {
      meta[key] = [meta[key], val];
    }
  }
  return meta;
}

// Strips chord brackets [G] and directive lines {title: ...} to leave plain lyric text.
function stripToLyrics(raw) {
  return raw
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\[[^\]]*\]/g, '')
    .toLowerCase();
}

// If the file explicitly declares {theme: ...}, use that (comma-separated allowed).
// Otherwise, score the lyric text against the taxonomy keyword lists and pick the
// best match(es). Falls back to "Uncategorized" if nothing scores.
function detectThemes(raw, explicitThemeField) {
  if (explicitThemeField) {
    return explicitThemeField.split(',').map(t => t.trim()).filter(Boolean);
  }

  const text = stripToLyrics(raw);
  const scores = {};

  for (const [theme, keywords] of Object.entries(taxonomy.themes)) {
    let score = 0;
    for (const kw of keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      const matches = text.match(re);
      if (matches) score += matches.length;
    }
    if (score > 0) scores[theme] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return ['Uncategorized'];

  const topScore = ranked[0][1];
  // Keep any theme within 60% of the top score, cap at 2 themes so tags stay clean.
  return ranked
    .filter(([, score]) => score >= topScore * 0.6)
    .slice(0, 2)
    .map(([theme]) => theme);
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { extractDirectives, detectThemes, slugify };
