import { AccountId } from '@hashgraph/sdk'

export interface MessageEntry {
  id: number
  sender: string
  content: string
  timestamp: number
  message?: string  // for backward compatibility with original interface
}

export interface ContractMessage {
  sender: AccountId
  content: string
  timestamp: Date
  id: number
}

export interface WalletState {
  isConnected: boolean
  accountId: string | null
  evmAddress: string | null
  balance: string | null
}

export interface HashConnectState {
  isInitialized: boolean
  isConnected: boolean
  accountIds: string[]
  selectedAccountId: string | null
  pairedWalletData: any | null
}

export interface TransactionResult {
  success: boolean
  transactionId?: string
  receipt?: any
  error?: string
}