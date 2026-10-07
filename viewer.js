// Extension page: may fetch Drive with your cookies. The sandbox frame may run the file's inline scripts.
const p = new URLSearchParams(location.search);
const html = fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(p.get('id'))}&authuser=${encodeURIComponent(p.get('authuser'))}`, { credentials: 'include' })
  .then((r) => {
    if (!r.ok || r.url.includes('accounts.google.com')) throw new Error(`Download failed: ${r.status} ${r.url}`);
    return r.text();
  });

addEventListener('DOMContentLoaded', () => {
  const f = document.createElement('iframe');
  f.onload = () => html
    .then((text) => {
      document.title = new DOMParser().parseFromString(text, 'text/html').title || 'Drive HTML';
      f.contentWindow.postMessage(text, '*');
    })
    .catch((e) => { document.body.textContent = e.message; });
  f.src = 'sandbox.html';
  document.body.append(f);
});
