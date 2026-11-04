(function () {
  const tool = document.body.dataset.tool;
  const key = 'naijatools-data-' + tool;
  const state = Object.assign({ business: '', client: '', contact: '', title: '', summary: '', body: '', education: '', note: '', items: [{ description: 'Service or product', qty: 1, price: 0 }] }, JSON.parse(localStorage.getItem(key) || 'null'));
  const $ = (id) => document.getElementById(id);
  const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  function renderItems() {
    if (!$('items-list')) return;
    $('items-list').innerHTML = state.items.map((item, i) => `<div class="item-editor"><input data-i="${i}" data-item="description" value="${esc(item.description)}" aria-label="Description"><input data-i="${i}" data-item="qty" type="number" min="1" value="${item.qty}" aria-label="Quantity"><input data-i="${i}" data-item="price" type="number" min="0" value="${item.price}" aria-label="Price"><button type="button" class="remove-item" data-remove="${i}" aria-label="Remove item">×</button></div>`).join('');
  }
  function docHeader(label) { return `<div class="doc-top"><div><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><div style="font-size:11px;color:#69706a;margin-top:5px">${esc(state.contact)}</div></div><div class="doc-meta"><strong>${label}</strong><span>NT-${String(Date.now()).slice(-6)}</span><br><span>${new Date().toLocaleDateString('en-NG')}</span></div></div>`; }
  function render() {
    const preview = $('tool-preview');
    if (tool === 'cv') {
      const bullets = (value, fallback) => {
        const lines = String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        return lines.length ? `<ul style="margin:8px 0 0;padding-left:18px">${lines.map((line) => `<li style="margin:5px 0">${esc(line.replace(/^[-*•]\s*/, ''))}</li>`).join('')}</ul>` : `<p>${fallback}</p>`;
      };
      const section = (label, content) => `<section style="margin-top:24px"><span class="doc-label">${label}</span>${content}</section>`;
      preview.innerHTML = `<div style="border-bottom:3px solid #101412;padding-bottom:24px"><div style="font:700 35px/.95 'Space Grotesk',sans-serif">${esc(state.business) || 'Your Name'}</div><div style="font:600 15px 'Space Grotesk',sans-serif;color:#14b866;margin-top:10px">${esc(state.title) || 'Professional title'}</div><div style="font:10px 'DM Mono',monospace;color:#69706a;margin-top:12px">${esc(state.contact) || 'Email · phone · location'}</div></div>${section('Professional summary', `<p>${esc(state.summary) || 'Add a concise summary that highlights your experience and strengths.'}</p>`)}${section('Experience', bullets(state.body, 'Add your responsibilities and achievements, one per line.'))}${section('Education', `<p style="white-space:pre-line">${esc(state.education) || 'Add your education and qualifications.'}</p>`)}${section('Skills', `<p>${esc(state.note) || 'Add your strongest skills, separated by commas.'}</p>`)}`;
      return;
    }
    if (tool === 'card') { preview.innerHTML = `<div style="background:#101412;color:#fff;min-height:290px;padding:35px;display:flex;flex-direction:column;justify-content:space-between"><div class="doc-brand" style="color:#fff">${esc(state.business) || 'Your Brand'}<span>.</span></div><div><div style="font:700 28px 'Space Grotesk',sans-serif">${esc(state.client) || 'Your Name'}</div><div style="color:#14b866;font:12px 'DM Mono',monospace;margin-top:8px">${esc(state.title) || 'Your role'}</div><div style="font:11px 'DM Mono',monospace;color:#c5ccc7;margin-top:20px">${esc(state.contact)}</div></div></div>`; return; }
    if (tool === 'letter') { preview.innerHTML = `<div>${docHeader('LETTER')}<div style="margin-top:40px;font-size:12px;color:#69706a">${new Date().toLocaleDateString('en-NG')}</div><h2 style="font:700 24px 'Space Grotesk',sans-serif;margin:30px 0 18px">${esc(state.title) || 'Letter subject'}</h2><p style="font-size:13px;line-height:1.75;white-space:pre-line">${esc(state.body) || 'Write your professional letter here.'}</p><div class="doc-footer">${esc(state.note) || 'Kind regards,'}<br><strong>${esc(state.business) || 'Your Name'}</strong></div></div>`; return; }
    const total = state.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    const label = tool === 'invoice' ? 'INVOICE' : tool === 'receipt' ? 'RECEIPT' : tool === 'salary' ? 'SALARY SLIP' : tool === 'pricelist' ? 'PRICE LIST' : 'QUOTATION';
    const rows = state.items.map((item) => `<tr><td>${esc(item.description) || 'Item'}</td><td>${item.qty || 0}</td><td>${money(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>`).join('');
    preview.innerHTML = `${docHeader(label)}<div class="bill-to"><small>${tool === 'salary' ? 'Employee' : 'Prepared for'}</small><strong>${esc(state.client) || 'Name / client'}</strong></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="doc-total"><div class="grand"><span>${tool === 'salary' ? 'Net pay' : 'Total'}</span><span>${money(total)}</span></div></div><div class="doc-footer">${esc(state.note) || 'Thank you for your business.'}</div>`;
  }
  document.querySelectorAll('[data-field]').forEach((input) => { input.value = state[input.dataset.field] || ''; input.addEventListener('input', () => { state[input.dataset.field] = input.value; save(); render(); }); });
  if ($('items-list')) { renderItems(); $('add-item').addEventListener('click', () => { state.items.push({ description: 'New item', qty: 1, price: 0 }); save(); renderItems(); render(); }); $('items-list').addEventListener('input', (e) => { if (e.target.dataset.i !== undefined) { const i = Number(e.target.dataset.i); state.items[i][e.target.dataset.item] = e.target.dataset.item === 'description' ? e.target.value : Number(e.target.value); save(); render(); } }); $('items-list').addEventListener('click', (e) => { if (e.target.dataset.remove !== undefined && state.items.length > 1) { state.items.splice(Number(e.target.dataset.remove), 1); save(); renderItems(); render(); } }); }
  document.querySelector('[data-download]').addEventListener('click', async () => { if (!(await window.checkAccess())) return; const button = document.querySelector('[data-download]'); button.textContent = 'Preparing…'; const canvas = await html2canvas($('tool-preview'), { scale: 2, backgroundColor: '#ffffff' }); const { jsPDF } = window.jspdf; const pdf = new jsPDF('p', 'mm', 'a4'); const width = 190; pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, width * canvas.height / canvas.width); pdf.save('naijatools-' + tool + '.pdf'); await window.recordDownload(); button.textContent = 'Download PDF ↓'; });
  render();
})();
