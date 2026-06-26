// Second, separate script so /assets-demo fires an extra JS request. Local
// only — no network calls, so the just the asset requests show in the capture.
(function () {
  'use strict';
  var el = document.getElementById('asset-count');
  if (!el) return;
  // Count the local assets this page references (images + this script's siblings).
  var imgs = document.querySelectorAll('.tile-grid img').length;
  el.textContent = String(imgs);
})();
