const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

const FAVICON = `<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">`;

function youtubeEmbed(url) {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
  if (!m) return '';
  const id = m[1];
  return `<div class="video-wrap">
    <iframe src="https://www.youtube.com/embed/${id}" title="Official video" loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>
  </div>`;
}

function songPage({ title, artist, key, capo, tempo, time, callnum, themes, info, youtube, chordSheetHtml, cardImage, pageUrl, slug }) {
  const themeTags = themes.map(t => `<span class="tag theme">${t}</span>`).join('');
  const metaTags = [
    key ? `<span class="tag">KEY ${key}</span>` : '',
    capo ? `<span class="tag">CAPO ${capo}</span>` : '',
    tempo ? `<span class="tag">${tempo} BPM</span>` : '',
    time ? `<span class="tag">${time}</span>` : ''
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Chord Library</title>
${FAVICON}
${HEAD_FONTS}
<link rel="stylesheet" href="/assets/style.css">

<!-- Social preview -->
<meta property="og:title" content="${title}${artist ? ' — ' + artist : ''}">
<meta property="og:description" content="${info ? info.replace(/"/g, '&quot;') : 'ChordPro chart on Chord Library.'}">
<meta property="og:image" content="${cardImage}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:type" content="music.song">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>

<header class="site-header">
  <a href="/" class="eyebrow">Worship Tech · Song Catalog</a>
  <h1>Chord Library</h1>
</header>

<div class="wrap">
  <a href="/" class="back-link">&larr; Back to catalog</a>

  <div class="song-card">
    <div class="viewer-head">
      <div>
        <h2 class="viewer-title">${title}</h2>
        ${artist ? `<p class="viewer-artist">${artist}</p>` : ''}
        <div class="tags">${metaTags}${themeTags}</div>
      </div>
      <span class="callnum">${callnum}</span>
    </div>

    ${info ? `<p class="info-blurb">${info}</p>` : ''}
    ${youtubeEmbed(youtube)}

    <div class="chord-sheet">${chordSheetHtml}</div>
  </div>
</div>

<footer class="site-footer">Chord Library · generated from /songs/${slug}.cho</footer>

</body>
</html>`;
}

function indexPage({ songsByArtist, songsByTheme, totalCount }) {
  function cardHtml(song) {
    return `<a class="card" href="/songs/${song.slug}.html">
      <div class="dot"></div>
      <div class="title">${song.title}</div>
      <span class="callnum">${song.callnum}</span>
      <div class="meta">${song.artist || ''}</div>
    </a>`;
  }

  const artistSections = Object.entries(songsByArtist)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([artist, songs]) => `
      <div class="section-label">${artist}</div>
      ${songs.map(cardHtml).join('\n')}
    `).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chord Library</title>
${FAVICON}
${HEAD_FONTS}
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>

<header class="site-header">
  <div class="eyebrow">Worship Tech · Song Catalog</div>
  <h1>Chord Library</h1>
  <p>${totalCount} chart${totalCount === 1 ? '' : 's'}, organized by artist. ChordPro in, formatted chart out.</p>
</header>

<div class="wrap">
  ${artistSections}
</div>

<footer class="site-footer">Chord Library · built with scripts/build.js</footer>

</body>
</html>`;
}

module.exports = { songPage, indexPage };
