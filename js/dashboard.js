(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
  if (sessionStorage.getItem('naijaToolsStarted') !== 'true') {
    window.location.replace('index.html');
    return;
  }
  document.querySelectorAll('.tool-card').forEach(function (card) {
    card.addEventListener('click', function () {
      sessionStorage.setItem('naijaToolsStarted', 'true');
    });
  });
})();
