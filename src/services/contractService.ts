import { messageService } from './messageService.ts'
import type { MessageEntry, TransactionResult } from '../types/contractTypes.ts'

export class ContractService {
  
  async storeMessage(message: string): Promise<TransactionResult> {
    return messageService.storeMessage(message)
  }

  async getMessageCount(): Promise<number> {
    return messageService.getMessageCount()
  }

  async getMessage(messageId: number): Promise<MessageEntry | null> {
    return messageService.getMessage(messageId)
  }

  async getRecentMessages(count: number = 10): Promise<MessageEntry[]> {
    return messageService.getRecentMessages(count)
  }

  async getUserMessages(userAddress: string): Promise<number[]> {
    return messageService.getUserMessages(userAddress)
  }

  async getUserMessageCount(userAddress: string): Promise<number> {
    return messageService.getUserMessageCount(userAddress)
  }
}

export const contractService = new ContractService()

export type { MessageEntry, TransactionResult } from '../types/contractTypes.ts'