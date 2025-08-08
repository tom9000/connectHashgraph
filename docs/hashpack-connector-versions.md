# HashPack Connector Versions Analysis

## Overview
This document analyzes different HashConnect versions and their impact on HashPack wallet connection behavior, based on testing various dApps and HashConnect library versions.

## HashConnect Version History

### HashConnect v3.x.x (Latest - 3.0.13)
**Status**: Current/Modern
**Connection Method**: WalletConnect v2 + HashPack extension integration
**Console Signature**: 
```
HASHCONNECT2 - Initializing
The configured WalletConnect 'metadata.url'
HASHCONNECT2 - Found X walletconnect sessions
```
**Behavior**:
- Shows 2 popups: WalletConnect modal + HashPack extension popup
- Uses WalletConnect protocol with project ID requirement
- Modern HashPack extension interface with wallet selection modal
- Often results in "Unauthorized: invalid key" errors due to WalletConnect complexity

### HashConnect v0.2.4 (Middle Generation)
**Status**: Transitional
**Connection Method**: Direct extension connection with event-driven API
**Console Signature**:
```
2025-08-07T08:16:31.257Z INFO HASHCONNECT2 - Found 2 walletconnect sessions
HASHCONNECT2 - Showing pairing string entry modal
```
**Behavior**:
- Still triggers "HASHCONNECT2" logs (hybrid approach)
- Uses `connectToLocalWallet()` method
- Has `pairingEvent` and `connectionStatusChangeEvent`
- Modern HashPack extension popup (not the legacy version we want)
- Single popup but still uses newer HashPack interface

### HashConnect v0.2.0 (Tested - Still Modern)
**Status**: Still uses modern protocol
**Connection Method**: Similar to v0.2.4
**Console Signature**:
```
2025-08-07T08:44:16.888Z INFO HASHCONNECT2 - Showing pairing string entry modal
HASHCONNECT2 - Found 2 walletconnect sessions
HASHCONNECT2 - Cleaning up pairing component
```
**Behavior**:
- **Still shows "HASHCONNECT2" logs** ❌
- Modern HashPack extension popup with wallet selection modal
- Same behavior as SaucerSwap's broken "HashPack" button
- **Not the legacy version we need**

### HashConnect v0.1.10 (Too Old)
**Status**: Ancient/Manual Pairing
**Connection Method**: Manual pairing string entry
**Console Signature**:
```
HASHCONNECT2 - Showing pairing string entry modal
INFO Checking for queued hashconnect messages
```
**Behavior**:
- Still shows "HASHCONNECT2" in logs
- Requires manual "Enter Pairing String" input
- Not the automatic extension connection we need
- Too old for modern HashPack extension integration

## Production dApp Analysis

### SaucerSwap (app.saucerswap.finance)
**HashPack Button**: ❌ Does not work
**HashPack Legacy Button**: ✅ Works perfectly
- Single popup with direct HashPack extension connection
- No "HASHCONNECT2" logs in console
- Automatic connection without manual pairing strings
- Works with both mainnet and testnet accounts

### HeliSwap (app.heliswap.io)  
**Connection Method**: Single method (equivalent to SaucerSwap Legacy)
- Only offers one HashPack connection option
- Same behavior as SaucerSwap Legacy
- Single popup, direct extension connection
- No WalletConnect complexity

### Target Behavior (What We Want)
Based on testing, the ideal "Legacy" connection should:
1. **Single popup only** (no WalletConnect modal)
2. **Direct HashPack extension connection**
3. **No "HASHCONNECT2" logs** in console
4. **Automatic pairing** (no manual string entry)
5. **Works with mainnet accounts**
6. **Simple, reliable connection flow**

## Console Log Signatures

### Modern HashPack (Unwanted)
```javascript
2025-08-07T08:16:29.036Z INFO Initializing Hashpack init service
HASHCONNECT2 - Creating new SignClient  
The configured WalletConnect 'metadata.url':https://hashpack.app differs from the actual page url
HASHCONNECT2 - Found 2 walletconnect sessions
HASHCONNECT2 - Showing pairing string entry modal
```

### Legacy HashPack (Desired - Unknown Version)
```javascript
// Should NOT contain:
// - "HASHCONNECT2" references
// - WalletConnect metadata warnings  
// - Pairing string entry modals
// - SignClient initialization

// Should contain:
// - Direct extension connection logs
// - Simple pairing events
// - Minimal initialization
```

## HashConnect API Differences

### v3.x.x API
```javascript
new HashConnect(network, projectId, metadata, debug)
hashConnect.openPairingModal()
```

### v0.2.4 API  
```javascript
new HashConnect()
await hashConnect.init(appMetadata, "testnet", true)
hashConnect.connectToLocalWallet()
hashConnect.pairingEvent.on(callback)
hashConnect.connectionStatusChangeEvent.on(callback)
```

### v0.1.10 API
```javascript
new HashConnect()  
await hashConnect.init(appMetadata)
hashConnect.connectToLocalWallet('')
hashConnect.pairingEvent.on(callback)
hashConnect.connectionStatusChange.on(callback)
```

## Next Steps

1. **Find the correct HashConnect version** that SaucerSwap Legacy uses
   - Likely between v0.1.10 and v0.2.4
   - Possibly v0.1.x or v0.2.x variants
   - May need to test v0.1.5, v0.1.6, v0.1.7, v0.1.8, v0.1.9

2. **Key indicators for correct version**:
   - No "HASHCONNECT2" in console logs
   - No pairing string entry modal
   - Direct HashPack extension popup
   - Single-step connection flow

3. **Testing methodology**:
   - Install version, test connection
   - Check console for "HASHCONNECT2" presence  
   - Verify popup behavior matches SaucerSwap Legacy
   - Test with mainnet account

## Conclusion

The goal is to find the HashConnect version that produces the same behavior as:
- SaucerSwap's "HashPack Legacy" button ✅
- HeliSwap's single HashPack connection ✅

And avoid the behavior of:
- SaucerSwap's "HashPack" button ❌
- Our current implementations (all showing "HASHCONNECT2") ❌

The correct version likely exists in the v0.1.x or early v0.2.x range and should provide direct HashPack extension integration without WalletConnect complexity or manual pairing requirements.