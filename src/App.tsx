import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false)
  const [pairingString, setPairingString] = useState('')
  const [rawPairingString, setRawPairingString] = useState('')
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    checkForExistingWalletConnections()
    
    // Set up wallet state change listener once on component mount
    const unsubscribe = walletService.onStateChange((state) => {
      console.log('App: Wallet state change received:', state)
      console.log('App: isConnected:', state.isConnected, 'accountId:', state.accountId)
      setIsWalletConnected(state.isConnected)
      setWalletAddress(state.accountId || '')
      
      if (state.isConnected && state.accountId) {
        console.log('App: Setting status to Connected')
        setHashpackStatus('Connected')
        setIsConnecting(false) // Stop connecting spinner
        
        // Close WalletConnect modal if it's open (successful pairing from mobile)
        if (showWalletConnectModal) {
          console.log('App: Closing WalletConnect modal - pairing successful')
          setShowWalletConnectModal(false)
        }
        
        loadContractData(true)
      } else {
        console.log('App: Setting status to Ready to pair')
        setHashpackStatus('HashConnect Ready - Click Connect to pair')
      }
    })
    
    // Cleanup listener on component unmount
    return () => unsubscribe()
  }, [showWalletConnectModal])

  const checkForExistingWalletConnections = async () => {
    try {
      console.log('Checking for existing wallet connections...')
      
      // First, check if MetaMask is connected
      const isMetaMaskConnected = await checkMetaMaskConnection()
      if (isMetaMaskConnected) {
        console.log('MetaMask connection restored, skipping HashConnect initialization')
        return
      }
      
      // Only initialize HashConnect if MetaMask is not connected
      console.log('No MetaMask connection found, initializing HashConnect...')
      await checkHashPackAvailability()
    } catch (error) {
      console.warn('Error checking existing wallet connections:', error)
      // Fallback to HashConnect initialization if there's an error
      await checkHashPackAvailability()
    }
  }

  const checkMetaMaskConnection = async (): Promise<boolean> => {
    try {
      const eth = (window as any).ethereum
      if (!eth) return false
      
      // Find MetaMask specifically (in case multiple wallets are installed)
      let metaMask = eth
      if (eth.providers?.length > 0) {
        metaMask = eth.providers.find((provider: any) => provider.isMetaMask)
        if (!metaMask) return false
      } else if (!eth.isMetaMask) {
        return false
      }
      
      // Check if we have permission to access accounts (without requesting new permissions)
      const accounts: string[] = await metaMask.request({ method: 'eth_accounts' })
      if (accounts?.length > 0) {
        console.log('Found existing MetaMask connection:', accounts[0])
        walletService.setExternalEvmWallet(accounts[0])
        setHashpackStatus('MetaMask Connected')
        await loadContractData(true)
        return true
      }
      
      return false
    } catch (error) {
      console.log('MetaMask connection check failed:', error)
      return false
    }
  }

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
      const { pairingString: initPairingString, rawPairingString: initRawPairingString, topic } = await walletService.initialize()
      console.log('HashConnect initialization completed')
      console.log('Received formatted pairing string:', initPairingString)
      console.log('Received raw pairing string:', initRawPairingString)
      console.log('Received topic:', topic)
      
      // Set both pairing strings
      if (initPairingString) {
        setPairingString(initPairingString) // hashconnect://pair?data=... for QR code
        setRawPairingString(initRawPairingString) // base64 string for extension
        console.log('✅ Pairing strings set for QR code and extension')
      }
      
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
          <div className={`app-content ${isWalletConnected ? 'wallet-connected' : ''}`}>
            
            {/* Main Content */}
            <main className="app-main">
              <div className="main-card">
                
                <div className="card-content">
                  {/* Heading - only show when not connected */}
                  {!isWalletConnected && (
                    <div className="main-heading">
                      <div className="description-text">
                        Save messages to Hedera
                      </div>
                    </div>
                  )}

                  {/* Wallet Status */}
                  <div className="wallet-status">
                    {isWalletConnected && walletAddress 
                      ? `Wallet Connected: ${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}` 
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
                  onClick={async () => {
                    try {
                      // Check for MetaMask specifically
                      const eth = (window as any).ethereum
                      if (!eth) {
                        setAlertMessage('MetaMask not detected')
                        setShowCustomAlert(true)
                        return
                      }
                      
                      // If multiple wallets are installed, find MetaMask specifically
                      let metaMask = eth
                      if (eth.providers?.length > 0) {
                        metaMask = eth.providers.find((provider: any) => provider.isMetaMask)
                      } else if (!eth.isMetaMask) {
                        setAlertMessage('MetaMask not detected (found other wallet)')
                        setShowCustomAlert(true)
                        return
                      }
                      // Ensure Hedera Mainnet RPC exists in MetaMask
                      await metaMask.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                          chainId: '0x127', // 295
                          chainName: 'Hedera Mainnet',
                          nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
                          rpcUrls: ['https://mainnet.hashio.io/api'],
                          blockExplorerUrls: ['https://hashscan.io/mainnet']
                        }]
                      }).catch(() => {})

                      // Try to switch to Hedera Mainnet (optional)
                      try {
                        await metaMask.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x127' }] })
                      } catch (switchError) {
                        console.log('Chain switch not supported or failed, continuing anyway:', switchError)
                      }

                      // Request accounts
                      const accounts: string[] = await metaMask.request({ method: 'eth_requestAccounts' })
                      const addr = accounts?.[0]
                      if (!addr) throw new Error('No MetaMask accounts')

                      walletService.setExternalEvmWallet(addr)
                      setHashpackStatus('MetaMask Connected')
                      setShowWalletModal(false)
                      await loadContractData(true)
                    } catch (e: any) {
                      console.error('MetaMask connect failed', e)
                      setAlertMessage(`MetaMask connect failed: ${e?.message || e}`)
                      setShowCustomAlert(true)
                    }
                  }}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">MetaMask</div>
                    <div className="wallet-description">Ethereum wallet integration</div>
                  </div>
                  {!isConnecting && <div className="coming-soon"></div>}
                </button>
                
                {/* 
                <button 
                  className="wallet-option"
                  onClick={() => {
                    setShowWalletModal(false)
                    setShowWalletConnectModal(true)
                    // Pairing string should already be available from initialization
                    console.log('WalletConnect modal opened, current pairing string:', pairingString)
                  }}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">HashPack (Wallet Connect)</div>
                    <div className="wallet-description">Connect via WalletConnect protocol</div>
                  </div>
                </button>

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
                */}
                
                <button 
                  className="wallet-option"
                  onClick={connectHashPackNew}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">HashPack</div>
                    <div className="wallet-description">Hedera native wallet</div>
                  </div>
                  {isConnecting && <div className="connecting-spinner">Connecting...</div>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WalletConnect Modal */}
      {showWalletConnectModal && (
        <div className="modal-overlay" onClick={() => setShowWalletConnectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>WalletConnect - HashPack</h3>
              <button className="modal-close" onClick={() => setShowWalletConnectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="walletconnect-content">
                <p>Connecting via WalletConnect protocol...</p>
                <button 
                  className="wallet-option"
                  onClick={async () => {
                    try {
                      console.log('WalletConnect: Attempting HashPack connection...')
                      // Close WalletConnect modal first
                      setShowWalletConnectModal(false)
                      
                      // Use the existing HashPack connection logic via HashConnect
                      await connectHashPack()
                    } catch (e: any) {
                      console.error('WalletConnect connection failed:', e)
                      alert(`WalletConnect connection failed: ${e?.message || e}`)
                      // Reopen WalletConnect modal if connection fails
                      setShowWalletConnectModal(true)
                    }
                  }}
                  disabled={isConnecting}
                >
                  <div className="wallet-info">
                    <div className="wallet-name">Connect HashPack</div>
                    <div className="wallet-description">Extension or QR code pairing</div>
                  </div>
                  {isConnecting && <div className="connecting-spinner">Connecting...</div>}
                </button>
                
                <div className="divider">OR</div>
                
                <div className="qr-section">
                  <p>Scan QR code with HashPack mobile app:</p>
                  {pairingString ? (
                    <div className="qr-container">
                      <div className="url-scheme-selector">
                        <p>Try different URL schemes for mobile app:</p>
                        <div className="scheme-buttons">
                          <button 
                            className="scheme-button"
                            onClick={() => setPairingString(`hashpack://connect?data=${rawPairingString}`)}
                          >
                            hashpack://connect
                          </button>
                          <button 
                            className="scheme-button"
                            onClick={() => setPairingString(`hashpack://pair?data=${rawPairingString}`)}
                          >
                            hashpack://pair
                          </button>
                          <button 
                            className="scheme-button"
                            onClick={() => setPairingString(`hashpack://wc?uri=${rawPairingString}`)}
                          >
                            hashpack://wc
                          </button>
                          <button 
                            className="scheme-button"
                            onClick={() => setPairingString(rawPairingString)}
                          >
                            Raw (no scheme)
                          </button>
                        </div>
                      </div>
                      <div className="qr-code">
                        <QRCodeSVG 
                          value={pairingString} 
                          size={200} 
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
                        Current format: {pairingString.substring(0, 50)}...
                      </p>
                      <div className="pairing-string-section">
                        <p>For browser extension:</p>
                        <button 
                          className="wallet-option"
                          onClick={async () => {
                            try {
                              console.log('WalletConnect: Attempting direct extension connection...')
                              setIsConnecting(true)
                              setShowWalletConnectModal(false)
                              
                              // Use the existing HashPack connection logic for extension
                              await connectHashPack()
                            } catch (e: any) {
                              console.error('Extension connection failed:', e)
                              alert(`Extension connection failed: ${e?.message || e}`)
                              setShowWalletConnectModal(true) // Reopen modal if failed
                            } finally {
                              setIsConnecting(false)
                            }
                          }}
                          disabled={isConnecting}
                          style={{ marginBottom: '12px' }}
                        >
                          <div className="wallet-info">
                            <div className="wallet-name">Connect Extension Directly</div>
                            <div className="wallet-description">Preferred method for HashPack browser extension</div>
                          </div>
                          {isConnecting && <div className="connecting-spinner">Connecting...</div>}
                        </button>
                        
                        <details style={{ marginTop: '12px' }}>
                          <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                            Manual pairing string (if needed)
                          </summary>
                          <div className="pairing-string-container" style={{ marginTop: '8px' }}>
                            <input 
                              type="text" 
                              value={rawPairingString} 
                              readOnly 
                              className="pairing-string-input"
                              placeholder="Raw pairing string for HashPack extension"
                            />
                            <button 
                              className="copy-button"
                              onClick={() => {
                                navigator.clipboard.writeText(rawPairingString)
                                alert('Raw pairing string copied!')
                              }}
                            >
                              Copy
                            </button>
                          </div>
                          <p style={{ fontSize: '10px', color: 'var(--gray-11)', marginTop: '4px' }}>
                            Only use this if direct connection fails
                          </p>
                        </details>
                      </div>
                    </div>
                  ) : (
                    <div className="qr-placeholder">
                      <div>Generating QR Code...</div>
                      <div className="connecting-spinner">Loading...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {showCustomAlert && (
        <div className="custom-alert-overlay" onClick={() => setShowCustomAlert(false)}>
          <div className="custom-alert" onClick={(e) => e.stopPropagation()}>
            <div className="custom-alert-message">{alertMessage}</div>
            <button 
              className="custom-alert-button"
              onClick={() => setShowCustomAlert(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </ThemeProvider>
  )
}

export default App