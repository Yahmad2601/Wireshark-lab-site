// Local, intentionally tiny. No analytics, no remote calls — every packet a
// student sees should belong to the lesson, not to this script.
(function () {
  'use strict';
  // Mark the active lesson link, purely cosmetic.
  var here = window.location.pathname;
  document.querySelectorAll('.lesson-grid a').forEach(function (a) {
    if (a.getAttribute('href').split('?')[0] === here) {
      a.style.textDecoration = 'underline';
    }
  });
})();
