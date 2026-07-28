const sharp = require('sharp');

// One accent color per taxonomy theme (data/taxonomy.json), used to tint
// the eyebrow dot, call-number chip, and theme tag on that song's card so
// cards are visually distinguishable by theme at a glance, not just by
// their text label. Falls back to a neutral tone for "Uncategorized" or
// any theme not in this list (e.g. a custom {theme: ...} the taxonomy
// doesn't know about).
const THEME_COLORS = {
  'Redemption & Grace': '#8B3A42',
  'Praise & Celebration': '#C08A2E',
  'Surrender & Trust': '#2A4B8D',
  'Communion': '#6B4E71',
  'Christmas': '#2F6B4F',
  'Easter & Resurrection': '#D97F3D',
  'Prayer & Intimacy': '#4C6B8A',
  'Mission & Sending': '#2C6E5C'
};
const DEFAULT_ACCENT = '#6B6558';

function accentFor(theme) {
  return (theme && THEME_COLORS[theme]) || DEFAULT_ACCENT;
}

// Lightens a hex color toward white by `amount` (0-1), for tint backgrounds
// behind the theme tag — same trick the site's CSS --*-tint variables use.
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = c => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Escapes text for safe embedding inside SVG.
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Scales the title font down a bit for longer titles so it never wraps awkwardly.
function titleSize(title) {
  if (title.length > 34) return 44;
  if (title.length > 22) return 54;
  return 64;
}

async function generateCard({ title, artist, callnum, theme, outPath }) {
  const W = 1200, H = 630;
  const fontSize = titleSize(title);
  const accent = accentFor(theme);
  const accentTint = tint(accent, 0.88);

  const svg = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#FAF9F6"/>

    <!-- index card -->
    <rect x="60" y="60" width="${W - 120}" height="${H - 120}" rx="4"
      fill="#ffffff" stroke="#E3E0D8" stroke-width="2"/>

    <!-- theme-colored top accent strip -->
    <rect x="60" y="60" width="${W - 120}" height="6" rx="3" fill="${accent}"/>

    <!-- accent dot + eyebrow -->
    <circle cx="100" cy="128" r="6" fill="${accent}"/>
    <text x="118" y="134" font-family="monospace" font-size="20" letter-spacing="2"
      fill="${accent}">CHORD LIBRARY</text>

    <!-- call number chip -->
    <rect x="${W - 300}" y="108" width="200" height="40" rx="3" fill="${accentTint}"/>
    <text x="${W - 200}" y="134" font-family="monospace" font-size="18" fill="${accent}"
      text-anchor="middle">${esc(callnum)}</text>

    <!-- title -->
    <text x="100" y="330" font-family="sans-serif" font-weight="700" font-size="${fontSize}"
      fill="#191B1F">${esc(title)}</text>

    <!-- artist -->
    <text x="100" y="380" font-family="sans-serif" font-size="30" fill="#84806F">${esc(artist || '')}</text>

    <!-- theme tag -->
    ${theme ? `
    <rect x="100" y="440" width="${Math.max(120, theme.length * 13 + 40)}" height="44" rx="3"
      fill="${accentTint}" stroke="${accent}" stroke-width="1.5"/>
    <text x="${100 + Math.max(120, theme.length * 13 + 40) / 2}" y="468" font-family="monospace"
      font-size="18" fill="${accent}" text-anchor="middle" letter-spacing="1">${esc(theme.toUpperCase())}</text>
    ` : ''}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

module.exports = { generateCard };
