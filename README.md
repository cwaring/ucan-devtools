[![UCAN Devtools](https://private-user-images.githubusercontent.com/106938/530425424-dbd1b262-f516-42f1-ac94-3a9eafbe01fa.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY3ODYwMTgsIm5iZiI6MTc2Njc4NTcxOCwicGF0aCI6Ii8xMDY5MzgvNTMwNDI1NDI0LWRiZDFiMjYyLWY1MTYtNDJmMS1hYzk0LTNhOWVhZmJlMDFmYS5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNlQyMTQ4MzhaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04YjZjYzY1NGM5ZjE2NDhjYzY5Y2Y1ZmM3NWNmYjVjN2FkOWVlNGViMWFhMzlmOGM2NjQ4NmM4MjkwODYzZmVlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.cz-Mxys7bJWMcY0x54lurRYT7gVwcfL14dVxqk9vFdw)](https://private-user-images.githubusercontent.com/106938/530425424-dbd1b262-f516-42f1-ac94-3a9eafbe01fa.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NjY3ODYwMTgsIm5iZiI6MTc2Njc4NTcxOCwicGF0aCI6Ii8xMDY5MzgvNTMwNDI1NDI0LWRiZDFiMjYyLWY1MTYtNDJmMS1hYzk0LTNhOWVhZmJlMDFmYS5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUxMjI2JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MTIyNlQyMTQ4MzhaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT04YjZjYzY1NGM5ZjE2NDhjYzY5Y2Y1ZmM3NWNmYjVjN2FkOWVlNGViMWFhMzlmOGM2NjQ4NmM4MjkwODYzZmVlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.cz-Mxys7bJWMcY0x54lurRYT7gVwcfL14dVxqk9vFdw)

# UCAN Devtools

UCAN Devtools is a browser extension that adds a DevTools panel for inspecting and debugging UCANs found in browser traffic (for example UCANs carried in request headers).

It focuses on UCAN 1.0 DAG-CBOR envelopes and supports both UCAN **delegations** and **invocations**.

**Relevant specs**
- [UCAN core spec](https://github.com/ucan-wg/spec)
- [Delegation payload](https://github.com/ucan-wg/delegation)
- [Invocation payload](https://github.com/ucan-wg/invocation)
- [UCAN HTTP Bearer Token](https://github.com/ucan-wg/ucan-http-bearer-token)

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
