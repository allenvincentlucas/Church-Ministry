// Ten Minutes with the Gospel — home page
// Reads manifest.json (one entry per day, appended over time) and, once at
// least one entry with a date of today or earlier exists, features the
// most recent one in the hero. Future-dated entries are ignored until
// their date arrives (compared against the visitor's own device clock) —
// this hides them from navigation, but the files themselves are still
// publicly reachable at their direct URL the whole time.

function tmgTodayISO() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

// Formats "2026-07-23" as "July 23, 2026" without going through Date
// parsing (which can shift the day backward in negative UTC-offset
// timezones if you let JS interpret "YYYY-MM-DD" as UTC midnight).
function tmgFormatDate(iso) {
  var months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var parts = iso.split("-");
  var year = parts[0];
  var month = months[parseInt(parts[1], 10) - 1];
  var day = parseInt(parts[2], 10);
  return month + " " + day + ", " + year;
}

(function () {
  fetch("manifest.json")
    .then(function (res) { return res.json(); })
    .then(function (entries) {
      var today = tmgTodayISO();
      var visible = (entries || []).filter(function (e) { return e.date <= today; });
      if (visible.length === 0) return;

      var latest = visible.slice().sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      })[0];

      var eyebrow = document.getElementById("hero-eyebrow");
      var dateLine = document.getElementById("hero-date");
      var title = document.getElementById("hero-title");
      var lede = document.getElementById("hero-lede");
      var citation = document.getElementById("hero-citation");
      var cta = document.getElementById("hero-cta");

      eyebrow.textContent = latest.liturgicalDay || "Today's ten minutes";
      title.textContent = latest.title;
      lede.textContent = latest.lede;

      if (dateLine && latest.date) {
        dateLine.textContent = tmgFormatDate(latest.date);
        dateLine.hidden = false;
      }

      if (latest.citation) {
        citation.textContent = latest.citation;
        citation.hidden = false;
      }

      cta.textContent = "Read the reflection \u2192";
      cta.href = latest.slug.replace(/\/?$/, "/") + "index.html";
    })
    .catch(function () {
      // If manifest.json can't be read (e.g. opened via file:// locally),
      // the static empty-state content already in the page is fine as-is.
    });
})();
