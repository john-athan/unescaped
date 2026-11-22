// Extension page: holds the document and may fetch Drive with your cookies.
// The sandboxed frame inside it is the only place the document's own scripts
// run, with an opaque origin and no extension APIs.

// Listen before reading: the background writes right after creating this tab,
// and a write between the read and the listener would otherwise be lost.
function documentFor(key) {
  return new Promise((resolve) => {
    const done = (doc) => { chrome.storage.session.onChanged.removeListener(wait); resolve(doc); };
    const wait = (changes) => { if (changes[key]?.newValue) done(changes[key].newValue); };
    chrome.storage.session.onChanged.addListener(wait);
    chrome.storage.session.get(key).then((stored) => { if (stored[key]) done(stored[key]); });
  });
}

async function fromDrive({ id, user }) {
  const r = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&authuser=${encodeURIComponent(user)}`, { credentials: 'include' });
  if (!r.ok || r.url.includes('accounts.google.com')) throw new Error(`Download failed: ${r.status} ${r.url}`);
  return r.text();
}

const html = chrome.tabs.getCurrent()
  .then((tab) => documentFor(`doc:${tab.id}`))
  .then((doc) => {
    if (doc.error) throw new Error(doc.error);
    return doc.drive ? fromDrive(doc.drive) : doc.html;
  });

addEventListener('DOMContentLoaded', () => {
  const f = document.createElement('iframe');
  f.onload = () => html
    .then((text) => {
      document.title = new DOMParser().parseFromString(text, 'text/html').title || 'Unescaped';
      f.contentWindow.postMessage(text, '*');
    })
    .catch((e) => {
      f.remove();
      const p = document.createElement('p');
      p.className = 'error';
      p.textContent = e.message;
      document.body.append(p);
    });
  f.src = 'sandbox.html';
  document.body.append(f);
});
