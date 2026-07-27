const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Fraunces:ital,wght@1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">`;

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

// Client-side controller for the 12 precomputed chromatic frames build.js
// writes into chordSheetHtml. No chord-parsing logic runs in the browser.
//
// Two independent dials:
//   transposeSteps — how many semitones you want the song to actually
//                    SOUND in, away from how it was originally charted.
//   capoSteps      — the capo fret you'll physically use. Choosing a capo
//                    does NOT change what the song sounds like; it changes
//                    which SHAPES you finger, since the capo itself raises
//                    the pitch back up.
//
// The shapes shown = (transposeSteps - capoSteps), reduced to one of the
// 12 precomputed frames. The "Concert Key" label always reflects
// transposeSteps alone, since that's what the song actually sounds like
// regardless of capo choice.
function buildTransposeScript(initialCapo) {
  return `<script>
(function(){
  var wrap = document.querySelector('.chord-sheet-wrap');
  if (!wrap) return;
  var frames = wrap.querySelectorAll('.chord-sheet-frame');
  var keyLabel = document.getElementById('current-key');
  var capoSelect = document.getElementById('capo-select');

  var keyForIndex = {};
  frames.forEach(function(f){
    keyForIndex[parseInt(f.dataset.transpose, 10)] = f.dataset.key;
  });

  function norm(n) { return ((n % 12) + 12) % 12; }

  var transposeSteps = 0;
  var capoSteps = ${initialCapo};

  function render() {
    var shapeIndex = norm(transposeSteps - capoSteps);
    frames.forEach(function(f){
      var d = parseInt(f.dataset.transpose, 10);
      f.toggleAttribute('hidden', d !== shapeIndex);
    });
    if (keyLabel) {
      var concertKey = keyForIndex[norm(transposeSteps)];
      if (concertKey) keyLabel.textContent = concertKey;
    }
    if (capoSelect) capoSelect.value = String(capoSteps);
  }

  if (capoSelect) {
    for (var c = 0; c <= 11; c++) {
      var opt = document.createElement('option');
      opt.value = String(c);
      opt.textContent = c === 0 ? 'No capo' : 'Capo ' + c;
      capoSelect.appendChild(opt);
    }
    capoSelect.addEventListener('change', function(){
      capoSteps = parseInt(capoSelect.value, 10) || 0;
      render();
    });
  }

  var upBtn = document.getElementById('transpose-up');
  var downBtn = document.getElementById('transpose-down');
  var resetBtn = document.getElementById('transpose-reset');

  if (upBtn) upBtn.addEventListener('click', function(){ transposeSteps += 1; render(); });
  if (downBtn) downBtn.addEventListener('click', function(){ transposeSteps -= 1; render(); });
  if (resetBtn) resetBtn.addEventListener('click', function(){
    transposeSteps = 0;
    capoSteps = ${initialCapo};
    render();
  });

  render();
})();
</script>`;
}

function songPage({ title, artist, key, capo, tempo, time, callnum, themes, info, youtube, chordSheetHtml, initialCapo, capoSuggestion, cardImage, pageUrl, slug }) {
  const themeTags = themes.map(t => `<span class="tag theme">${t}</span>`).join('');
  const keyTag = key ? `<span class="tag">KEY <span id="current-key">${key}</span></span>` : '';
  const metaTags = [
    keyTag,
    tempo ? `<span class="tag">${tempo} BPM</span>` : '',
    time ? `<span class="tag">${time}</span>` : ''
  ].join('');

  const suggestionBanner = capoSuggestion
    ? `<p class="capo-suggestion">
        <strong>${key}</strong> has a lot of barre chords on guitar. For an easier feel that sounds identical,
        try <strong>capo ${capoSuggestion.capo}</strong> and play it as <strong>${capoSuggestion.shapeKey}</strong> shapes
        — the Capo picker below is already set to try this out.
      </p>`
    : '';

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
  <a href="../" class="eyebrow">Chord Library · Smart Chart Tool</a>
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
    ${suggestionBanner}

    ${key ? `<div class="transpose-controls">
      <button type="button" class="transpose-btn" id="transpose-down" aria-label="Transpose down">&minus;</button>
      <span class="transpose-hint">Transpose</span>
      <button type="button" class="transpose-btn" id="transpose-up" aria-label="Transpose up">+</button>
      <button type="button" class="transpose-reset" id="transpose-reset">Reset</button>
      <span class="capo-picker">
        <label for="capo-select" class="transpose-hint">Capo</label>
        <select id="capo-select"></select>
      </span>
    </div>` : ''}

    <div class="chord-sheet chord-sheet-wrap">${chordSheetHtml}</div>
  </div>
</div>

<footer class="site-footer">Chord Library · generated from /songs/${slug}.cho</footer>

${key ? buildTransposeScript(initialCapo || 0) : ''}

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

  const artistCount = Object.keys(songsByArtist).length;

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
  <a href="#" class="eyebrow">Chord Library · Smart Chart Tool</a>
</header>

<section class="hero">
  <h1>Paste a chart. Get a page that already <em>knows the key</em>.</h1>
  <p class="lede">Drop in a ChordPro chart and the library handles the rest: theme tagging, capo math,
  live transpose, and a formatted page — ready to play from, not just read.</p>

  <div class="pipeline">
    <div class="pipeline-step">
      <div class="pipeline-node"><span class="pipeline-dot"></span><span class="pipeline-label">Paste</span></div>
      <p class="pipeline-desc">Drop in a raw ChordPro chart — chords, directives, lyrics as-is.</p>
    </div>
    <div class="pipeline-cable"></div>
    <div class="pipeline-step">
      <div class="pipeline-node"><span class="pipeline-dot"></span><span class="pipeline-label">Auto-tag &amp; build</span></div>
      <p class="pipeline-desc">Theme detection, capo suggestions, and a formatted page, generated on push.</p>
    </div>
    <div class="pipeline-cable"></div>
    <div class="pipeline-step">
      <div class="pipeline-node"><span class="pipeline-dot"></span><span class="pipeline-label">Play</span></div>
      <p class="pipeline-desc">Transpose live, pick a capo position, and see the concert key update.</p>
    </div>
  </div>
</section>

<div class="wrap">
  <div class="catalog-head">
    <h2>Catalog</h2>
    <span class="catalog-count">${totalCount} chart${totalCount === 1 ? '' : 's'} · ${artistCount} artist${artistCount === 1 ? '' : 's'}</span>
  </div>
  ${artistSections}
</div>

<footer class="site-footer">Chord Library · built with scripts/build.js</footer>

</body>
</html>`;
}

module.exports = { songPage, indexPage };
