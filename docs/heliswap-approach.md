# HeliSwap Approach: Getting HashPack “Legacy” Flow Working Reliably

This doc captures a minimal set of changes to mirror HeliSwap’s stable HashPack connection behavior using hashconnect@0.2.9.

## Target behavior
- Single HashPack extension popup (no WalletConnect modal)
- No pairing string entry UI
- `pairingEvent` fires, `savedPairings[0]` populated
- Works on mainnet; UI shows legacy checkboxes

## Steps to align with HeliSwap

1) Use hashconnect@0.2.9 (exact, no caret)
- Pin dependency: "hashconnect": "0.2.9"
- Reinstall dependencies after changing version

2) Minimal App Metadata (no URL)
- Send only: name, description, icon
- Do not include `url` in metadata to avoid any origin/encoding mismatches

3) Event order and init parameters
- Create single instance: `new HashConnect(true)`
- Register event listeners BEFORE calling `init(...)`
- Call `init(appMetadata, 'mainnet', false)` exactly
- Do not call `localStorage.clear()` around pairing
- Then call `connectToLocalWallet()` once

4) Production-like or HMR-free environment
- Use `npm run build && npm run preview` or disable HMR in dev
- Ensure a single tab/session, avoid reloading during handshake

5) Recovery (fallback only)
- If `pairingEvent` is missing but connection status becomes Paired, call `getPairingByTopic(topic)`
- Optionally perform a per-topic soft reset and retry once

6) Keep wallet clean
- In the extension, clear stale/walletconnect sessions before testing
- Try a fresh ngrok subdomain when debugging origin-specific issues

## Optional
- Use a data URI for the icon to avoid fetch/CSP races
- Toggle `init` 3rd param to `true` only as a strict A/B if 2)–4) fail

## Reference code locations
- references/HeliSwap-frontend/src/connectors/hashconnect.ts
- references/HeliSwap-frontend/src/providers/Global.tsx
- references/multi-wallet-hedera-transfer-dapp-js/src/services/wallets/hashconnect/hashconnectClient.jsx

## Our implementation checkpoints
- Pin hashconnect to 0.2.9
- Build appMetadata from env/origin without `url`
- Register listeners first, `init(..., false)`, then `connectToLocalWallet()`
- Add connectionStatusChangeEvent fallback → `getPairingByTopic(topic)`
- Disable HMR during tests; prefer preview build + ngrok
