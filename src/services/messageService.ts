import { ContractFunctionParameters } from '@hashgraph/sdk'
import { transactionService } from './transactionService.ts'
import { walletService } from './walletService.ts'
import type { MessageEntry, TransactionResult } from '../types/contractTypes.ts'

export class MessageService {
  
  async storeMessage(message: string): Promise<TransactionResult> {
    try {
      const wallet = walletService.getWalletState()
      if (wallet.isConnected && wallet.accountId?.startsWith('0x')) {
        // MetaMask/EVM path: send raw string parameter
        return await transactionService.executeContract('storeMessage', [message])
      }
      // HashPack/HAPI path
      const parameters = new ContractFunctionParameters().addString(message)
      return await transactionService.executeContract('storeMessage', [parameters])
    } catch (error) {
      console.error('Failed to store message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getMessageCount(): Promise<number> {
    try {
      const result = await transactionService.queryContract('getMessageCount')
      // Parse the result to extract the count
      return result.getUint256(0).toNumber()
    } catch (error) {
      console.error('Failed to get message count:', error)
      return 0
    }
  }

  async getMessage(messageId: number): Promise<MessageEntry | null> {
    try {
      const parameters = new ContractFunctionParameters()
        .addUint256(messageId)

      const result = await transactionService.queryContract('getMessage', [parameters])
      
      // Parse the result tuple
      const sender = result.getAddress(0)
      const content = result.getString(1)
      const timestamp = result.getUint256(2).toNumber()
      const id = result.getUint256(3).toNumber()

      return {
        id,
        sender,
        content,
        timestamp
      }
    } catch (error) {
      console.error('Failed to get message:', error)
      return null
    }
  }

  async getRecentMessages(count: number = 10): Promise<MessageEntry[]> {
    try {
      const parameters = new ContractFunctionParameters()
        .addUint256(count)

      const result = await transactionService.queryContract('getRecentMessages', [parameters])
      
      // Parse the result arrays
      const senders = result.getAddressArray(0)
      const contents = result.getStringArray(1) 
      const timestamps = result.getUint256Array(2)
      const ids = result.getUint256Array(3)

      const messages: MessageEntry[] = []
      
      for (let i = 0; i < senders.length; i++) {
        messages.push({
          id: ids[i].toNumber(),
          sender: senders[i],
          content: contents[i],
          timestamp: timestamps[i].toNumber()
        })
      }

      return messages
    } catch (error) {
      console.error('Failed to get recent messages:', error)
      return []
    }
  }

  async getUserMessages(userAddress: string): Promise<number[]> {
    try {
      const parameters = new ContractFunctionParameters()
        .addAddress(userAddress)

      const result = await transactionService.queryContract('getUserMessages', [parameters])
      
      return result.getUint256Array(0).map((id: any) => id.toNumber())
    } catch (error) {
      console.error('Failed to get user messages:', error)
      return []
    }
  }

  async getUserMessageCount(userAddress: string): Promise<number> {
    try {
      const parameters = new ContractFunctionParameters()
        .addAddress(userAddress)

      const result = await transactionService.queryContract('getUserMessageCount', [parameters])
      
      return result.getUint256(0).toNumber()
    } catch (error) {
      console.error('Failed to get user message count:', error)
      return 0
    }
  }
}

export const messageService = new MessageService()