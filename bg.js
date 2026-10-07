// File id: from /file/d/<id> URLs, else from the selected row behind the Drive preview overlay.
chrome.action.onClicked.addListener(async (tab) => {
  let id = tab.url?.match(/\/file\/d\/([\w-]+)/)?.[1];
  if (!id) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.querySelector('[aria-selected="true"][data-id]')?.dataset.id,
      });
      id = result;
    } catch {}
  }
  if (!id) return chrome.action.setBadgeText({ tabId: tab.id, text: '?' });
  const user = tab.url.match(/\/u\/(\d+)\//)?.[1] ?? '0';
  chrome.tabs.create({ url: `viewer.html?id=${id}&authuser=${user}`, index: tab.index + 1 });
});
