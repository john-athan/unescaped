// Which source a click picks. The part that can go wrong while looking like it
// worked: render the wrong thing, or nothing, on a page that had HTML on it.
//
// Run directly (`node test.js`), through `tools/validate.sh`, or from CI.

const assert = require('node:assert/strict');
const { looksLikeHtml, driveFile, withBase, pickSource } = require('./sources.js');

let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log(`  ok ${name}`); };

const PAGE = '<!doctype html><title>t</title><p>hi</p>';

check('a doctype or a closing tag is HTML', () => {
  assert.ok(looksLikeHtml('<!DOCTYPE html>'));
  assert.ok(looksLikeHtml('<b>bold</b>'));
  assert.ok(looksLikeHtml('<my-widget>x</my-widget >'));
});

check('generics, comparisons and prose are not', () => {
  assert.ok(!looksLikeHtml('List<String> xs = new ArrayList<>();'));
  assert.ok(!looksLikeHtml('if (a < b && c > d) {}'));
  assert.ok(!looksLikeHtml('just words'));
  assert.ok(!looksLikeHtml(undefined));
});

check('a Drive file id comes from the open file first', () => {
  assert.deepEqual(driveFile('https://drive.google.com/file/d/abc_-1/view', 'row'), { id: 'abc_-1', user: '0' });
});

check('then from the selected row in a Drive folder', () => {
  assert.deepEqual(driveFile('https://drive.google.com/drive/u/2/folders/f', 'row9'), { id: 'row9', user: '2' });
  assert.deepEqual(driveFile('https://drive.google.com/drive/folders/f?authuser=1', 'r'), { id: 'r', user: '1' });
});

check('no Drive file anywhere else, or with an id that is not one', () => {
  assert.equal(driveFile('https://example.com/file/d/abc/view', 'row'), null);
  assert.equal(driveFile('https://drive.google.com/drive/folders/f', undefined), null);
  assert.equal(driveFile('https://drive.google.com/drive/folders/f', 'a/b'), null);
  assert.equal(driveFile('not a url', 'row'), null);
});

check('the base goes after the doctype, so the page stays in standards mode', () => {
  assert.equal(withBase(PAGE, 'https://x/a.html'), '<!doctype html><base href="https://x/a.html"><title>t</title><p>hi</p>');
  assert.equal(withBase('<p>x</p>', 'https://x/'), '<base href="https://x/"><p>x</p>');
});

check('the base href cannot break out of its attribute', () => {
  assert.equal(withBase('', 'https://x/?a="b"&c'), '<base href="https://x/?a=&quot;b&quot;&amp;c">');
});

check('an HTML selection wins over everything else on the page', () => {
  const page = { url: 'https://drive.google.com/file/d/abc/view', selection: '<i>x</i>' };
  assert.deepEqual(pickSource(page), { html: '<i>x</i>' });
});

check('a selection that is not HTML does not hide the Drive file', () => {
  const page = { url: 'https://drive.google.com/file/d/abc/view', selection: 'some words' };
  assert.deepEqual(pickSource(page), { drive: { id: 'abc', user: '0' } });
});

check('a raw text page is rendered with its own URL as the base', () => {
  const page = { url: 'https://raw.githubusercontent.com/o/r/main/a.html', contentType: 'text/plain', text: PAGE };
  assert.equal(pickSource(page).html, withBase(PAGE, page.url));
});

check('a page that is already HTML, or text that is not, gives nothing', () => {
  assert.equal(pickSource({ url: 'https://x/', contentType: 'text/html', text: PAGE }), null);
  assert.equal(pickSource({ url: 'https://x/a.txt', contentType: 'text/plain', text: 'notes' }), null);
  assert.equal(pickSource({ url: 'chrome://extensions/' }), null);
});

check('the context menu renders any selection, and only the selection', () => {
  assert.deepEqual(pickSource({ selection: '<img src=x>' }, { selectionOnly: true }), { html: '<img src=x>' });
  assert.equal(pickSource({ url: 'https://drive.google.com/file/d/abc/view', selection: ' ' }, { selectionOnly: true }), null);
});

console.log(`${checks} checks passed`);
