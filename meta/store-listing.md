# Chrome Web Store: listing copy and submission answers

Everything the dashboard asks for, written out, so that submission is a paste
job. Screenshots and promo tiles do not exist yet; they need real captures.

---

## Item name

    Unescaped - Render HTML Source as a Page

## Short description (132 characters max, this is 113)

    Opens HTML source as a working page in a new tab: a selection, a raw .html file, or an HTML file in Google Drive.

## Category

    Developer Tools

## Language

    English

## Homepage URL

    https://github.com/john-athan/unescaped

## Support URL

    https://github.com/john-athan/unescaped/issues

## Mature content

    No

---

## Detailed description

Unescaped opens HTML source as the page it describes, in a new tab, with its
scripts running.

Google Drive shows an .html file as its source. So does a raw GitHub link, a
gist, or a code block someone pasted into a chat. Press Alt+Shift+H, or click
the icon, and the page opens next to it.

WHERE THE HTML COMES FROM

• Your selection, on any page, if it contains HTML
• The HTML file open in Google Drive, or the one selected in a Drive folder
• A page that is HTML shown as plain text, with its relative images and
  stylesheets resolved against its own address
• Right click any selection for "Render selection as HTML"

WHAT IT DOES NOT DO

The rendered page runs in a sandbox with an opaque origin. It cannot reach the
extension, your Drive session, or the page it came from. Scripts from other
servers are blocked there, inline scripts run.

Outside Google Drive it reads a tab only when you press the button. It has no
analytics, no account, no remote configuration and no bundled libraries. The
source is on GitHub under MIT.

---

## Single purpose statement

Unescaped renders HTML source the user points at (a selection, a Drive file, or
a plain text page) as a web page in a new tab. That is its only function.

---

## Permission justifications

One per permission in the manifest. CI fails if this list and the manifest stop
agreeing.

**activeTab**
When the user clicks the button, the extension reads the selection or the plain
text of the tab they clicked on. activeTab grants that only for that tab and
only after the click, so the extension needs no access to all sites.

**scripting**
A single function is injected into the clicked tab to read the selection, the
document's content type and text, and in Drive the id of the selected file. It
runs once per click and changes nothing on the page.

**storage**
Session storage hands the HTML from the service worker to the viewer tab that
renders it. Each entry is removed when its viewer tab closes, and session
storage is cleared when the browser quits. Nothing is synced or persisted.

**contextMenus**
Adds one entry, "Render selection as HTML", to the menu shown on selected text.

**Host**
drive.google.com and drive.usercontent.google.com: the viewer downloads the
HTML file the user is looking at in Drive, with the user's own Drive session,
because Drive will not hand the file over otherwise. No other Drive data is
read, and nothing is sent anywhere.

**Remote code**
None. The extension's own code is all in the package. The HTML the user asks to
render runs in a manifest-declared sandbox page with an opaque origin and no
extension APIs.

---

## Data usage disclosures

| Question | Answer |
|---|---|
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | No |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No. The HTML is rendered locally and never transmitted |

Certifications: tick all three.

Privacy policy URL: https://john-athan.github.io/unescaped/privacy-policy.html

---

## Assets

| Asset | Size | File |
|---|---|---|
| Store icon | 128 x 128 | `screenshots/store-icon.png` |
| Screenshots | 1280 x 800 | not made yet |
| Small promo tile | 440 x 280 | not made yet |
