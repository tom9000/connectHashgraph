import { useState, useEffect } from 'react'
import { walletService } from './services/walletService.ts'
import { contractService, type MessageEntry } from './services/contractService.ts'
import { NETWORK, CONTRACT_CONFIG } from './config/contractConfig.ts'
import { ThemeProvider } from './components/ThemeProvider.tsx'
import { RefreshCw } from './components/RefreshIcon.tsx'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [hashpackStatus, setHashpackStatus] = useState('Checking for HashPack wallet...')
  const [walletAddress, setWalletAddress] = useState('')
  const [messageCount, setMessageCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<MessageEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  useEffect(() => {
    checkHashPackAvailability()
    
    // Set up wallet state change listener once on component mount
    const unsubscribe = walletService.onStateChange((state) => {
      console.log('App: Wallet state change received:', state)
      setIsWalletConnected(state.isConnected)
      setWalletAddress(state.accountId || '')
      
      if (state.isConnected) {
        setHashpackStatus('Connected')
        setIsConnecting(false) // Stop connecting spinner
        loadContractData(true)
      } else {
        setHashpackStatus('HashConnect Ready - Click Connect to pair')
      }
    })
    
    // Cleanup listener on component unmount
    return () => unsubscribe()
  }, [])

  const loadContractData = async (forceLoad = false) => {
    if (!forceLoad && !isWalletConnected) return
    
    setIsLoading(true)
    try {
      const [count, messages] = await Promise.all([
        contractService.getMessageCount(),
        contractService.getRecentMessages()
      ])
      setMessageCount(count)
      setRecentMessages(messages)
    } catch (error) {
      console.warn('Could not load contract data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkHashPackAvailability = async () => {
    try {
      console.log('Starting HashConnect initialization...')
      await walletService.initialize()
      console.log('HashConnect initialization completed')
      
      // HashConnect v3 automatically detects and handles extension availability
      // If HashPack extension is found during init, it will automatically pop up
      setHashpackStatus('HashConnect Ready - Click Connect to pair')
      
    } catch (error) {
      console.error('HashConnect initialization error:', error)
      setHashpackStatus('HashConnect Initialization Failed')
    }
  }

  const openWalletModal = () => {
    setShowWalletModal(true)
  }

  const closeWalletModal = () => {
    setShowWalletModal(false)
  }

  const connectHashPack = async () => {
    if (isConnecting) {
      console.log('App: Connection already in progress, ignoring click')
      return
    }
    
    setIsConnecting(true)
    setShowWalletModal(false) // Close modal when starting connection
    setHashpackStatus('Connecting to HashPack...')
    
    try {
      console.log('App: Starting wallet connection to MAINNET...')
      await walletService.connectWallet('mainnet')
      
      // The wallet state will be updated via the listener set up in useEffect
      // No need to manually set state here - the pairingEvent will trigger the listener
      
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert(`❌ Failed to connect wallet: ${error}`)
      setIsConnecting(false)
      setHashpackStatus('Connection Failed - Try Again')
    }
  }

  const connectHashPackNew = async () => {
    if (isConnecting) {
      console.log('App: Connection already in progress, ignoring click')
      return
    }
    
    setIsConnecting(true)
    setShowWalletModal(false) // Close modal when starting connection
    setHashpackStatus('Connecting to HashPack...')
    
    try {
      console.log('App: Starting wallet connection to TESTNET...')
      
      // Connect to testnet to show radio button UI
      await walletService.connectWallet('testnet')
      
      // The wallet state will be updated via the listener set up in useEffect
      
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert(`❌ Failed to connect wallet: ${error}`)
      setIsConnecting(false)
      setHashpackStatus('Connection Failed - Try Again')
    }
  }

  const sendMessage = async () => {
    if (!isWalletConnected || !walletAddress || !message.trim()) {
      alert('Please connect wallet and enter a message')
      return
    }

    try {
      console.log('Sending message to contract:', message)
      console.log('From address:', walletAddress)
      
      const result = await contractService.storeMessage(message)
      
      if (result.success) {
        alert(`✅ Message "${message}" sent to contract!`)
        setMessage('')
        
        // Refresh contract data after sending message
        await loadContractData()
      } else {
        throw new Error(result.error || 'Transaction failed')
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      alert(`❌ Failed to send message: ${error}`)
    }
  }

  const getContractExplorerUrl = () => {
    if (CONTRACT_CONFIG.id) {
      return `${NETWORK.explorerUrl}/contract/${CONTRACT_CONFIG.id}`
    }
    return '#'
  }

  return (
    <ThemeProvider>
      <div className="app-container">
        {/* Background Gradient */}
        <div className="app-background" />
        
        {/* Main Content Container */}
        <div className="app-layout">
          <div className="app-content">
            
            {/* Main Content */}
            <main className="app-main">
              <div className="main-card">
                
                <div className="card-content">
                  {/* Heading */}
                  <div className="main-heading">
                    <div className="description-text">
                      Save messages to the Hedera blockchain
                    </div>
                  </div>

                  {/* Wallet Status */}
                  <div className="wallet-status">
                    {isWalletConnected && walletAddress 
                      ? `Connected: ${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}` 
                      : hashpackStatus}
                  </div>

                  {/* Form */}
                  <div className="form-container">
                    {!isWalletConnected ? (
                      <button 
                        className="connect-button"
                        onClick={openWalletModal}
                        disabled={isConnecting}
                      >
                        Connect Wallet
                      </button>
                    ) : (
                      <div className="form-group">
                        <div className="input-container">
                          <input
                            type="text"
                            className="message-input"
                            placeholder="Enter your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            autoFocus
                          />
                          <button
                            className={`send-button ${
                              !message.trim() 
                                ? 'send-button--disabled' 
                                : 'send-button--enabled'
                            }`}
                            onClick={sendMessage}
                            disabled={!message.trim()}
                          >
                            Send
                          </button>
                        </div>
                        <div className="form-spacer" />
                      </div>
                    )}
                  </div>

                  {/* Contract Info */}
                  {isWalletConnected && (
                    <div className="contract-info">
                      <div className="contract-header">
                        <h3 className="contract-title">Contract Status</h3>
                        <button 
                          onClick={loadContractData} 
                          disabled={isLoading}
                          className="refresh-button"
                          aria-label="Refresh data"
                        >
                          <RefreshCw 
                            className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} 
                            color="#aaa"
                          />
                        </button>
                      </div>
                      
                      <div className="contract-stats">
                        <div>Messages: {messageCount}</div>
                        <div>Network: {NETWORK.name}</div>
                        <div className="col-span-2">
                          <a 
                            href={getContractExplorerUrl()} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="contract-link"
                          >
                            Contract: {CONTRACT_CONFIG.id ? `${CONTRACT_CONFIG.id.substring(0, 8)}...${CONTRACT_CONFIG.id.substring(CONTRACT_CONFIG.id.length - 8)}` : 'Not Deployed'} View on HashScan
                          </a>
                        </div>
                      </div>
                      
                      {recentMessages.length > 0 && (
                        <div className="messages-section">
                          <h4 className="messages-title">Recent Messages:</h4>
                          <div className="messages-list">
                            {recentMessages.map((msg) => (
                              <div key={msg.id.toString()} className="message-item">
                                <div className="message-id">#{msg.id.toString()}</div>
                                <div className="message-text">"{msg.content}"</div>
                                <div className="message-sender">
                                  From: {msg.sender.substring(0, 8)}...{msg.sender.substring(msg.sender.length - 8)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <footer className="app-footer">
                  <p className="footer-text">Powered by Hedera Hashgraph</p>
                </footer>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="modal-overlay" onClick={closeWalletModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Wallet</h3>
              <button className="modal-close" onClick={closeWalletModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="wallet-options">
                <button 
                  className="wallet-option"
                  onClick={connectHashPack}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">HashPack Legacy (Mainnet)</div>
                    <div className="wallet-description">Checkbox UI - Connect to mainnet</div>
                  </div>
                  {isConnecting && <div className="connecting-spinner">Connecting...</div>}
                </button>
                
                <button 
                  className="wallet-option"
                  onClick={connectHashPackNew}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">HashPack New (Testnet)</div>
                    <div className="wallet-description">Radio button UI - Connect to testnet</div>
                  </div>
                  {isConnecting && <div className="connecting-spinner">Connecting...</div>}
                </button>
                
                <button className="wallet-option" disabled>
                  <div className="wallet-info">
                    <div className="wallet-name">QR Code</div>
                    <div className="wallet-description">Scan with HashPack mobile app</div>
                  </div>
                  <div className="coming-soon">Coming Soon</div>
                </button>
                
                <button 
                  className="wallet-option"
                  onClick={async () => {
                    try {
                      const eth = (window as any).ethereum
                      if (!eth) {
                        alert('MetaMask not detected')
                        return
                      }
                      // Ensure Hedera Mainnet RPC exists in MetaMask
                      await eth.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                          chainId: '0x127', // 295
                          chainName: 'Hedera Mainnet',
                          nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
                          rpcUrls: ['https://mainnet.hashio.io/api'],
                          blockExplorerUrls: ['https://hashscan.io/mainnet']
                        }]
                      }).catch(() => {})

                      // Switch to Hedera Mainnet
                      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x127' }] })

                      // Request accounts
                      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' })
                      const addr = accounts?.[0]
                      if (!addr) throw new Error('No MetaMask accounts')

                      walletService.setExternalEvmWallet(addr)
                      setHashpackStatus('MetaMask Connected')
                      setShowWalletModal(false)
                      await loadContractData(true)
                    } catch (e: any) {
                      console.error('MetaMask connect failed', e)
                      alert(`MetaMask connect failed: ${e?.message || e}`)
                    }
                  }}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">MetaMask</div>
                    <div className="wallet-description">Connect via MetaMask (experimental)</div>
                  </div>
                  {!isConnecting && <div className="coming-soon"></div>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  )
}

export default App