// Ten Minutes with the Gospel — shared month-page script.
// Used by EVERY /YYYY/MM/index.html. Never edited per month — this same
// file is linked from every month folder as ../../month-page.js.
// It reads its own folder path (e.g. /2026/07/) to know which month it
// is, fetches the site-wide manifest, and lists just that month's entries.

(function () {
  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function tmgTodayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // Pull the /YYYY/MM/ segment out of this page's own path.
  function getYearMonth() {
    var match = window.location.pathname.match(/(\d{4})\/(\d{2})\/?(?:index\.html)?$/);
    if (!match) return null;
    return { year: match[1], month: match[2] };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var ym = getYearMonth();
    var titleEl = document.getElementById('month-title');
    var listEl = document.getElementById('month-entries');

    if (!ym) {
      if (listEl) listEl.innerHTML = '<p class="empty-note">Could not determine which month this page is for.</p>';
      return;
    }

    var monthName = MONTH_NAMES[parseInt(ym.month, 10) - 1] || ym.month;
    if (titleEl) titleEl.textContent = 'Reflections from ' + monthName + ' ' + ym.year;
    document.title = monthName + ' ' + ym.year + ' — Ten Minutes with the Gospel';

    fetch('../../manifest.json')
      .then(function (res) { return res.json(); })
      .then(function (entries) {
        var today = tmgTodayISO();
        var prefix = ym.year + '-' + ym.month;

        var monthEntries = entries.filter(function (e) {
          return e.date.indexOf(prefix) === 0 && e.date <= today;
        });

        monthEntries.sort(function (a, b) {
          return b.date.localeCompare(a.date);
        });

        if (!listEl) return;

        if (monthEntries.length === 0) {
          listEl.innerHTML = '<p class="empty-note">Nothing published yet this month — check back soon.</p>';
          return;
        }

        listEl.innerHTML = monthEntries.map(function (e) {
          var day = e.slug.split('/')[2];
          var dateObj = new Date(e.date + 'T00:00:00');
          var dateLabel = MONTH_NAMES[dateObj.getMonth()] + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear();
          return '<a class="month-card" href="./' + day + '/index.html">' +
            '<span class="month-card-date">' + dateLabel + '</span>' +
            '<span class="month-card-title">' + e.title + '</span>' +
            '<span class="month-card-day">' + e.liturgicalDay + '</span>' +
            '</a>';
        }).join('');
      })
      .catch(function () {
        if (listEl) listEl.innerHTML = '<p class="empty-note">Could not load this month\'s reflections right now.</p>';
      });
  });
})();
