// Ten Minutes with the Gospel — July 24, 2026 day page
// Minimal script: footer year only.
document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
