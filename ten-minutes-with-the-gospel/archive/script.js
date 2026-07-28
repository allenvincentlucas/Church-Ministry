// Ten Minutes with the Gospel — archive page
// Reads manifest.json (one entry per day), excludes whichever entry is
// currently featured on Home (the single most recent date that is today
// or earlier), and groups everything else by month, linking to that
// month's page. An entry moves from "featured on Home" into the archive
// only once a newer entry's date arrives and takes its place as featured.
// Future-dated entries are hidden from this list until their date arrives
// (compared against the visitor's own device clock) — this hides them
// from navigation only, not from the internet; the files themselves are
// still publicly reachable at their direct URL the whole time.
function tmgTodayISO() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

var TMG_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// "2026-07-22" -> "July 22, 2026"
function tmgFormatDate(dateStr) {
  var parts = dateStr.split("-");
  var year = parts[0];
  var monthNum = parseInt(parts[1], 10);
  var day = parseInt(parts[2], 10);
  return TMG_MONTH_NAMES[monthNum - 1] + " " + day + ", " + year;
}

(function () {
  var list = document.getElementById("archive-list");

  fetch("../manifest.json")
    .then(function (res) { return res.json(); })
    .then(function (entries) {
      var today = tmgTodayISO();
      var visible = (entries || []).filter(function (e) { return e.date <= today; });

      if (visible.length === 0) return; // leave the static empty-state markup as-is

      // The single most recent entry is the one currently featured on
      // Home — it doesn't belong in the archive yet. Everything else
      // (already superseded) does.
      var sortedVisible = visible.slice().sort(function (a, b) {
        return a.date < b.date ? 1 : -1;
      });
      var archivable = sortedVisible.slice(1);

      if (archivable.length === 0) return; // nothing has been superseded yet

      // Group by YYYY-MM
      var months = {};
      archivable.forEach(function (e) {
        var key = e.date.slice(0, 7); // "YYYY-MM"
        if (!months[key]) months[key] = [];
        months[key].push(e);
      });

      // Newest month first
      var monthKeys = Object.keys(months).sort(function (a, b) {
        return a < b ? 1 : -1;
      });

      if (!list) return;

      // Clear the static "Nothing here yet" placeholder before populating
      list.innerHTML = "";

      monthKeys.forEach(function (key) {
        var parts = key.split("-");
        var year = parts[0];
        var monthNum = parseInt(parts[1], 10);
        var monthName = TMG_MONTH_NAMES[monthNum - 1];

        var monthEntries = months[key].slice().sort(function (a, b) {
          return a.date < b.date ? 1 : -1;
        });

        var section = document.createElement("section");
        section.className = "archive-month";

        var heading = document.createElement("h2");
        var monthLink = document.createElement("a");
        monthLink.href = "../" + year + "/" + parts[1] + "/index.html";
        monthLink.textContent = monthName + " " + year;
        heading.appendChild(monthLink);
        section.appendChild(heading);

        var ul = document.createElement("ul");
        ul.className = "archive-entries";
        monthEntries.forEach(function (e) {
          var li = document.createElement("li");
          li.className = "archive-entry";

          var dateSpan = document.createElement("span");
          dateSpan.className = "archive-entry-date";
          dateSpan.textContent = tmgFormatDate(e.date);
          li.appendChild(dateSpan);

          var a = document.createElement("a");
          a.className = "archive-entry-title";
          a.href = "../" + e.slug.replace(/\/?$/, "/") + "index.html";
          a.textContent = e.title;
          li.appendChild(a);

          if (e.liturgicalDay) {
            var span = document.createElement("span");
            span.className = "archive-entry-day";
            span.textContent = e.liturgicalDay;
            li.appendChild(span);
          }
          ul.appendChild(li);
        });
        section.appendChild(ul);

        list.appendChild(section);
      });
    })
    .catch(function () {
      // If manifest.json can't be read (e.g. opened via file:// locally,
      // or the fetch genuinely fails), the static empty-state content
      // already in the page is fine as-is.
    });
})();
