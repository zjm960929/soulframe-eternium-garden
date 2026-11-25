# Soulframe Eternium Garden

English | [中文](README.zh.md)

![Soulframe Eternium Garden home page](assets/img/readme-home.png)

A bilingual, offline-friendly Soulframe utility hub. Version **v0.1.1** ships the **World State** page: Midrath's clock, weather, Zenith's daily wares, and the Blessed Meeting.

- Live site: <https://zjm960929.github.io/soulframe-eternium-garden/>
- Source: <https://github.com/zjm960929/soulframe-eternium-garden>
- Latest release: <https://github.com/zjm960929/soulframe-eternium-garden/releases>

## Contents

- [Quick start](#quick-start)
- [GitHub Pages](#github-pages)
- [Features](#features)
- [Data and algorithms](#data-and-algorithms)
- [Localization](#localization)
- [Known limitations](#known-limitations)
- [Guide corrections](#guide-corrections)
- [Project structure](#project-structure)
- [Development](#development)
- [Browser support](#browser-support)
- [Legal notice](#legal-notice)
- [License](#license)
- [Version](#version)

## Quick start

### Open directly

Open `index.html` in a browser. All data, scripts, and portraits are local files; no server is required.

### Local preview server

Node.js 20 or newer is required for the server and test suite.

```bash
npm start
# http://127.0.0.1:4180/
```

Set `PORT` to use another port, for example `PORT=8080 npm start`.

### Tests

```bash
npm test
```

The suite uses the Node built-in test runner and has no third-party dependencies.

## GitHub Pages

The repository root is the static site and needs no build step.

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.
5. Wait for the site at `https://<user>.github.io/soulframe-eternium-garden/`.

`.nojekyll` disables Jekyll processing. The app uses hash routing and relative asset paths, so it works from a project subpath.

> GitHub Pages only serves static files. This project does not need a server or an API proxy.

## Features

### Home

A centered title, Bilibili / Douyin / GitHub / email icons, and a search box. Search filters the tool cards by name, description, and bilingual keywords. Enter opens the first visible result, Escape clears the query, and `/` focuses the search field. Cards show only an icon and title; the only entries are **World State** and the non-interactive **More tools in development** placeholder. The footer reads **Powered by DeepSeek & ZJM**.

### World State

- **World time**: the in-game clock and official phase message (`Saphene Shines`, `Mora Rises`, `Iridis Awakens`), with Saphene / Mora / Iridis in the three-cell day bar. One game day is about 48 real minutes.
- **Weather**: current weather, tier, end time and countdown, weather effects, and the next four forecast periods.
- **Zenith's wares**: four weapons per day (one bow, two melee, one magick), Arc prices, reset countdown, and a tomorrow preview.
- **Blessed Meeting**: today's ancestor, days until the next appearance, the next seven days, reset countdown, and a note about Graces and rotation. Portraits use official game assets: seven extracted from the Soulframe cache and a cropped, soft-edged Dale Seer portrait supplied by the project author.

Everything is a pure function of UTC time and changes at 00:00 UTC. Clocks and countdowns update every second; crossing midnight redraws the day's data.

### Custom module order

The World State page has a **Customize order** panel. Move the four modules with the up/down buttons; the order is stored in local storage under `sf-eg-world-layout` and can be reset. After a move, the masonry layout, DOM order, visual order, and keyboard Tab order all follow the new sequence.

### Measured masonry

The four World State modules use a 12-column grid with 8px rows rather than fixed rows:

- measure the real height of all four cards at 4/8, 5/7, and 6/6 column splits;
- choose the split with the lowest total height and the best balance;
- assign explicit `grid-row` spans so the next card in a column follows the previous one without a hole;
- recompute after resize, font load, weather refresh, phase change, and tomorrow-preview expansion;
- below 900px, fall back to a single CSS column without script intervention.

### More tools

Build simulation, materials and recipes, and an event calendar are reserved directions. The home page and header only expose a disabled **More tools in development** placeholder; no broken entries are shown.

## Data and algorithms

The algorithms are based on the Soulframe Wiki's client-reverse-engineered modules, with localization and edge-case handling:

| System | Source | Notes |
|---|---|---|
| Day/night clock | `MediaWiki:Gadget-MidrathSky.js` | Anchor 2014-02-10; 0.00833 game hours per real second |
| Weather | Same (build 2026-09-24) | 2D simplex + float32 rounding + native preset hash |
| Zenith wares | `Module:ZenithShop` | 64-bit LCG + Fisher–Yates shuffle sharing state across three pools |
| Blessed Meeting | `Module:MeetingRotationV2` | 64-bit LCG + weighted sampling; data from 2026-07-23 |

Key implementation details:

- The 64-bit LCG uses two 32-bit halves instead of `BigInt` for broader browser compatibility.
- Weather reproduction keeps every `Math.fround` rounding step and the `nativeFloor` / `Math.imul` order.
- All calculations use UTC and convert to the browser's local timezone only for display.
- No game or third-party API is requested; the tool works offline.

### Cross-check against the live wiki

On 2026-11-25 at 00:45 UTC, the wiki's `mw.midrathSky` runtime and the local implementation were compared at the same `serverNowMs`:

- `clockAt` turns / hour / phase / remaining matched exactly;
- `weatherAt` preset IDs matched exactly;
- all four forecast boundaries matched exactly.

The clock and weather algorithms therefore still match the wiki's live display.

### Portrait assets

Meeting portraits live in `assets/img/ancestors/`, with 128 and 256 variants:

- Garren Rood, Bromius, Orengall, Zenith, Tuvalkane, Verminia, Orlick: official full-body or half-body art extracted from the Soulframe `Cache.Windows` `Texture` package;
- Dale Seer: no official portrait exists in the current build, so the project uses a head-and-neck crop of a wallpaper supplied by the project author, with a transparent soft edge;
- the page uses `srcset` to choose 128 or 256 and displays the image at 52×52.

## Localization

Game names come from the official Simplified Chinese localization extracted with `ee-localization` (`Soulframe_zh_en.tsv`) and are compiled into `assets/data/game.js` by `scripts/build-data.py`:

```bash
python scripts/build-data.py --tsv /path/to/Soulframe_zh_en.tsv
```

- Weapon and character names prefer the official Simplified Chinese; the Chinese UI also shows the English name.
- `Nazilk-Urytes-III` has no entry in the current official Simplified Chinese text. The UI keeps the English name and marks it `待译` instead of inventing a translation.

## Known limitations

- **The three specific meeting Graces cannot be predicted**: they are randomized by the server and can change on relogin. The tool shows only the daily character.
- **Zenith Temper attributes cannot be predicted**: Temper is randomized separately by the game.
- **`Nazilk-Urytes-III` has no price**: the wiki's `Module:Data/Vendors` has no row for it; the UI shows a missing-price state.
- **Times depend on the device clock**: a wrong system clock directly changes the predictions.
- **Weather names are community names**: the game exposes only preset IDs; display names such as `Clear Skies` come from the wiki.
- **Meeting rotation has no predictable data before 2026-07-23**.

## Guide corrections

Compared with `Soulframe世界状态推算_复刻指南.md`, the wiki source, and the live API, the following issues were found and corrected:

1. **The melee pool has 43 entries, not 42**. The guide's list contains 43 items (matching `Module:ZenithShop`), while its comment says 42.
2. **The Python reference anchor is off by one**. The guide uses `if dayNum < 20656` and labels it 2026-07-23, but the UTC day number for 2026-07-23 is **20657**; that condition would incorrectly reject 07-23. The JavaScript `Date.UTC(2026, 6, 23) / 86400000` is correct.
3. **The weather snippet is incomplete**. The guide only includes `simplex`; `gradient`, `corner`, `perm`, and the 256-entry `PERM` table are in `Gadget-MidrathSky.js` and are ported here.
4. **The official API is not completely empty**. `https://api.soulframe.com/cdn/worldState.php` still returns `Time`, `Conquests`, `Descents`, and `WorldSeed`, but weather, Zenith wares, and the meeting character are not included. The local-prediction conclusion is unchanged; this project does not depend on that API.
5. **`Nazilk-Urytes-III` has no price data**. The guide mentions `Module:Data/Vendors`, but that table has no row for this weapon; the UI treats it as missing.

## Project structure

```text
soulframe-eternium-garden/
  index.html
  .nojekyll
  assets/
    css/site.css
    data/game.js          # generated by build-data.py
    data/ui.js            # Chinese / English UI strings
    img/ancestors/        # 8 meeting portraits, 128 / 256
    img/readme-home.png   # README screenshot
    js/core.js            # clock / weather / shop / meeting algorithms
    js/app.js             # routing, rendering, theme, language, refresh
  scripts/
    build-data.py         # build game.js from the official localization table
    serve.js              # zero-dependency static server
  test/
    core.test.js          # algorithm anchors and data integrity
    ui.test.js            # dictionary and page-key alignment
    release.test.js       # release assets, links, and version checks
  .github/workflows/test.yml
  CHANGELOG.md
  LICENSE
  NOTICE.md
  README.md
  README.zh.md
  package.json
```

## Development

```bash
npm start   # local preview
npm test    # test suite
```

`scripts/build-data.py` is only needed when updating official names, prices, or meeting weights. `scripts/serve.js` has no third-party dependencies and is only for local preview.

Releases are prepared only after all changes are complete. The version in `package.json` and the Git tag must match; the annotated tag is created on the release commit, and the release notes are bilingual.

## Browser support

Targets current evergreen browsers (recent Chrome, Edge, Firefox, and Safari) on desktop and mobile. The implementation uses:

- classic `<script>` tags rather than ES modules, so `file://` works;
- CSS custom properties, Grid, Flexbox, and `clamp()`, with light and dark token sets;
- compatibility fallbacks for `Math.fround`, `Math.trunc`, and `Math.imul`;
- no external fonts, images, or CDN resources.

## Legal notice

This is an unofficial, non-commercial fan project. It is not affiliated with, endorsed by, or sponsored by Digital Extremes. Soulframe, Warframe, Digital Extremes, and related names, game data, and game assets belong to their respective owners.

Some meeting portraits are official assets extracted from a local Soulframe game cache; the Dale Seer portrait comes from a wallpaper supplied by the project author. They are used only for non-commercial fan-tool display and are **not covered by the code license**. See [NOTICE.md](NOTICE.md) for details.

## License

The source code is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

MIT covers the source code only. Soulframe game names, data, portraits, and other game assets remain the property of their respective owners and are not licensed under MIT. See [NOTICE.md](NOTICE.md).

## Version

Current version: **0.1.1**. See [CHANGELOG.md](CHANGELOG.md) for the release history.
