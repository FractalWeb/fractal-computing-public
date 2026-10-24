# fractal-computing.com — site pages

The pages, styles, scripts and images of the main fractal-computing.com site, for editing. Changes are reviewed by Fractal and then published to the live site; nothing here goes live by itself.

## Preview

Needs [Node.js](https://nodejs.org) 18 or later.

```
npm install
npm run preview
```

Then open <http://localhost:8080>. Edit the files in `site/` and reload the browser.

## What's where

| File | Page |
|---|---|
| `site/index.html` | Home (`/`) |
| `site/why.html`, `how.html`, `about.html`, `benchmarks.html`, `contact.html`, `working.html` | `/why`, `/how`, `/about`, `/benchmarks`, `/contact`, `/working` |
| `site/markets.html` | The industry list (`/markets`) |
| `site/market.html` | One industry's page (`/markets/<slug>`), filled from `site/data/markets.json` |
| `site/partials/` | The head, navigation, call-to-action block and footer shared by every page |
| `site/style_site.css` | The site's stylesheet |
| `site/_site.js`, `_anim.js`, `_contact.js`, `_working.js` | Browser scripts |
| `site/images/` | Images and video |

- Pages are [EJS](https://ejs.co) templates: plain HTML plus `<% … %>` tags, eg. `<%- include('partials/_nav', {page:'home'}) %>`. Keep those tags as they are.
- In a page, stylesheets, scripts and images are referenced as `/apps/<file>` (eg. `/apps/style_site.css`, `/apps/images/…`), which is `site/<file>` here. Keep that form: it's what the live site serves.
- Inline `<script>` and `<style>` tags need `nonce="<%- env.nonce %>"`, as the existing ones have, or the live site's security policy blocks them.
- Pages must not scroll sideways on a phone (390 px wide, 320 px where possible).
- The contact form doesn't send anything in the preview; it just shows its confirmation.
- Links to the partner agreements (`/working/nda`, `/working/license`, …) aren't part of this copy, so they show "Not in this copy" in the preview.

## Sending changes

Work on a branch and open a pull request. Please ask before changing figures, performance claims or legal wording.
