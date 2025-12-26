# UCAN Devtools

UCAN Devtools is a browser extension that adds a DevTools panel for inspecting and debugging UCANs found in browser traffic (for example UCANs carried in request headers).

It focuses on UCAN 1.0 DAG-CBOR envelopes and supports both UCAN **delegations** and **invocations**.

**Relevant specs**
- UCAN core spec: https://github.com/ucan-wg/spec
- Delegation payload: https://github.com/ucan-wg/delegation
- Invocation payload: https://github.com/ucan-wg/invocation
- UCAN HTTP Bearer Token: https://github.com/ucan-wg/http-bearer-token

## Getting started

### Prerequisites
- Node.js
- pnpm

### Install deps
- `pnpm install`

### Build
- Chrome (MV3): `pnpm build`
  - Output: `.output/chrome-mv3`
- Firefox (MV2): `pnpm build:firefox`
  - Output: `.output/firefox-mv2`

### Install locally

#### Chrome
1. Run `pnpm build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select `.output/chrome-mv3`

#### Firefox
1. Run `pnpm build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…**
4. Select `.output/firefox-mv3/manifest.json`

### Dev (optional)
- Chrome: `pnpm dev`
- Firefox: `pnpm dev:firefox`

### Package (optional)
- Chrome zip: `pnpm zip`
- Firefox zip: `pnpm zip:firefox`

## License

[MIT](./LICENSE.md) © 2025 [Chris Waring](https://github.com/cwaring)
