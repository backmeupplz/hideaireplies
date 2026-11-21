# Hide AI Replies

A Chrome and Firefox extension that hides posts, replies, reposts and likes from AI reply bots on X. It uses the public list at [blockedforaireply.levels.io](https://blockedforaireply.levels.io/) and refreshes it every six hours. Install instructions: https://hideaireplies.borodutch.com

## Layout

- `extension/` is the whole extension, with no build step: `background.js` downloads the list into `storage.local`, and `content.js` hides every X cell whose author avatar (`UserAvatar-Container-<handle>`) is on it.
- `docs/` is the site, served by GitHub Pages from the mirror at hideaireplies.borodutch.com (Cloudflare-proxied CNAME).
- `store/` holds the store images; `scripts/cards.sh` renders them and `docs/og.png` from `store/card.html`.
- `node test.mjs` tests the list download (CI runs it). `e2e.mjs` loads the real extension into Chromium, waits for the live list and checks the hiding on a fake x.com page; run it before a release (setup line at its top). The selectors were checked by hand on live X threads.

## Releasing

1. Bump `version` in `extension/manifest.json` and merge.
2. `tea release create --repo backmeupplz/hideaireplies --tag vX.Y.Z --title vX.Y.Z` (the tag must match the manifest).

`.forgejo/workflows/release.yml` then attaches `hideaireplies.zip` to the Forgejo and GitHub releases and submits it to both stores. A newer version replaces an older one that is still waiting for review.

- **Chrome Web Store:** authenticates with Google Workload Identity Federation (repo variables `GOOGLE_WIF_PROVIDER`, `CHROME_GOOGLE_SERVICE_ACCOUNT`, `CHROME_PUBLISHER_ID`, `CHROME_ITEM_ID`). The provider only trusts release runs of this workflow on `v*` tags.
- **Firefox Add-ons:** repo secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.
- Set the repo variable `STORE_CHROME_PAUSED` or `STORE_FIREFOX_PAUSED` to `true` to skip a store.
