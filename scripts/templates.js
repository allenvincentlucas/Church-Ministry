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

  // Chords <-> Nashville numbers toggle. Numbers are key-relative, so they
  // don't change with transpose/capo — hide those controls while active.
  var chordsBtn = document.getElementById('notation-chords');
  var numbersBtn = document.getElementById('notation-numbers');
  var nashvilleWrap = document.querySelector('.chord-sheet-nashville');
  var controls = document.querySelector('.transpose-controls');

  function setNotation(mode) {
    var showNumbers = mode === 'numbers';
    if (nashvilleWrap) nashvilleWrap.toggleAttribute('hidden', !showNumbers);
    wrap.toggleAttribute('hidden', showNumbers);
    if (controls) controls.toggleAttribute('hidden', showNumbers);
    if (chordsBtn) chordsBtn.classList.toggle('active', !showNumbers);
    if (numbersBtn) numbersBtn.classList.toggle('active', showNumbers);
  }

  if (chordsBtn) chordsBtn.addEventListener('click', function(){ setNotation('chords'); });
  if (numbersBtn) numbersBtn.addEventListener('click', function(){ setNotation('numbers'); });

  // Print: make sure whichever notation/frame is on screen is what prints.
  var printBtn = document.getElementById('print-chart');
  if (printBtn) printBtn.addEventListener('click', function(){ window.print(); });
})();
</script>`;
}

function songPage({ title, artist, key, capo, tempo, time, callnum, themes, info, youtube, chordSheetHtml, nashvilleHtml, initialCapo, capoSuggestion, cardImage, pageUrl, slug }) {
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

<header class="site-header no-print">
  <a href="../" class="eyebrow">Chord Library · Smart Chart Tool</a>
</header>

<div class="wrap">
  <div class="page-actions no-print">
    <a href="../" class="back-link">&larr; Back to catalog</a>
    <button type="button" class="print-btn" id="print-chart">Print chart</button>
  </div>

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
    <div class="no-print">${youtubeEmbed(youtube)}</div>
    ${suggestionBanner}

    ${key && nashvilleHtml ? `<div class="notation-toggle no-print">
      <button type="button" class="notation-btn active" id="notation-chords">Chords</button>
      <button type="button" class="notation-btn" id="notation-numbers">Numbers</button>
    </div>` : ''}

    ${key ? `<div class="transpose-controls no-print">
      <button type="button" class="transpose-btn" id="transpose-down" aria-label="Transpose down">&minus;</button>
      <span class="transpose-hint">Transpose</span>
      <button type="button" class="transpose-btn" id="transpose-up" aria-label="Transpose up">+</button>
      <button type="button" class="transpose-reset" id="transpose-reset">Reset</button>
      <span class="capo-picker">
        <label for="capo-select" class="transpose-hint">Capo</label>
        <select id="capo-select"></select>
      </span>
    </div>` : ''}

    <div class="chart-panel chord-sheet-wrap">${chordSheetHtml}</div>
    ${nashvilleHtml ? `<div class="chart-panel chord-sheet-nashville" hidden>${nashvilleHtml}</div>` : ''}
  </div>
</div>

<footer class="site-footer no-print">Chord Library · generated from /songs/${slug}.cho</footer>

${key ? buildTransposeScript(initialCapo || 0) : ''}

</body>
</html>`;
}

function indexPage({ songsByArtist, songsByTheme, totalCount, recentSongs }) {
  function badgeHtml(song) {
    if (song.friendly === true) return `<span class="tag friendly-hint">Open chords</span>`;
    if (song.friendly === false && song.capoHint) return `<span class="tag capo-hint">Capo ${song.capoHint}</span>`;
    return '';
  }

  function cardHtml(song) {
    const searchIndex = [song.title, song.artist, ...(song.themes || [])].join(' ').toLowerCase();
    return `<a class="card" href="songs/${song.slug}.html" data-search="${searchIndex.replace(/"/g, '&quot;')}">
      <div class="dot"></div>
      <div class="title">${song.title}</div>
      <span class="callnum">${song.callnum}</span>
      <div class="meta">${song.artist || ''}</div>
      <div class="card-badges">${badgeHtml(song)}</div>
    </a>`;
  }

  const artistCount = Object.keys(songsByArtist).length;

  const artistSections = Object.entries(songsByArtist)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([artist, songs]) => `
      <div class="section-label" data-artist-section>${artist}</div>
      ${songs.map(cardHtml).join('\n')}
    `).join('\n');

  const recentSection = recentSongs && recentSongs.length
    ? `<div class="catalog-head">
        <h2>Recently added</h2>
      </div>
      <div class="recent-grid">
        ${recentSongs.map(cardHtml).join('\n')}
      </div>`
    : '';

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
  <h1>Chord Library</h1>
  <p class="lede">Chord charts for the worship team, ready to play from. Browse by artist, check the key
  and capo before rehearsal, and transpose live on your phone or tablet — no printouts, no separate app.</p>
</section>

<div class="wrap">
  <input type="search" id="song-search" class="search-input" placeholder="Search by song, artist, or theme…" aria-label="Search charts">
  <p id="no-results" class="no-results" hidden>No charts match your search.</p>

  ${recentSection}

  <div class="catalog-head">
    <h2>Catalog</h2>
    <span class="catalog-count">${totalCount} chart${totalCount === 1 ? '' : 's'} · ${artistCount} artist${artistCount === 1 ? '' : 's'}</span>
  </div>
  <div id="catalog-list">
    ${artistSections}
  </div>
</div>

<footer class="site-footer">Chord Library · built with scripts/build.js</footer>

<script>
(function(){
  var input = document.getElementById('song-search');
  var noResults = document.getElementById('no-results');
  if (!input) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var sectionLabels = Array.prototype.slice.call(document.querySelectorAll('[data-artist-section]'));

  input.addEventListener('input', function(){
    var term = input.value.trim().toLowerCase();
    var visibleCount = 0;
    cards.forEach(function(card){
      var match = !term || (card.dataset.search || '').indexOf(term) !== -1;
      card.toggleAttribute('hidden', !match);
      if (match) visibleCount += 1;
    });
    // Hide an artist section label if every card under it is hidden.
    sectionLabels.forEach(function(label){
      var next = label.nextElementSibling;
      var anyVisible = false;
      while (next && !next.hasAttribute('data-artist-section')) {
        if (next.classList.contains('card') && !next.hasAttribute('hidden')) anyVisible = true;
        next = next.nextElementSibling;
      }
      label.toggleAttribute('hidden', !anyVisible);
    });
    if (noResults) noResults.toggleAttribute('hidden', visibleCount !== 0 || !term);
  });
})();
</script>

</body>
</html>`;
}

module.exports = { songPage, indexPage };
