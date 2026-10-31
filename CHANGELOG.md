# Changelog

All notable changes to Unescaped. The format follows Keep a Changelog, and the
versions follow Semantic Versioning.

## [Unreleased]

### Fixed
- Self-contained "standalone" bundles render. They unpack their scripts and
  frames into `blob:` URLs, which the default sandbox policy blocked, so the
  page stayed a template.
- "Render selection as HTML" works when the selection is in a frame, such as
  the attachment preview in Gmail or Google Chat.

## [0.1.0] - 2026-10-07

### Added
- Renders HTML source as a page in a new tab, from three sources in order: the
  selection, a Drive file (open or selected in a folder), or a page that is
  HTML served as plain text.
- Context menu entry "Render selection as HTML".
- Relative images and stylesheets of a raw file resolve against its URL.
- Icons, store icon, validate and package scripts.

### Changed
- Started as the prototype `drive-html-render`, which only knew about Drive.
- The `?` badge clears on the next click.
