# Contributing

Thank you for considering a contribution to `svelte-glyph-capacity`.

## Development

Requirements:

- Node.js 20.19 or newer
- npm
- A Chromium-compatible environment for Playwright

Set up the project:

```sh
npm install
npx playwright install chromium
npm run dev
```

Before opening a pull request, run:

```sh
npm run validate
npm pack --dry-run
```

## Pull requests

- Keep changes focused and explain user-visible behavior.
- Add or update tests for measurement and layout changes.
- Update the README for public API changes.
- Add an entry under `Unreleased` in `CHANGELOG.md`.
- Do not include generated `dist`, `build`, screenshots, or Playwright reports.

API removals, renamed exports, and changed measurement semantics are breaking changes and require a
major version after the first stable release.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
