// Shared entry point for the landing page. Keep page-specific builder logic in its own module.
document.documentElement.classList.add('js-ready');
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js');
