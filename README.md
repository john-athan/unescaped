<img src="icons/icon128.png" width="72" alt="Unescaped">

# Unescaped

**Opens HTML source as a working page, in a new tab.** Select some HTML on any
page, open a raw `.html` file, or open an HTML file in Google Drive, and press
<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd>.

Drive shows an `.html` file as its source. So does a raw GitHub link, a gist,
or a code block in a chat. Unescaped shows you the page that source describes,
with its scripts running.

## Install

Load it from source, on Chrome 116 or newer:

1. `git clone https://github.com/john-athan/unescaped`
2. Open `chrome://extensions`, turn on **Developer mode**
3. **Load unpacked**, and pick the repo folder
4. Pin the toolbar icon, or use <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>H</kbd>

## Where the HTML comes from

One click, first match wins:

| | Source | How |
|---|---|---|
| 1 | **Your selection**, if it contains HTML | Read from the page you clicked on |
| 2 | **A Drive file**, open or selected in a folder | Downloaded with your own Drive session |
| 3 | **A page of HTML shown as text** (raw GitHub, gists, buckets) | Read from the page, relative links resolve against its URL |

Nothing found shows a `?` on the icon. Right click a selection for **Render
selection as HTML**, which renders it whether or not it looks like HTML.

## What it does not do

- **No scripts from other servers.** The page runs in a sandboxed frame whose
  policy allows inline scripts only, so `<script src="https://cdn...">` is
  blocked. Images and stylesheets from anywhere load.
- **No files next to a Drive file.** A Drive file has no folder URL its
  relative links could resolve against.
- **No `chrome://` pages or the Web Store**, which no extension may read. Local
  `file://` pages work after you turn on *Allow access to file URLs*.
- **No access to anything you did not click on.** Outside Drive it reads a tab
  only when you press the button, through `activeTab`.

The rendered page gets an opaque origin: it cannot reach the extension, your
Drive session, or the page it came from.

## Development

```sh
tools/validate.sh          # every check CI runs, run locally
tools/render-assets.sh     # icons/ and the store icon, from meta/*.svg
oss check unescaped        # the same thing, through the fleet tool
oss release unescaped      # cut a release, stopping before the push
```

`sources.js` decides what a click renders and is pure, so `test.js` runs it
under node. No dependencies, no build step.

## License

MIT. See [LICENSE](LICENSE).
