# Hedera Hashgraph dApp Development - Project Research & Setup Guide

## Project Overview

This project aims to replicate the successful Stellar/Soroban wallet connector pattern (`connectFreighter`) for Hedera Hashgraph, leveraging HashPack wallet integration and Solidity smart contracts instead of Rust-based Soroban contracts.

**Reference Project**: `../connectFreighter` - Stellar/Soroban smart contract deployment and interaction via Freighter wallet integration on Stellar Testnet.

## Key Architecture Differences: Stellar vs Hedera

### Stellar/Soroban Stack (Reference)
- **Smart Contracts**: Rust-based Soroban contracts
- **Wallet**: Freighter browser extension
- **Network**: Stellar Testnet
- **Transaction Model**: Account-based with XDR serialization
- **SDK**: Stellar SDK v14.0.0-rc.3

### Hedera Hashgraph Stack (Target)
- **Smart Contracts**: Solidity contracts (EVM-compatible)
- **Wallet**: HashPack (native + WalletConnect integration)
- **Network**: Hedera Testnet/Mainnet
- **Transaction Model**: Account-based with protobuf serialization
- **SDK**: Hedera SDK JS v2.69.0 (latest as of 2025)

## Hedera Wallet Integration Research

### 1. HashPack Wallet - Primary Recommendation

**Why HashPack?**
- **Market Dominance**: HashPack users account for 90% of the Hedera ecosystem
- **Enterprise Adoption**: Used by LG, ServiceNow, and various banks in pilot projects
- **Multiple Integration Methods**: HashConnect library + WalletConnect support
- **Cross-Platform**: iOS, Android, and Chrome extension

### 2. Connection Technologies

#### HashConnect Library (Recommended for 2025)
- **Latest Version**: 3.0.13
- **Installation**: `npm install hashconnect`
- **Features**:
  - Open source library developed by HashPack team
  - Secure transaction signing without exposing private keys
  - QR code pairing for mobile wallets
  - Deep linking support
  - Social profile integration

#### WalletConnect Integration (Alternative)
- **Status**: Officially launched January 2024, stable in 2025
- **Benefit**: Standardized protocol supporting multiple wallets
- **Use Case**: For dApps targeting multiple wallet providers

### 3. HashConnect Implementation Pattern

```javascript
// Basic Setup
const appMetadata = {
  name: "Hedera DApp",
  description: "Hedera smart contract interaction",
  icons: ["<app-icon-url>"],
  url: "<dapp-url>"
}

// Initialize HashConnect
let hashconnect = new HashConnect(
  LedgerId.TESTNET, 
  "<walletconnect-project-id>", 
  appMetadata, 
  true // debug mode
);

// Event Handlers
hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
  // Handle connection state changes
});

hashconnect.disconnectionEvent.on((data) => {
  // Handle wallet disconnection
});

// Pairing
hashconnect.openPairingModal(); // Shows QR code/pairing code
```

## Hedera Development Tools (2025)

### 1. Hedera JavaScript SDK
- **Latest Version**: v2.69.0 (January 2025)
- **Installation**: `npm install @hashgraph/sdk`
- **Migration Note**: Transitioning to "Hiero" namespace
- **New Repository**: `hiero-ledger/hiero-sdk-js`

### 2. Hedera CLI Tool
- **Latest Version**: v0.9.0
- **Installation**: `npm install @hashgraph/hedera-cli`
- **Requirements**: Node.js LTS 16.20.2+
- **Features**:
  - Account creation and management
  - Transaction sending
  - Token management and association
  - CI/CD pipeline integration (planned)

### 3. Development Environment Options

#### Hedera Console (Browser-based)
- **Description**: Web-based IDE similar to Remix for Ethereum
- **Features**: Build, deploy, and track smart contracts directly from browser
- **Solidity Support**: Latest version (v0.8.9+)
- **EVM**: Hyperledger Besu implementation

#### Local Development Setup
```bash
# Initialize npm package
npm init

# Install dependencies
npm install @hashgraph/sdk dotenv solc

# Optional: HardHat framework
npm install --save-dev hardhat
```

## Smart Contract Development

### Solidity on Hedera
- **Language**: Solidity (same as Ethereum)
- **Version Support**: v0.8.9+ on testnet/previewnet
- **EVM**: Hyperledger Besu open-source implementation
- **Cost Advantage**: Fixed fees, lower than blockchain alternatives
- **Performance**: Second-level finality (vs block confirmation waiting)

### Development Workflow
1. **Account Setup**: Create Hedera developer portal account
2. **Testnet Access**: Use anonymous faucet for test $HBAR
3. **Smart Contract Development**: Write Solidity contracts
4. **Deployment**: Use Console, HardHat, or custom deployment scripts
5. **Frontend Integration**: Connect via HashConnect library

## Project Architecture Recommendation

Based on the `connectFreighter` reference project, the following architecture is recommended:

```
src/
├── config/
│   ├── contractConfig.ts      # Hedera network constants and contract IDs
│   └── walletConfig.ts        # HashConnect configuration
├── types/
│   ├── contractTypes.ts       # Smart contract interfaces
│   └── walletTypes.ts         # HashConnect/wallet types
├── services/
│   ├── walletService.ts       # HashConnect wallet operations
│   ├── contractService.ts     # Smart contract interactions
│   ├── transactionService.ts  # Hedera transaction handling
│   └── messageService.ts      # Contract-specific operations
└── components/
    ├── WalletConnector.tsx    # HashPack connection UI
    └── ContractInterface.tsx  # Smart contract interaction UI
```

## Network Configuration

### Testnet (Development)
- **Network ID**: Hedera Testnet
- **RPC Endpoint**: Available through Hedera SDK
- **Faucet**: Anonymous testnet faucet for $HBAR
- **Explorer**: Hedera Testnet Explorer

### Mainnet (Production)
- **Network ID**: Hedera Mainnet
- **Account Requirement**: Hedera Portal account creation
- **Cost Model**: Fixed fee structure

## Key Implementation Differences from Stellar

1. **Transaction Signing**: Use HashConnect instead of Freighter API
2. **Smart Contract Language**: Solidity instead of Rust
3. **Network Communication**: Hedera SDK instead of Stellar SDK
4. **Account Model**: Hedera account IDs instead of Stellar public keys
5. **Serialization**: Protocol Buffers instead of XDR

## Next Steps

1. **Environment Setup**:
   - Install Hedera CLI and SDK
   - Set up testnet account
   - Configure HashConnect integration

2. **Smart Contract Development**:
   - Port message storage functionality from Soroban to Solidity
   - Deploy to Hedera testnet
   - Test contract operations

3. **Frontend Integration**:
   - Implement HashConnect wallet connector
   - Adapt React components for Hedera interactions
   - Test end-to-end functionality

4. **Testing & Validation**:
   - Verify HashPack wallet integration
   - Test transaction signing and execution
   - Validate contract state changes

## Resources

- [Hedera Developer Portal](https://hedera.com/getting-started)
- [HashPack Developer Documentation](https://www.hashpack.app/developers)
- [HashConnect GitHub Repository](https://github.com/Hashpack/hashconnect)
- [Hedera Smart Contracts Tutorial](https://docs.hedera.com/hedera/tutorials/smart-contracts/deploy-your-first-smart-contract)
- [Hedera Console IDE](https://hedera.com/smart-contract) (Browser-based development)

---

*Research completed: January 2025*
*Latest tool versions verified as of research date*