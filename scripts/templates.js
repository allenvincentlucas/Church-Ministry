const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

// assetPrefix is relative, not absolute, because GitHub Pages project sites
// are served under a subpath (e.g. /worship-chord-library/). "" for pages at
// site root (index.html), "../" for pages one level down (songs/*.html).
function favicon(assetPrefix) {
  return `<link rel="icon" type="image/svg+xml" href="${assetPrefix}assets/favicon.svg">`;
}

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

// Client-side toggler for the precomputed transpose frames build.js writes
// into chordSheetHtml. No chord-parsing logic runs in the browser — it just
// shows/hides the frame matching the current semitone offset.
const TRANSPOSE_SCRIPT = `<script>
(function(){
  var wrap = document.querySelector('.chord-sheet-wrap');
  if (!wrap) return;
  var frames = wrap.querySelectorAll('.chord-sheet-frame');
  var keyLabel = document.getElementById('current-key');
  var capoLabel = document.getElementById('current-capo');
  var current = 0;

  function show(delta) {
    frames.forEach(function(f){
      var d = parseInt(f.dataset.transpose, 10);
      if (d === delta) {
        f.removeAttribute('hidden');
        if (keyLabel && f.dataset.key) keyLabel.textContent = f.dataset.key;
        if (capoLabel && f.dataset.capo !== undefined && f.dataset.capo !== '') {
          var c = parseInt(f.dataset.capo, 10);
          // Capo can't be negative or unreasonably high in practice;
          // outside 0-11 there's no clean capo position for this shape.
          capoLabel.textContent = (c >= 0 && c <= 11) ? c : 'n/a';
        }
      } else {
        f.setAttribute('hidden', '');
      }
    });
    current = delta;
  }

  var upBtn = document.getElementById('transpose-up');
  var downBtn = document.getElementById('transpose-down');
  var resetBtn = document.getElementById('transpose-reset');

  if (upBtn) upBtn.addEventListener('click', function(){ if (current < 5) show(current + 1); });
  if (downBtn) downBtn.addEventListener('click', function(){ if (current > -6) show(current - 1); });
  if (resetBtn) resetBtn.addEventListener('click', function(){ show(0); });
})();
</script>`;

function songPage({ title, artist, key, capo, tempo, time, callnum, themes, info, youtube, chordSheetHtml, cardImage, pageUrl, slug }) {
  const themeTags = themes.map(t => `<span class="tag theme">${t}</span>`).join('');
  const keyTag = key ? `<span class="tag">KEY <span id="current-key">${key}</span></span>` : '';
  const capoTag = capo ? `<span class="tag">CAPO <span id="current-capo">${capo}</span></span>` : '';
  const metaTags = [
    keyTag,
    capoTag,
    tempo ? `<span class="tag">${tempo} BPM</span>` : '',
    time ? `<span class="tag">${time}</span>` : ''
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Chord Library</title>
${favicon('../')}
${HEAD_FONTS}
<link rel="stylesheet" href="../assets/style.css">

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
  <a href="../" class="eyebrow">Worship Tech · Song Catalog</a>
  <h1>Chord Library</h1>
</header>

<div class="wrap">
  <a href="../" class="back-link">&larr; Back to catalog</a>

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

    ${key ? `<div class="transpose-controls">
      <button type="button" class="transpose-btn" id="transpose-down" aria-label="Transpose down">&minus;</button>
      <span class="transpose-hint">Transpose</span>
      <button type="button" class="transpose-btn" id="transpose-up" aria-label="Transpose up">+</button>
      <button type="button" class="transpose-reset" id="transpose-reset">Reset</button>
    </div>` : ''}

    <div class="chord-sheet chord-sheet-wrap">${chordSheetHtml}</div>
  </div>
</div>

<footer class="site-footer">Chord Library · generated from /songs/${slug}.cho</footer>

${key ? TRANSPOSE_SCRIPT : ''}

</body>
</html>`;
}

function indexPage({ songsByArtist, songsByTheme, totalCount }) {
  function cardHtml(song) {
    return `<a class="card" href="songs/${song.slug}.html">
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
${favicon('')}
${HEAD_FONTS}
<link rel="stylesheet" href="assets/style.css">
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
