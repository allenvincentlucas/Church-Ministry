// Minimal, day-specific script — just the footer year.
document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
