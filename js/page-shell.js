(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js');
  if (sessionStorage.getItem('naijaToolsStarted') !== 'true') {
    window.location.replace('../index.html');
    return;
  }
  const modal = document.createElement('div');
  modal.id = 'pay-modal';
  modal.className = 'pay-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="pay-box"><button data-close-paywall class="pay-close" type="button">×</button><div id="verify-step"><span class="premium-tag">VERIFY ACCESS</span><h2>Verify your email to start.</h2><p>We use your verified email to keep your 3 daily downloads consistent across browsers.</p><label class="pay-email-label" for="access-email">Email address</label><input id="access-email" class="pay-email" type="email" placeholder="you@example.com" autocomplete="email"><button id="send-code" class="button button-dark" type="button">Send verification code</button><div id="code-step" hidden><label class="pay-email-label" for="access-code">Verification code</label><input id="access-code" class="pay-email" inputmode="numeric" placeholder="6-digit code"><button id="verify-code" class="button button-dark" type="button">Verify email</button></div><p id="access-message" class="access-message" role="alert"></p></div><div id="upgrade-step" hidden><span class="premium-tag">PRO ACCESS</span><h2>Unlock unlimited access.</h2><p>Pay ₦3,500 for 30 days of unlimited downloads.</p><button id="pay-btn" class="button button-dark" type="button">Pay ₦3,500 with Paystack</button></div></div>';
  document.body.appendChild(modal);
  ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '../js/paywall.js', '../js/tools.js'].forEach(function (src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  });
})();
