# Ezra Gray — site

A long-scroll image feed with no dates, no show titles, no archive logic.
Add images to `Image/`, name them with a leading number, push. That's it.

## How it works

- `Image/` holds your pictures. Name them so the order you want reads as a
  number at the start of the filename: `1.jpg`, `2-window.jpg`, `3.webp`...
  Numbers don't need to be padded or sequential without gaps — `2` will
  always come before `10`.
- `generate-manifest.js` scans that folder and writes `manifest.json`, a
  plain ordered list of filenames. This runs automatically every time you
  deploy (see below) — you never touch this file or run it by hand.
- `index.html` reads `manifest.json` and builds the feed, image by image,
  full width, no captions.
- `text/statement.txt` is your artist text. Edit it directly — plain text,
  blank lines become paragraph breaks. The "TXT" link at the bottom of the
  feed leads to `text.html`, which just displays it.
- The "Ezra Gray" name and "TXT" link sit fixed in the bottom-left corner,
  level, always visible while scrolling.

## Day-to-day use

1. Drag new images into `Image/`, with a leading number for ordering.
   Removing or renaming files works the same way — the feed always reflects
   whatever is in the folder at the next deploy.
2. Push / redeploy (however you already do that for this repo).
3. The manifest rebuilds itself and the feed updates. No HTML or JS editing,
   ever.

To change the text, edit `text/statement.txt` and redeploy — no rebuild step
needed for that one, it's just read directly.

## One-time setup, by host

You only need to do ONE of these, whichever you're using.

### Netlify
`netlify.toml` is already set up. Connect the repo in Netlify, leave the
build settings as detected — it'll run `node generate-manifest.js` before
every publish.

### Vercel
`vercel.json` is already set up the same way. Import the repo in Vercel and
deploy — no extra configuration needed.

### GitHub Pages
`.github/workflows/deploy.yml` is already set up. In your repo's
**Settings → Pages**, set the source to **GitHub Actions**. Every push to
`main` will regenerate the manifest and publish automatically.

## Testing locally (optional)

If you want to preview before pushing:

```
node generate-manifest.js
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. (Opening `index.html`
directly by double-clicking won't work — the `fetch` calls need a server,
even a local one.)
