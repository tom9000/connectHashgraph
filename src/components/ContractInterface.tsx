import React, { useState, useEffect } from 'react'
import { contractService } from '../services/contractService.ts'
import type { MessageEntry, WalletState } from '../types/contractTypes.ts'

interface ContractInterfaceProps {
  walletState: WalletState
}

export const ContractInterface: React.FC<ContractInterfaceProps> = ({ walletState }) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MessageEntry[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (walletState.isConnected) {
      loadContractData()
    }
  }, [walletState.isConnected])

  const loadContractData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [count, recentMessages] = await Promise.all([
        contractService.getMessageCount(),
        contractService.getRecentMessages(10)
      ])

      setMessageCount(count)
      setMessages(recentMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      setError('Message cannot be empty')
      return
    }

    if (!walletState.isConnected) {
      setError('Please connect your wallet first')
      return
    }

    setIsSending(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await contractService.storeMessage(message.trim())
      
      if (result.success) {
        setSuccess(`Message stored successfully! Transaction ID: ${result.transactionId}`)
        setMessage('')
        // Reload contract data after successful transaction
        setTimeout(() => loadContractData(), 3000) // Wait a bit for transaction to be processed
      } else {
        setError(result.error || 'Failed to store message')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const formatAccountId = (accountId: string): string => {
    if (accountId.length <= 12) return accountId
    return `${accountId.slice(0, 6)}...${accountId.slice(-6)}`
  }

  return (
    <div className="contract-interface">
      <div className="contract-header">
        <h3>Message Storage Contract</h3>
        <div className="contract-stats">
          <span className="message-count">
            Total Messages: {messageCount}
          </span>
          <button 
            onClick={loadContractData} 
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? '⟳' : '↻'} Refresh
          </button>
        </div>
      </div>

      {!walletState.isConnected ? (
        <div className="not-connected">
          <p>Please connect your HashPack wallet to interact with the contract.</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="form-group">
              <label htmlFor="message">Store a Message:</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={3}
                maxLength={500}
                disabled={isSending}
                className="message-input"
              />
              <div className="character-count">
                {message.length}/500 characters
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="send-button"
            >
              {isSending ? (
                <>
                  <div className="spinner small"></div>
                  Sending Transaction...
                </>
              ) : (
                'Store Message'
              )}
            </button>
          </form>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)} className="close-error">
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="success-message">
              <span>✅ {success}</span>
              <button onClick={() => setSuccess(null)} className="close-success">
                ×
              </button>
            </div>
          )}

          <div className="messages-section">
            <h4>Recent Messages</h4>
            {isLoading ? (
              <div className="loading-messages">
                <div className="spinner"></div>
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages found. Be the first to store a message!</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div key={msg.id} className="message-item">
                    <div className="message-header">
                      <span className="message-id">#{msg.id}</span>
                      <span className="message-sender">
                        {formatAccountId(msg.sender)}
                      </span>
                      <span className="message-timestamp">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <div className="message-content">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}