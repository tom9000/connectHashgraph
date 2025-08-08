import { Client, LedgerId } from '@hashgraph/sdk'

export const NETWORK_CONFIG = {
  testnet: {
    name: 'Hedera Testnet',
    ledgerId: LedgerId.TESTNET,
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    jsonRpcUrl: 'https://testnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/testnet'
  },
  mainnet: {
    name: 'Hedera Mainnet', 
    ledgerId: LedgerId.MAINNET,
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    jsonRpcUrl: 'https://mainnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/mainnet'
  }
}

export const CURRENT_NETWORK = import.meta.env.VITE_HEDERA_NETWORK as keyof typeof NETWORK_CONFIG || 'testnet'
export const NETWORK = NETWORK_CONFIG[CURRENT_NETWORK]

export const USER_ACCOUNT = {
  id: import.meta.env.VITE_HEDERA_ACCOUNT_ID,
  checksum: import.meta.env.VITE_HEDERA_ACCOUNT_CHECKSUM,
  evmAddress: import.meta.env.VITE_HEDERA_EVM_ADDRESS
}

export const CONTRACT_CONFIG = {
  id: import.meta.env.VITE_CONTRACT_ID,
  evmAddress: import.meta.env.VITE_CONTRACT_EVM_ADDRESS
}

export const createClient = () => {
  return Client.forName(CURRENT_NETWORK)
}