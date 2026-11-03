(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js?v=3');
  document.querySelectorAll('.tool-card').forEach(function (card) {
    card.addEventListener('click', function () {
      sessionStorage.setItem('naijaToolsStarted', 'true');
    });
  });
})();
