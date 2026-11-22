# Third-party material in Unescaped

Unescaped is MIT licensed and its source was written for this project. This file
records anything that came from elsewhere.

## Dependencies

None. The extension is plain HTML and JavaScript against the Chrome extension
APIs, and ships no bundled library. There is no `package.json`, no lockfile and
no build step.

## Icons and screenshots

`src/icons/`, `docs/`, `meta/` and `screenshots/` were produced for this project.
`tools/render-assets.sh` shells out to the Chrome binary already on the machine to
rasterise them; none of Chrome's code is in this repository.
