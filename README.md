# Hedera HashPack Connector

A complete reference implementation demonstrating Hedera smart contract deployment and interaction via HashPack wallet integration on Hedera Testnet.

## Overview

This project serves as a comprehensive guide for developers building Hedera smart contracts with HashPack wallet integration. It demonstrates the complete workflow from contract development to frontend integration with real blockchain transactions.

## Features

- ✅ **Solidity Smart Contract** - Message storage with CRUD operations
- ✅ **HashPack Wallet Integration** - HashConnect library connectivity  
- ✅ **Real Blockchain Transactions** - Live Hedera Testnet deployment
- ✅ **Modern React Frontend** - TypeScript + Vite with hot reload
- ✅ **Professional Architecture** - Modular services and clean code structure
- ⏳ **Automated Deployment** - Contract deployment scripts (coming soon)
- ⏳ **Explorer Integration** - Direct blockchain verification links

## Quick Start

### Prerequisites
```bash
# Node.js 18+ required
# Create WalletConnect Project ID at https://cloud.walletconnect.com
# Set up Hedera Testnet account
```

### Development
```bash
# Install dependencies
pnpm install

# Configure environment
cp .env .env.local
# Edit .env.local with your WalletConnect Project ID

# Start development server
pnpm run dev          # Standard start (port 3012)
# OR
./rp.sh             # Restart with cleanup

# Build project
pnpm run build        # Standard build
# OR
./rb.sh             # Build with error logging

# Type checking
pnpm run typecheck
```

### Environment Configuration

Update `.env.local` with your settings:
```env
# Your testnet account (already configured)
VITE_HEDERA_ACCOUNT_ID=0.0.6509839
VITE_HEDERA_ACCOUNT_CHECKSUM=0.0.6509839-xqicv
VITE_HEDERA_EVM_ADDRESS=0xfbe164453f13012818ab1bcfb8a24b2788590ed7

# Get from https://cloud.walletconnect.com
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract addresses (populated after deployment)
VITE_CONTRACT_ID=
VITE_CONTRACT_EVM_ADDRESS=
```

## Tech Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite 7.0** for fast development  
- **Hedera SDK v2.69** for blockchain interactions
- **HashConnect v3.0** for wallet integration

### Smart Contract
- **Solidity ^0.8.9** message storage contract
- **Hedera Smart Contract Service** with EVM compatibility
- **Hyperledger Besu** as the execution environment

## Architecture

```
src/
├── config/
│   ├── contractConfig.ts      # Hedera network constants and contract IDs
│   └── walletConfig.ts        # HashConnect configuration
├── types/
│   └── contractTypes.ts       # TypeScript interfaces  
├── services/
│   ├── walletService.ts       # HashConnect wallet operations
│   ├── transactionService.ts  # Hedera transaction handling
│   ├── messageService.ts      # Contract operations
│   └── contractService.ts     # Main orchestrator
├── components/
│   ├── WalletConnector.tsx    # HashPack connection UI
│   └── ContractInterface.tsx  # Smart contract interaction UI
└── App.tsx                    # Main React application
```

## Smart Contract Functions

The `MessageStorage.sol` contract provides:
- `storeMessage(string)` - Store a message on-chain
- `getMessageCount()` - Get total message count
- `getMessage(uint256)` - Retrieve specific message
- `getRecentMessages(uint256)` - Get list of recent messages
- `getUserMessages(address)` - Get messages by user
- `getUserMessageCount(address)` - Get user's message count

## Network Configuration

- **Network**: Hedera Testnet
- **Mirror Node**: `https://testnet.mirrornode.hedera.com`
- **JSON RPC**: `https://testnet.hashio.io/api`
- **Explorer**: [HashScan Testnet](https://hashscan.io/testnet)

## Development Workflow

1. **Connect HashPack Wallet** - Browser extension or mobile pairing
2. **Enter Message** - Type message in input field
3. **Sign Transaction** - HashPack prompts for approval
4. **View Results** - Message appears in recent messages list
5. **Verify on Explorer** - Click link to view on blockchain

## Next Steps

1. **Deploy Smart Contract**:
   - Compile `contracts/MessageStorage.sol`
   - Deploy to Hedera Testnet
   - Update `.env` with contract addresses

2. **Get WalletConnect Project ID**:
   - Register at [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Create new project
   - Copy Project ID to `.env`

3. **Test Integration**:
   - Start development server
   - Connect HashPack wallet
   - Test message storage functionality

## Project Structure Comparison

This project follows the same architectural patterns as `../connectFreighter` but adapted for Hedera:

| Component | Stellar/Soroban | Hedera/Solidity |
|-----------|----------------|-----------------|
| Language  | Rust           | Solidity        |
| Wallet    | Freighter      | HashPack        |
| Library   | Stellar SDK    | Hedera SDK      |
| Network   | Stellar        | Hedera          |
| Connection| Freighter API  | HashConnect     |

## Documentation

- **[Project Research](docs/project.md)** - Comprehensive implementation research
- **[Hedera Documentation](https://docs.hedera.com/)** - Official Hedera guides
- **[HashPack Documentation](https://www.hashpack.app/developers)** - Wallet integration
- **[HashConnect GitHub](https://github.com/Hashpack/hashconnect)** - Library documentation

## License

MIT License - See [LICENSE](LICENSE) for details

## Contributing

Contributions welcome! This project serves as a reference implementation for the Hedera developer community.

---

**Built with ❤️ for the Hedera ecosystem**