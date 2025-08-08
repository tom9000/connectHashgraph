import React, { useState, useEffect } from 'react'
import { walletService } from '../services/walletService.ts'
import type { WalletState } from '../types/contractTypes.ts'

interface WalletConnectorProps {
  onStateChange?: (state: WalletState) => void
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({ onStateChange }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    evmAddress: null,
    balance: null
  })
  const [isInitializing, setIsInitializing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeWallet()
    
    const unsubscribe = walletService.onStateChange((state) => {
      setWalletState(state)
      onStateChange?.(state)
    })

    return unsubscribe
  }, [onStateChange])

  const initializeWallet = async () => {
    setIsInitializing(true)
    setError(null)
    
    try {
      await walletService.initialize()
      setWalletState(walletService.getWalletState())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      await walletService.connectWallet()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await walletService.disconnectWallet()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    }
  }

  if (isInitializing) {
    return (
      <div className="wallet-connector initializing">
        <div className="loading">
          <div className="spinner"></div>
          <span>Initializing HashConnect...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-connector">
      <div className="wallet-header">
        <h3>HashPack Wallet</h3>
        {walletState.isConnected && walletState.accountId && (
          <div className="account-info">
            <span className="account-id">
              Account: {walletState.accountId}
            </span>
            {walletState.balance && (
              <span className="balance">
                Balance: {walletState.balance} HBAR
              </span>
            )}
          </div>
        )}
      </div>

      <div className="wallet-actions">
        {!walletState.isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="connect-button"
          >
            {isConnecting ? (
              <>
                <div className="spinner small"></div>
                Connecting...
              </>
            ) : (
              'Connect HashPack'
            )}
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="disconnect-button"
          >
            Disconnect
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="close-error">
            ×
          </button>
        </div>
      )}

      {walletState.isConnected && (
        <div className="connection-status success">
          <span>✅ Connected to HashPack</span>
        </div>
      )}
    </div>
  )
}