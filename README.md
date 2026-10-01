# Aprobado por Chayanne

Edge/Chrome extension: every time you confirm a merge on GitHub, Chayanne approves it on screen.

## Install (Edge)

1. Put the meme image in `images/` named `chayanne.gif` (or `.png`, `.jpg`, `.webp`). Several at once are mixed together.
2. Open `edge://extensions` (Chrome: `chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this folder.

Without an image it still works and shows an "Aprobado por Chayanne" stamp instead.

## Try it

Open any `github.com` page and click the extension icon in the toolbar. On a pull request it fires on
**Confirm merge**, **Confirm squash and merge**, **Confirm rebase and merge**, **Merge when ready** and
**Add to merge queue**.

After changing an image, press the reload arrow on the extension card and refresh the GitHub tab.

Sound and timings are constants at the top of `content.js`.
