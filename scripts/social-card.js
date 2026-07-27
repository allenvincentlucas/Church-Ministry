const sharp = require('sharp');

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

  const svg = `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#FAF9F6"/>

    <!-- index card -->
    <rect x="60" y="60" width="${W - 120}" height="${H - 120}" rx="4"
      fill="#ffffff" stroke="#E3E0D8" stroke-width="2"/>

    <!-- accent dot + eyebrow -->
    <circle cx="100" cy="118" r="6" fill="#2A4B8D"/>
    <text x="118" y="124" font-family="monospace" font-size="20" letter-spacing="2"
      fill="#2A4B8D">CHORD LIBRARY</text>

    <!-- call number chip -->
    <rect x="${W - 300}" y="98" width="200" height="40" rx="3" fill="#EAEFF8"/>
    <text x="${W - 200}" y="124" font-family="monospace" font-size="18" fill="#2A4B8D"
      text-anchor="middle">${esc(callnum)}</text>

    <!-- title -->
    <text x="100" y="330" font-family="sans-serif" font-weight="700" font-size="${fontSize}"
      fill="#191B1F">${esc(title)}</text>

    <!-- artist -->
    <text x="100" y="380" font-family="sans-serif" font-size="30" fill="#84806F">${esc(artist || '')}</text>

    <!-- theme tag -->
    ${theme ? `
    <rect x="100" y="440" width="${Math.max(120, theme.length * 13 + 40)}" height="44" rx="3"
      fill="#FAF9F6" stroke="#E3E0D8" stroke-width="1.5"/>
    <text x="${100 + Math.max(120, theme.length * 13 + 40) / 2}" y="468" font-family="monospace"
      font-size="18" fill="#84806F" text-anchor="middle" letter-spacing="1">${esc(theme.toUpperCase())}</text>
    ` : ''}
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

module.exports = { generateCard };
