// The click. Reads the tab once, picks a source (sources.js), opens the viewer
// next to it and hands the document over through session storage, keyed by
// the viewer's tab id so closing the tab drops it.
importScripts('sources.js');

const MENU = 'render-selection';
const docKey = (tabId) => `doc:${tabId}`;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU, title: 'Render selection as HTML', contexts: ['selection'] });
});

chrome.action.onClicked.addListener((tab) => render(tab, false));
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU) render(tab, true, info);
});
chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(docKey(tabId)));

// Runs inside the page. Self-contained, because executeScript serialises it.
function readPage() {
  return {
    selection: String(getSelection()),
    contentType: document.contentType,
    text: document.contentType.startsWith('text/') && document.contentType !== 'text/html'
      ? document.body?.textContent ?? ''
      : '',
    driveRow: location.hostname === 'drive.google.com'
      ? document.querySelector('[aria-selected="true"][data-id]')?.dataset.id
      : undefined,
  };
}

// info: the context menu's, when the click came from there. The selection may
// sit in a frame (a Gmail or Chat attachment preview), so read that frame.
async function render(tab, selectionOnly, info) {
  await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  let page = {};
  try {
    [{ result: page }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info?.frameId ?? 0] },
      func: readPage,
    });
  } catch {} // chrome:// pages, the store, file:// without file access, a frame from another origin
  // Chrome's copy of the selection is the fallback: it may lose line breaks,
  // which can break a script that uses // comments.
  if (!page.selection && info?.selectionText) page.selection = info.selectionText;
  const doc = pickSource({ ...page, url: tab.url }, { selectionOnly });
  if (!doc) return chrome.action.setBadgeText({ tabId: tab.id, text: '?' });

  const viewer = await chrome.tabs.create({ url: 'viewer.html', index: tab.index + 1, openerTabId: tab.id });
  try {
    await chrome.storage.session.set({ [docKey(viewer.id)]: doc });
  } catch (e) {
    // Session storage holds 10 MB. Say so in the tab rather than leave it waiting.
    await chrome.storage.session.set({ [docKey(viewer.id)]: { error: `Too large to hand over: ${e.message}` } });
  }
}
