# Changelog

All notable changes to this project will be documented in this file.

## 0.1.4 - 2026-11-27

### Added

- Temper Compendium at #/temper with all 42 current Tempers, icons, origin frames, names, applicable weapon icons, and official descriptions.
- Origin and applicable-weapon filters with combined filtering, empty state, and reset.
- Six origin frames, six origin icons, eight combat-art icons, and 42 Temper icons.

### Changed

- Temper cards are compact and equal-sized, and use weapon-type icons with hover labels.
- The site shell uses a fixed wide layout; the Temper grid uses the available screen width.
- Home tool cards are 184px squares with icons above titles; the home group is vertically centered when space allows and stays fixed while filtering.
- The native search clear button is suppressed in favor of the page clear control.
- The header nav entry is now 淬炼大全; the World State eyebrow is now WORLDSTATE.
- World State now uses #/live; legacy #/world is removed without a redirect and resolves to the not-found page.
- The hidden #/more page and placeholder feature cards were removed; #/more resolves to the not-found page.

## 0.1.3 - 2026-11-26

### Added

- Drag-and-drop reordering for World State modules and the layout list, with mouse, touch, and keyboard `Alt + Arrow` support.
- Per-module width menus (`Auto / 1/3 / 1/2 / 2/3 / Full`) stored in `sf-eg-world-layout-widths`, with a width-aware skyline layout.

### Changed

- Removed the up/down arrow buttons; the whole layout row or module is draggable.
- Other modules animate to their new positions with a 240ms FLIP transition, skipped under `prefers-reduced-motion`.
- The dragged node stays in the DOM; no duplicate drag clone is created.
- Removed 40 unused UI strings and obsolete CSS selectors; audited assets, duplicates, temporary files, and runtime errors.

## 0.1.2 - 2026-11-26

### Changed

- Replaced the header language and theme dropdowns with segmented switch controls.
- Language now sits on the left and theme on the right; both keep their existing persistence and accessibility labels.
- Refreshed the README screenshot and listed the switch behavior in both README versions.

## 0.1.1 - 2026-11-26

### Added

- GitHub project and email icons in the header and the home page social row.
- Bilingual README pair: `README.md` (English) and `README.zh.md` (Chinese).

### Changed

- World State header: removed the descriptive lede and the two status chips; local and UTC clocks now sit directly below the page heading.
- Release documentation now follows the bilingual README structure.

## 0.1.0 - 2026-11-26

First public-ready release.

### Added

- Bilingual Chinese / English interface with browser-persisted language selection.
- Light, dark, and follow-system themes with browser-persisted selection.
- World State page with Midrath game clock, weather and forecast, Zenith daily wares, and the Blessed Meeting.
- Official ancestor portraits: seven extracted from the Soulframe game cache, plus a cropped and soft-edged Dale Seer portrait.
- Custom world-module ordering with local storage persistence.
- Measured two-column masonry layout for the four world-state modules.
- Searchable home page with Bilibili and Douyin links.
- Deterministic offline algorithms for the clock, weather, Zenith shop, and meeting rotation.
- Zero-dependency local preview server and Node built-in test suite.
- MIT License for the source code; game assets are excluded and documented in `NOTICE.md`.

### Changed

- Home page follows a centered, minimal layout: title, social links, search, and two tool entries.
- Header navigation only exposes the implemented pages and a disabled "more tools in development" label.
- Footer is reduced to "Powered by DeepSeek & ZJM".
- Douyin profile URL now uses the correctly cased account ID.

### Known limitations

- The three meeting Graces and Zenith Temper attributes are server-random and cannot be predicted.
- `Nazilk-Urytes-III` has no official Simplified Chinese name or price entry yet.
- Times depend on the device clock.
- Meeting rotation has no predictable data before 2026-07-23.
