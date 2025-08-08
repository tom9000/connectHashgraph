import { 
  AccountId, 
  ContractExecuteTransaction, 
  ContractCallQuery,
  Hbar,
  ContractId
} from '@hashgraph/sdk'
import { walletService } from './walletService.ts'
import { createClient, CONTRACT_CONFIG } from '../config/contractConfig.ts'
import { ethers } from 'ethers'
import { MESSAGE_STORAGE_ABI } from '../config/contractAbi.ts'
import type { TransactionResult } from '../types/contractTypes.ts'

export class TransactionService {
  private client = createClient()
  private evmProvider: ethers.BrowserProvider | null = null
  private evmContract: ethers.Contract | null = null

  async executeContract(
    functionName: string, 
    parameters: any[], 
    gas: number = 100000
  ): Promise<TransactionResult> {
    // If MetaMask is connected, prefer EVM path
    const walletState = walletService.getWalletState()
    const hasMetaMask = walletState.isConnected && walletState.accountId?.startsWith('0x')

    if (hasMetaMask && CONTRACT_CONFIG.evmAddress) {
      try {
        if (!this.evmProvider) {
          const eth = (window as any).ethereum
          this.evmProvider = new ethers.BrowserProvider(eth)
        }
        if (!this.evmContract) {
          this.evmContract = new ethers.Contract(CONTRACT_CONFIG.evmAddress as string, MESSAGE_STORAGE_ABI, await this.evmProvider!.getSigner())
        }
        if (functionName === 'storeMessage') {
          // parameters[0] is ContractFunctionParameters for HAPI; extract string
          const contentParam = parameters?.[0]
          const content = (contentParam && contentParam._get ? contentParam._get?.(0) : undefined) || (typeof contentParam === 'string' ? contentParam : undefined)
          const tx = await (this.evmContract as any).storeMessage(content)
          const receipt = await tx.wait()
          return { success: true, transactionId: tx.hash, receipt }
        }
        return { success: false, error: 'Unsupported function on EVM path' }
      } catch (error) {
        console.error('EVM execution failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    // Fallback to HashConnect/HAPI path (HashPack)
    const hashConnect = walletService.getHashConnect()
    if (!hashConnect || !walletState.isConnected || !walletState.accountId) {
      throw new Error('Wallet not connected')
    }

    if (!CONTRACT_CONFIG.id) {
      throw new Error('Contract not deployed')
    }

    try {
      const accountId = AccountId.fromString(walletState.accountId)
      const contractId = ContractId.fromString(CONTRACT_CONFIG.id)
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunction(functionName, parameters)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client)

      const result = await hashConnect.sendTransaction(accountId, transaction)
      if (result.success) {
        return { success: true, transactionId: result.transactionId, receipt: result.receipt }
      }
      return { success: false, error: result.error || 'Transaction failed' }
    } catch (error) {
      console.error('Contract execution failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async queryContract(functionName: string, parameters: any[] = []): Promise<any> {
    // If MetaMask connected and EVM address present, use ethers read
    const walletState = walletService.getWalletState()
    const hasMetaMask = walletState.isConnected && walletState.accountId?.startsWith('0x')
    if (hasMetaMask && CONTRACT_CONFIG.evmAddress) {
      try {
        if (!this.evmProvider) {
          const eth = (window as any).ethereum
          this.evmProvider = new ethers.BrowserProvider(eth)
        }
        const provider = this.evmProvider
        const contract = new ethers.Contract(CONTRACT_CONFIG.evmAddress as string, MESSAGE_STORAGE_ABI, provider)
        if (functionName === 'getMessageCount') {
          const count = await (contract as any).getMessageCount()
          return { getUint256: (_i: number) => ({ toNumber: () => Number(count) }) }
        }
        if (functionName === 'getRecentMessages') {
          const countParam = parameters?.[0]
          const count = (countParam && countParam._value ? Number(countParam._value) : 10)
          const [senders, contents, timestamps, ids] = await (contract as any).getRecentMessages(count)
          const wrapBig = (arr: any[]) => arr.map((v: any) => ({ toNumber: () => Number(v) }))
          return {
            getAddressArray: (_i?: number) => senders as string[],
            getStringArray: (_i?: number) => contents as string[],
            getUint256Array: (idx: number) => (idx === 2 ? wrapBig(timestamps as any[]) : wrapBig(ids as any[]))
          }
        }
      } catch (error) {
        console.error('EVM read failed:', error)
      }
    }

    if (!CONTRACT_CONFIG.id) {
      throw new Error('Contract not deployed')
    }

    try {
      const contractId = ContractId.fromString(CONTRACT_CONFIG.id)
      
      const query = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(50000)
        .setFunction(functionName, parameters)
        .setMaxQueryPayment(new Hbar(1))

      const result = await query.execute(this.client)
      return result
    } catch (error) {
      console.error('Contract query failed:', error)
      throw error
    }
  }

  async getAccountBalance(accountId: string): Promise<string> {
    try {
      const account = AccountId.fromString(accountId)
      const balance = await this.client.getAccountBalance(account)
      return balance.hbars.toString()
    } catch (error) {
      console.error('Failed to get account balance:', error)
      return '0'
    }
  }
}

export const transactionService = new TransactionService()