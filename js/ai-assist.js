(function () {
  const tool = document.body.dataset.tool;
  const supported = ['cv', 'proposal', 'letter', 'contract', 'flyer'];
  if (!supported.includes(tool)) return;
  const panel = document.querySelector('.panel');
  if (!panel) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ai-assist-button';
  button.textContent = '✦ Improve with AI';
  const message = document.createElement('p');
  message.className = 'ai-assist-message';
  message.setAttribute('role', 'status');
  panel.insertBefore(button, panel.firstChild);
  panel.insertBefore(message, button.nextSibling);
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Writing…';
    message.textContent = '';
    const fields = {};
    panel.querySelectorAll('[data-field]').forEach((input) => { fields[input.dataset.field] = input.value; });
    try {
      const response = await fetch('/api/ai', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool, fields }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI could not complete this request');
      Object.entries(result.fields || {}).forEach(([name, value]) => {
        const input = panel.querySelector(`[data-field="${name}"]`);
        if (!input || typeof value !== 'string') return;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      message.textContent = 'Done. Review the wording, then personalise it before sending.';
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = '✦ Improve with AI';
    }
  });
})();
