// Where the HTML comes from. Pure functions, so test.js can run them under node.
//
// One click, three places, first match wins:
//   1. the text you selected, if it is HTML
//   2. the Drive file you are looking at, open or selected in the list
//   3. a page that is HTML shown as plain text (raw GitHub, a gist, a bucket)

// A closing tag or a doctype. An opening tag alone is not enough: generic code
// (List<String>) has those too, and only HTML closes them.
function looksLikeHtml(text) {
  return typeof text === 'string' && /<!doctype\s+html|<\/[a-z][\w-]*\s*>/i.test(text);
}

function driveFile(url, selectedRowId) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.hostname !== 'drive.google.com') return null;
  const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? selectedRowId;
  if (!id || !/^[\w-]+$/.test(id)) return null;
  const user = u.pathname.match(/\/u\/(\d+)\//)?.[1] ?? u.searchParams.get('authuser') ?? '0';
  return { id, user };
}

// A raw file's relative images and stylesheets resolve against where it came
// from, not against the extension. After the doctype, or the page drops into
// quirks mode.
function withBase(html, base) {
  const tag = `<base href="${base.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
  const doctype = html.match(/^\s*<!doctype[^>]*>/i);
  return doctype ? doctype[0] + tag + html.slice(doctype[0].length) : tag + html;
}

// page: { url, selection, contentType, text, driveRow }, as readPage returns it.
// selectionOnly: the context menu, where the user has already said "this".
function pickSource(page, { selectionOnly = false } = {}) {
  const selection = page.selection || '';
  if (selectionOnly) return selection.trim() ? { html: selection } : null;
  if (looksLikeHtml(selection)) return { html: selection };

  const drive = driveFile(page.url, page.driveRow);
  if (drive) return { drive };

  if (/^text\/(?!html\b)/.test(page.contentType || '') && looksLikeHtml(page.text)) {
    return { html: withBase(page.text, page.url) };
  }
  return null;
}

if (typeof module !== 'undefined') module.exports = { looksLikeHtml, driveFile, withBase, pickSource };
