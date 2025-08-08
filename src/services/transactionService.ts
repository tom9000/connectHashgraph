import { 
  AccountId, 
  ContractExecuteTransaction, 
  ContractCallQuery,
  Hbar,
  ContractId
} from '@hashgraph/sdk'
import { walletService } from './walletService.ts'
import { createClient, CONTRACT_CONFIG } from '../config/contractConfig.ts'
import type { TransactionResult } from '../types/contractTypes.ts'

export class TransactionService {
  private client = createClient()

  async executeContract(
    functionName: string, 
    parameters: any[], 
    gas: number = 100000
  ): Promise<TransactionResult> {
    const hashConnect = walletService.getHashConnect()
    const walletState = walletService.getWalletState()
    
    if (!hashConnect || !walletState.isConnected || !walletState.accountId) {
      throw new Error('Wallet not connected')
    }

    if (!CONTRACT_CONFIG.id) {
      throw new Error('Contract not deployed')
    }

    try {
      const accountId = AccountId.fromString(walletState.accountId)
      const contractId = ContractId.fromString(CONTRACT_CONFIG.id)
      
      // Create contract execution transaction
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(gas)
        .setFunction(functionName, parameters)
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client)

      // Sign and execute via HashConnect
      const result = await hashConnect.sendTransaction(accountId, transaction)
      
      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          receipt: result.receipt
        }
      } else {
        return {
          success: false,
          error: result.error || 'Transaction failed'
        }
      }
    } catch (error) {
      console.error('Contract execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async queryContract(functionName: string, parameters: any[] = []): Promise<any> {
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