# RateDrift

Track when savings bonus rates end and fixed bonds mature, see what doing nothing costs per year, check FSCS cover per banking licence, and export the deadlines to your calendar.

Everything is typed in by hand and stored on the device (localStorage on web). There is no bank connection, no rates feed and no account. It tracks what you already hold and does not recommend products.

## Develop

```bash
npm install
npx expo start --web
npm test        # node:test, Node 24
npm run lint
```

Expo SDK 57, expo-router, static web export. Pushes to `main` deploy to GitHub Pages at `/ratedrift` (see `.github/workflows/deploy-pages.yml`).

## Notes

- Money is integer pence; rates are percentages (4.75 = 4.75% AER).
- `src/lib/fscs.ts` holds the brand-to-licence table. Only groups marked `verified` were checked against a bank's own FSCS page; re-check and bump `VERIFIED_ON` when changing it.
- The post-maturity rate for fixed bonds is an assumption (`ASSUMED_POST_MATURITY_AER`), labelled as such in the UI.
