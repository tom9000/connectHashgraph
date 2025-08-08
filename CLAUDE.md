# Claude Development Notes

## Quick Commands

Use these to restart or build, they will run in background (using &) and will divert warnings.

- **Restart server**: `./rp.sh`
- **Rebuild project**: `./rb.sh`

## Project Overview

This is a Hedera blockchain dApp focused on HashPack wallet connection functionality. The main goal is to achieve "legacy" HashPack UI behavior (checkboxes instead of radio buttons) with automatic wallet connection.

## Key Findings

- HashPack UI behavior depends on network type:
  - MAINNET → Checkboxes (legacy UI)
  - TESTNET → Radio buttons (new UI)

## Current Status

Working on fixing automatic pairing completion without manual account ID entry. The connection currently gets stuck on "waiting for pairing event" due to decryption errors, but has enhanced recovery mechanisms in place.

## Development Setup

- Uses HashConnect version 0.2.9 (matching HeliSwap exactly)
- Default network: mainnet (for checkbox UI)
- Enhanced debugging and recovery system implemented