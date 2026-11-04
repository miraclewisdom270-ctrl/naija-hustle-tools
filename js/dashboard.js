(function () {
  document.body.style.visibility = 'hidden';
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js?v=3');
  fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status' }) })
    .then(function (response) { return response.json(); })
    .then(function (result) {
      if (!result.ok) { window.location.replace('signup.html'); return; }
      document.body.style.visibility = 'visible';
    })
    .catch(function () { window.location.replace('signup.html'); });
  document.querySelectorAll('.tool-card').forEach(function (card) {
    card.addEventListener('click', function () {
      sessionStorage.setItem('naijaToolsStarted', 'true');
    });
  });
  const signout = document.getElementById('customer-signout');
  if (signout) signout.addEventListener('click', async function () {
    await fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    sessionStorage.clear();
    localStorage.removeItem('verifiedEmail');
    localStorage.removeItem('isPremium');
    localStorage.removeItem('premiumExpiryDate');
    window.location.href = 'index.html';
  });
})();
