(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
  document.querySelectorAll('.tool-card').forEach(function (card) {
    card.addEventListener('click', function () {
      sessionStorage.setItem('naijaToolsStarted', 'true');
    });
  });
})();
