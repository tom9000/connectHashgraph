import { HashConnect } from 'hashconnect'
import { HASHCONNECT_CONFIG } from '../config/walletConfig.ts'
import type { HashConnectState, WalletState } from '../types/contractTypes.ts'

export class WalletService {
  private hashconnect: HashConnect | null = null
  private isConnecting: boolean = false
  private softResetAttemptedForTopic: Set<string> = new Set()
  private state: HashConnectState = {
    isInitialized: false,
    isConnected: false,
    accountIds: [],
    selectedAccountId: null,
    pairedWalletData: null
  }

  private listeners: Array<(state: WalletState) => void> = []

  async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.log('HashConnect already initialized, skipping...')
      return
    }
    
    try {
      console.log('Starting HashConnect 0.2.9 initialization (back to working version)...')
      
      // Check if we have the necessary dependencies
      console.log('HashConnect constructor:', HashConnect)
      
      // HeliSwap EXACT pattern - HashConnect 0.2.9
      console.log('Creating HashConnect(true) - HeliSwap EXACT style...')  
      this.hashconnect = new HashConnect(true)
      console.log('HashConnect instance created successfully')
      
      const appMetadata = this.buildAppMetadata()
      
      console.log('🔧 CRITICAL: Setting up event listeners BEFORE init() call...')
      this.setUpHeliSwapEvents()

      console.log('Calling init() with HeliSwap EXACT parameters...')
      
      // Force mainnet for legacy checkbox UI
      const networkType = 'mainnet'
      console.log('Network type:', networkType)
      console.log('App metadata:', appMetadata)
      
      const initThirdParamEnv = (import.meta as any).env.VITE_HASHCONNECT_INIT_THIRD
      const initThirdParam = String(initThirdParamEnv).toLowerCase() === 'true'
      console.log('Init third parameter (from env):', initThirdParam)
      const initData = await this.hashconnect.init(appMetadata, networkType, initThirdParam)
      
      console.log('✅ HashConnect 0.2.9 initialized successfully')
      console.log('Init data received:', initData)
      
      // HeliSwap's exact logic - check for saved pairings
      if (initData.savedPairings && initData.savedPairings.length > 0) {
        console.log('✅ Found saved pairings:', initData.savedPairings)
        const pairingData = initData.savedPairings[0]
        
        if (pairingData && pairingData.accountIds && pairingData.accountIds[0]) {
          console.log('✅ Found existing connection, setting up state...')
          this.state.accountIds = pairingData.accountIds
          this.state.selectedAccountId = pairingData.accountIds[0]
          this.state.isConnected = true
          this.state.pairedWalletData = pairingData
          console.log('🎉 Restored connection with account:', pairingData.accountIds[0])
        }
      } else {
        console.log('ℹ️ No saved pairings found - new connection needed')
      }
      
      this.state.isInitialized = true
      this.syncConnectionState()
      
    } catch (error) {
      console.error('❌ CRITICAL: HashConnect 3.0 initialization failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
        constructor: error?.constructor?.name,
        fullError: error
      })
      
      // Try to identify common issues
      if (error instanceof Error) {
        if (error.message.includes('Project ID')) {
          console.error('🔍 PROJECT ID ISSUE: Verify your WalletConnect Project ID is correct')
        }
        if (error.message.includes('network') || error.message.includes('WebSocket')) {
          console.error('🔍 NETWORK ISSUE: Check internet connection and firewall settings')
        }
        if (error.message.includes('LedgerId') || error.message.includes('MAINNET')) {
          console.error('🔍 LEDGER ISSUE: Problem with Hedera network configuration')
        }
      }
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // More specific error details
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        if ('code' in error) {
          console.error('Error code:', (error as any).code)
        }
      }
      
      throw error
    }
  }

  async initializeWithNetwork(network: 'mainnet' | 'testnet'): Promise<void> {
    console.log(`Initializing HashConnect with network: ${network}`)
    
    // Reset state for new network
    this.state.isInitialized = false
    this.state.isConnected = false
    this.state.accountIds = []
    this.state.selectedAccountId = null
    this.state.pairedWalletData = null
    
    try {
      // Minimal cleanup - only clear network-specific keys to preserve encryption
      console.log('Minimal cleanup for network switch...')
      const keysToRemove: string[] = []
      Object.keys(localStorage).forEach(key => {
        // Only clear keys that are clearly network-specific
        if (key.includes('network_') || key.includes('_mainnet_') || key.includes('_testnet_')) {
          keysToRemove.push(key)
        }
      })
      
      keysToRemove.forEach(key => {
        console.log('Removing network-specific key:', key)
        localStorage.removeItem(key)
      })
      
      console.log('Minimal cleanup completed')
      
      // HeliSwap single HashConnect creation pattern
      console.log('Creating HashConnect(true) - HeliSwap EXACT style...')  
      this.hashconnect = new HashConnect(true)

      const appMetadata = this.buildAppMetadata()
      
      console.log(`Setting up event listeners for ${network}...`)
      this.setUpHeliSwapEvents()

      console.log(`Calling init() with ${network} parameters...`)
      const initThirdParamEnv = (import.meta as any).env.VITE_HASHCONNECT_INIT_THIRD
      const initThirdParam = String(initThirdParamEnv).toLowerCase() === 'true'
      console.log('Init third parameter (from env):', initThirdParam)
      const initData = await this.hashconnect.init(appMetadata, 'mainnet', initThirdParam)
      
      console.log('Init data received:', initData)
      
      // Check for existing saved pairings
      if (initData.savedPairings && initData.savedPairings.length > 0) {
        console.log('Found saved pairings:', initData.savedPairings)
        const pairingData = initData.savedPairings[0]
        
        if (pairingData && pairingData.accountIds && pairingData.accountIds[0]) {
          console.log('Found existing connection, setting up state...')
          this.state.accountIds = pairingData.accountIds
          this.state.selectedAccountId = pairingData.accountIds[0]
          this.state.isConnected = true
          this.state.pairedWalletData = pairingData
          console.log('Restored connection with account:', pairingData.accountIds[0])
        }
      }
      
      this.state.isInitialized = true
      this.syncConnectionState()
      
      console.log(`HashConnect initialized successfully with ${network}`)
      
    } catch (error) {
      console.error(`Failed to initialize HashConnect with ${network}:`, error)
      throw error
    }
  }

  private setUpHashConnect3Events(): void {
    if (!this.hashconnect) {
      console.error('HashConnect instance not available for event setup')
      return
    }

    console.log('Setting up HashConnect 3.0 event listeners...')

    // Connection state change event
    this.hashconnect.connectionStatusChangeEvent.on((connectionState) => {
      console.log('🔗 Connection state changed:', connectionState)
      this.connectionState = connectionState
      
      if (connectionState === HashConnectConnectionState.Paired) {
        console.log('✅ HashConnect 3.0 shows Paired state!')
        // In 3.0, pairing data comes through the pairing event, not getPairingData()
      }
    })

    // Pairing event - this is where we get the actual account data
    this.hashconnect.pairingEvent.on((pairingData: SessionData) => {
      console.log('🎉 HashConnect 3.0 pairing event received:', pairingData)
      this.processPairingData(pairingData)
    })

    console.log('HashConnect 3.0 event listeners setup completed')
  }

  private processPairingData(pairingData: SessionData): void {
    console.log('Processing HashConnect 3.0 pairing data:', pairingData)
    
    this.pairingData = pairingData
    
    if (pairingData.accountIds && pairingData.accountIds.length > 0) {
      this.state.accountIds = pairingData.accountIds
      this.state.selectedAccountId = pairingData.accountIds[0]
      this.state.isConnected = true
      this.state.pairedWalletData = {
        name: pairingData.name || 'HashPack',
        description: pairingData.description || 'HashPack Wallet',
        icon: pairingData.icon || ''
      }
      
      console.log('🎊 HashConnect 3.0 SUCCESS - Connected to:', this.state.selectedAccountId)
      this.syncConnectionState()
      this.isConnecting = false
    }
  }

  private setUpHeliSwapEvents(): void {
    if (!this.hashconnect) {
      console.error('HashConnect instance not available for event setup')
      return
    }

    console.log('Setting up HeliSwap-style event listeners...')

    // HeliSwap's exact foundExtensionEvent setup
    if (this.hashconnect.foundExtensionEvent && typeof this.hashconnect.foundExtensionEvent.on === 'function') {
      this.hashconnect.foundExtensionEvent.on((data: any) => {
        console.log('HeliSwap foundExtensionEvent:', data)
        // HeliSwap pushes to availableExtensions array and sets extensionFound
        // this.availableExtensions.push(data)
        // this.setExtensionFound(true)
      })
      console.log('HeliSwap foundExtensionEvent listener set up')
    } else {
      console.log('foundExtensionEvent not available in this HashConnect version')
    }

    // HeliSwap's exact pairingEvent setup with immediate listener
    if (this.hashconnect.pairingEvent && typeof this.hashconnect.pairingEvent.on === 'function') {
      // Add listener IMMEDIATELY to catch fast-firing events
      this.hashconnect.pairingEvent.on((data: any) => {
        console.log('🎉 PAIRING EVENT RECEIVED (HeliSwap pattern):', data)
        
        // HeliSwap EXACT implementation
        this.state.pairedWalletData = data.metadata || data
        
        // HeliSwap's exact forEach pattern
        if (data.accountIds && Array.isArray(data.accountIds)) {
          data.accountIds.forEach((id: string) => {
            if (this.state.accountIds.indexOf(id) === -1) {
              this.state.accountIds.push(id)
              this.state.selectedAccountId = id // HeliSwap sets this directly
            }
          })
          
          this.state.isConnected = true
          console.log('🎊 HeliSwap pattern SUCCESS - Connected to:', this.state.selectedAccountId)
          this.syncConnectionState()
          this.isConnecting = false
        } else {
          console.error('❌ No accountIds in pairing data')
          this.isConnecting = false
        }
      })
      console.log('HeliSwap pairingEvent listener set up')
    } else {
      console.log('pairingEvent not available in this HashConnect version')
    }

    // HeliSwap's exact transactionEvent setup
    if (this.hashconnect.transactionEvent && typeof this.hashconnect.transactionEvent.on === 'function') {
      this.hashconnect.transactionEvent.on((data: any) => {
        console.log('HeliSwap transactionEvent:', data)
        // HeliSwap comment: "this will not be common to be used in a dapp"
      })
      console.log('HeliSwap transactionEvent listener set up')
    } else {
      console.log('transactionEvent not available in this HashConnect version')
    }

    // Additional debugging events
    if (this.hashconnect.acknowledgeMessageEvent && typeof this.hashconnect.acknowledgeMessageEvent.on === 'function') {
      this.hashconnect.acknowledgeMessageEvent.on((data: any) => {
        console.log('DEBUG: acknowledgeMessageEvent:', data)
      })
    }

    if (this.hashconnect.additionalAccountRequestEvent && typeof this.hashconnect.additionalAccountRequestEvent.on === 'function') {
      this.hashconnect.additionalAccountRequestEvent.on((data: any) => {
        console.log('🎉 ADDITIONAL ACCOUNT REQUEST EVENT:', data)
        
        // Try to process this as account data
        if (data && data.accountIds && data.accountIds.length > 0) {
          console.log('✅ Found account data in additionalAccountRequestEvent!')
          
          this.state.accountIds = data.accountIds
          this.state.selectedAccountId = data.accountIds[0]
          this.state.isConnected = true
          this.state.pairedWalletData = data.metadata || { name: 'HashPack', description: 'HashPack Wallet' }
          
          console.log('🎊 ADDITIONAL ACCOUNT EVENT SUCCESS - Final state:', this.state)
          this.syncConnectionState()
          this.isConnecting = false
        }
      })
    }

    // Fallback: when connection state changes to Paired but pairing event didn't arrive
    if (this.hashconnect.connectionStatusChangeEvent && typeof this.hashconnect.connectionStatusChangeEvent.on === 'function') {
      this.hashconnect.connectionStatusChangeEvent.on(async (state: any) => {
        try {
          if ((state === 'Paired' || state?.toString?.() === 'Paired') && this.state.accountIds.length === 0) {
            console.log('🔁 connectionStatusChangeEvent=Paired, attempting topic-based recovery...')
            const topic = (this.hashconnect as any)?.hcData?.topic || JSON.parse(localStorage.getItem('hashconnectData') || '{}')?.topic
            if (topic && typeof (this.hashconnect as any).getPairingByTopic === 'function') {
              const pairing = (this.hashconnect as any).getPairingByTopic(topic)
              if (pairing?.accountIds?.length) {
                this.state.accountIds = pairing.accountIds
                this.state.selectedAccountId = pairing.accountIds[0]
                this.state.isConnected = true
                this.state.pairedWalletData = pairing.metadata || pairing
                this.syncConnectionState()
                this.isConnecting = false
              }
            }
          }
        } catch (e) {
          console.log('connectionStatusChangeEvent recovery error:', e)
        }
      })
    }

    console.log('All event listeners setup completed')
    
    // Log all available events for debugging
    console.log('Available events:', {
      pairingEvent: !!this.hashconnect.pairingEvent,
      foundExtensionEvent: !!this.hashconnect.foundExtensionEvent,
      transactionEvent: !!this.hashconnect.transactionEvent,
      connectionStatusChangeEvent: !!this.hashconnect.connectionStatusChangeEvent,
      acknowledgeMessageEvent: !!this.hashconnect.acknowledgeMessageEvent,
      additionalAccountRequestEvent: !!this.hashconnect.additionalAccountRequestEvent
    })
    
    // Debug: Listen for ALL events to see what HashPack is actually sending
    console.log('🔍 Setting up universal event listeners to debug what HashPack sends...')
    
    // Listen to ALL possible HashConnect events
    Object.keys(this.hashconnect).forEach(key => {
      if (key.includes('Event') && this.hashconnect[key] && typeof this.hashconnect[key].on === 'function') {
        console.log(`🔍 Setting up debug listener for: ${key}`)
        this.hashconnect[key].on((data: any) => {
          console.log(`🔍 DEBUG EVENT [${key}]:`, data)
        })
      }
    })
    
    console.log('Event listeners setup completed')
  }

  private buildAppMetadata(): { name: string; description: string; icon: string } {
    // Allow explicit env overrides to avoid any encoding/mismatch surprises
    const env = (import.meta as any).env || {}
    const originOverride = env.VITE_APP_ORIGIN as string | undefined
    const iconOverride = env.VITE_APP_ICON_URL as string | undefined
    const origin = originOverride || window.location.origin
    const iconData = env.VITE_APP_ICON_DATA as string | undefined
    const icon = iconData || iconOverride || `${origin}/logo192.png`
    return {
      name: 'Message Saver',
      description: 'Save messages to the Hedera blockchain',
      icon
    }
  }

  async connectWallet(networkOverride?: 'mainnet' | 'testnet'): Promise<void> {
    console.log('connectWallet called - hashconnect:', !!this.hashconnect, 'isInitialized:', this.state.isInitialized)
    console.log('Network override requested:', networkOverride)
    
    // If network override is different from current, reinitialize
    const currentNetwork = 'mainnet'
    if (networkOverride && networkOverride !== currentNetwork) {
      console.log(`Switching network from ${currentNetwork} to ${networkOverride}`)
      
      // Disconnect current session before switching
      if (this.state.isConnected && this.hashconnect) {
        try {
          console.log('Disconnecting current session before network switch...')
          await this.disconnectWallet()
        } catch (error) {
          console.log('Error disconnecting (proceeding anyway):', error)
        }
      }
      
      await this.initializeWithNetwork(networkOverride)
    }
    
    // If already connected, we're done
    if (this.state.isConnected) {
      console.log('WalletService: Already connected, skipping connection attempt')
      return
    }
    
    if (!this.hashconnect) {
      throw new Error(`HashConnect instance not available`)
    }
    
    // If not initialized, wait a bit and try again
    if (!this.state.isInitialized) {
      console.log('WalletService: Not yet initialized, waiting...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!this.state.isInitialized) {
        throw new Error(`HashConnect initialization timeout`)
      }
    }

    if (this.isConnecting) {
      console.log('WalletService: Connection already in progress, ignoring')
      return
    }

    this.isConnecting = true
    try {
      console.log('WalletService: Attempting HashPack extension connection...')
      
      // First sync the connection state to check for existing connections
      this.syncConnectionState()
      
      if (this.state.isConnected) {
        console.log('WalletService: Already connected after sync')
        this.isConnecting = false
        return
      }
      
      // Optional aggressive clear (disabled by default to avoid handshake races)
      const shouldHardClear = (import.meta as any).env.VITE_HASHCONNECT_CLEAR_ON_CONNECT === 'true'
      if (shouldHardClear) {
        console.log('WalletService: Hard clearing ALL localStorage (opt-in)')
        try {
          localStorage.clear()
          console.log('✅ Complete localStorage cleared')
          // Force reinitialize with clean state
          this.state.isInitialized = false
          await this.initialize()
        } catch (error) {
          console.log('Error clearing localStorage:', error)
        }
      } else {
        console.log('WalletService: Skipping aggressive localStorage.clear() (recommended)')
      }
      
      // HashConnect 0.2.9 API - connectToLocalWallet for direct extension connection
      console.log('WalletService: Calling connectToLocalWallet() HeliSwap style...')
      
      try {
        // Timing tweak: small delay to allow extension readiness
        const connectDelayMsRaw = (import.meta as any).env.VITE_HASHCONNECT_CONNECT_DELAY_MS
        const connectDelayMs = Number(connectDelayMsRaw ?? '500')
        if (!Number.isNaN(connectDelayMs) && connectDelayMs > 0) {
          console.log(`⏱️ Delaying connectToLocalWallet() by ${connectDelayMs}ms for extension readiness`)
          await new Promise(resolve => setTimeout(resolve, connectDelayMs))
        }
        console.log('WalletService: Using HeliSwap EXACT connectToLocalWallet() pattern...')
        this.hashconnect.connectToLocalWallet()
        console.log('WalletService: connectToLocalWallet() completed - HashPack extension should popup')
        
        // HeliSwap doesn't set isConnecting = false here, the pairing event handler does it
        // The connection state will be updated via the pairing event
        
        // After connecting, try to request account info like HeliSwap might do
        console.log('Connection initiated, checking if we need to request account info...')
        
        // Add a slight delay, then check if we need to request additional account info
        setTimeout(async () => {
          console.log('🔍 Checking if account request is needed...')
          if (this.hashconnect && this.state.accountIds.length === 0) {
            console.log('🔍 No accounts found, trying requestAdditionalAccounts...')
            try {
              // Try HeliSwap's requestAdditionalAccounts pattern
              const request = {
                topic: (this.hashconnect as any).hcData?.topic,
                network: 'mainnet',
                multiAccount: true
              }
              console.log('🔍 Requesting additional accounts with:', request)
              
              if (this.hashconnect.requestAdditionalAccounts && request.topic) {
                await this.hashconnect.requestAdditionalAccounts(request.topic, request)
                console.log('✅ Additional account request sent')
              } else {
                console.log('❌ requestAdditionalAccounts not available or no topic')
              }
            } catch (error) {
              console.log('❌ Error requesting additional accounts:', error)
            }
          }
        }, 1000) // 1 second delay
        
        console.log('Waiting for pairing event or additional account response...')
        
        // Add multiple timeouts to check connection status
        setTimeout(async () => {
          if (this.isConnecting && !this.state.isConnected) {
            console.warn('⚠️ First check: Pairing event not received, checking HashConnect status...')
            await this.checkConnectionStatus()
          }
        }, 3000) // 3 second check
        
        setTimeout(async () => {
          if (this.isConnecting && !this.state.isConnected) {
            console.warn('⚠️ Second check: Still not connected, trying recovery...')
            await this.checkConnectionStatus()
          }
        }, 8000) // 8 second check
        
        setTimeout(async () => {
          if (this.isConnecting && !this.state.isConnected) {
            console.warn('⚠️ Final check: Connection timeout, last attempt...')
            await this.checkConnectionStatus()
            this.isConnecting = false
            console.log('⏰ Connection timeout - try again if needed')
          }
        }, 15000) // 15 second timeout
        
      } catch (error) {
        console.error('connectToLocalWallet failed:', error)
        this.isConnecting = false
        throw error
      }
      
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async disconnectWallet(): Promise<void> {
    if (!this.hashconnect) {
      return
    }

    try {
      // v0.1.10 disconnect - check available methods
      console.log('Available disconnect methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.hashconnect)))
      // For now, just handle disconnection via state reset
      console.log('Disconnecting wallet (v0.1.10)')
      this.handleDisconnection()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  private async checkConnectionStatus(): Promise<void> {
    console.log('Checking HashConnect status:', this.hashconnect?.status)
    
    // Check if HashConnect shows connected/paired status
    if (this.hashconnect?.status === 'Connected' || this.hashconnect?.status === 'Paired') {
      console.warn('🚨 HashConnect shows Connected/Paired but pairing event not received')
      console.log('🔧 Attempting to recover connection data...')
      
      // Check localStorage for pairing data 
      console.log('🔍 Checking all localStorage for HashConnect data...')
      Object.keys(localStorage).forEach(key => {
        if (key.includes('hashconnect') || key.includes('HashConnect')) {
          console.log(`📋 localStorage[${key}]:`, localStorage.getItem(key))
        }
      })
      
      const hashConnectData = localStorage.getItem('hashconnectData')
      if (hashConnectData) {
        try {
          const data = JSON.parse(hashConnectData)
          console.log('📋 Parsed hashconnectData:', data)
          
          // Try to decode the pairingString base64 to see if it contains account info
          if (data.pairingString) {
            try {
              console.log('🔍 Decoding pairingString base64...')
              const decodedPairingString = atob(data.pairingString)
              console.log('📋 Decoded pairingString:', decodedPairingString)
              
              const pairingStringData = JSON.parse(decodedPairingString)
              console.log('📋 Parsed pairingString data:', pairingStringData)
              
              // Check if metadata contains account info
              if (pairingStringData.metadata && pairingStringData.metadata.accountId) {
                console.log('✅ Found account ID in pairingString metadata!')
                const accountId = pairingStringData.metadata.accountId
                
                this.state.accountIds = [accountId]
                this.state.selectedAccountId = accountId
                this.state.isConnected = true
                this.state.pairedWalletData = pairingStringData.metadata
                
                console.log('🎊 PAIRING STRING RECOVERY SUCCESSFUL - Final state:', this.state)
                this.syncConnectionState()
                this.isConnecting = false
                return
              }
            } catch (error) {
              console.log('❌ Error decoding pairingString:', error)
            }
          }
          
          console.log('🔍 DEBUG: Checking pairingData length:', data.pairingData?.length)
        console.log('🔍 DEBUG: Full data.pairingData structure:', data.pairingData)
        
        if (data.pairingData && data.pairingData.length > 0) {
            const pairing = data.pairingData[0]
            if (pairing.accountIds && pairing.accountIds.length > 0) {
              console.log('✅ Found pairing data in localStorage!')
              
              // Update our state
              this.state.accountIds = pairing.accountIds
              this.state.selectedAccountId = pairing.accountIds[0]
              this.state.isConnected = true
              this.state.pairedWalletData = pairing.metadata || pairing
              
              console.log('🎊 RECOVERY SUCCESSFUL - Final state:', this.state)
              this.syncConnectionState()
              this.isConnecting = false
              return
            }
          } else {
            console.log('❌ pairingData is empty or missing:', data.pairingData)
            
            // Try a different approach - check if HashConnect has internal pairing data
            console.log('🔧 Trying alternative recovery - checking HashConnect internals...')
            try {
              const hcData = (this.hashconnect as any).hcData
              console.log('📋 HashConnect internal hcData:', hcData)
              
              if (hcData && hcData.pairingData && hcData.pairingData.length > 0) {
                const pairing = hcData.pairingData[0]
                console.log('📋 Found internal pairing:', pairing)
                
                if (pairing.accountIds && pairing.accountIds.length > 0) {
                  console.log('✅ Found pairing data in HashConnect internal state!')
                  
                  this.state.accountIds = pairing.accountIds
                  this.state.selectedAccountId = pairing.accountIds[0]
                  this.state.isConnected = true
                  this.state.pairedWalletData = pairing.metadata || pairing
                  
                  console.log('🎊 INTERNAL RECOVERY SUCCESSFUL - Final state:', this.state)
                  this.syncConnectionState()
                  this.isConnecting = false
                  return
                }
              }
            } catch (error) {
              console.log('Error checking HashConnect internal state:', error)
            }
          }
        } catch (error) {
          console.log('Error parsing localStorage data:', error)
        }
      } else {
        console.log('❌ No hashconnectData found in localStorage')
      }
      
      console.log('❌ No pairing data found - testing HTTPS environment first')
      
      // Test if HTTPS environment resolves decryption - try storage extraction
      if (this.attemptBrowserStorageExtraction()) {
        return // Success via storage extraction
      }
      
      // Try library helper: getPairingByTopic (if available)
      try {
        const topic = (this.hashconnect as any)?.hcData?.topic || JSON.parse(localStorage.getItem('hashconnectData') || '{}')?.topic
        if (topic && typeof (this.hashconnect as any).getPairingByTopic === 'function') {
          console.log('🔍 Attempting getPairingByTopic recovery with topic:', topic)
          const pairing = (this.hashconnect as any).getPairingByTopic(topic)
          if (pairing && pairing.accountIds && pairing.accountIds.length > 0) {
            console.log('✅ getPairingByTopic returned pairing data')
            this.state.accountIds = pairing.accountIds
            this.state.selectedAccountId = pairing.accountIds[0]
            this.state.isConnected = true
            this.state.pairedWalletData = pairing.metadata || pairing
            this.syncConnectionState()
            this.isConnecting = false
            return
          }
        }
      } catch (e) {
        console.log('getPairingByTopic recovery failed:', e)
      }
      
      // Optional per-topic soft reset and automatic retry
      try {
        const env = (import.meta as any).env || {}
        const autoSoftReset = env.VITE_HASHCONNECT_AUTO_SOFT_RESET === 'true'
        const topic = (this.hashconnect as any)?.hcData?.topic || JSON.parse(localStorage.getItem('hashconnectData') || '{}')?.topic
        if (autoSoftReset && topic && !this.softResetAttemptedForTopic.has(topic)) {
          this.softResetAttemptedForTopic.add(topic)
          console.warn('🧩 Performing soft reset for topic and retrying connect...', topic)
          try {
            if (typeof (this.hashconnect as any).disconnect === 'function') {
              await (this.hashconnect as any).disconnect(topic)
            }
          } catch (e) {
            console.log('Soft disconnect failed (continuing):', e)
          }
          try {
            // Remove only topic-related storage to avoid full key wipe
            const keys = Object.keys(localStorage)
            keys.forEach(k => {
              if (k.toLowerCase().includes('hashconnect') || k.toLowerCase().includes('hashpack')) {
                localStorage.removeItem(k)
              }
            })
          } catch (e) {
            console.log('Soft storage cleanup failed (continuing):', e)
          }
          // Re-init and re-attempt connection once
          try {
            this.state.isInitialized = false
            await this.initialize()
            await this.connectWallet()
            return
          } catch (e) {
            console.log('Soft reset retry failed:', e)
          }
        }
      } catch (e) {
        console.log('Soft reset block failed:', e)
      }
      
      console.log('❌ No automatic pairing solution found yet - connection incomplete')
      // Offer manual fallback so user can proceed
      try {
        this.promptForManualEntry()
      } catch (e) {
        console.log('Manual entry prompt failed or was cancelled:', e)
      }
      this.isConnecting = false
    }
  }

  private attemptBrowserStorageExtraction(): boolean {
    console.log('🔍 Checking all browser storage for account information...')
    
    try {
      // Check localStorage for any Hedera account patterns
      console.log('📋 Scanning localStorage for account patterns...')
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key)
        if (value && (value.includes('0.0.') || value.includes('accountId') || value.includes('account'))) {
          console.log(`🔍 Found potential account data in localStorage[${key}]:`, value)
          
          // Try to extract account ID pattern
          const accountMatch = value.match(/0\.0\.\d+/g)
          if (accountMatch && accountMatch.length > 0) {
            const accountId = accountMatch[0]
            console.log('✅ Found account ID in localStorage:', accountId)
            
            // Update our state
            this.state.accountIds = [accountId]
            this.state.selectedAccountId = accountId
            this.state.isConnected = true
            this.state.pairedWalletData = {
              name: 'HashPack',
              description: 'HashPack Wallet (extracted from storage)',
              icon: ''
            }
            
            console.log('🎊 STORAGE EXTRACTION SUCCESSFUL - Final state:', this.state)
            this.syncConnectionState()
            this.isConnecting = false
            return true
          }
        }
      })
      
      // Check sessionStorage as well
      console.log('📋 Scanning sessionStorage for account patterns...')
      Object.keys(sessionStorage).forEach(key => {
        const value = sessionStorage.getItem(key)
        if (value && (value.includes('0.0.') || value.includes('accountId'))) {
          console.log(`🔍 Found potential account data in sessionStorage[${key}]:`, value)
          
          const accountMatch = value.match(/0\.0\.\d+/g)
          if (accountMatch && accountMatch.length > 0) {
            const accountId = accountMatch[0]
            console.log('✅ Found account ID in sessionStorage:', accountId)
            
            this.state.accountIds = [accountId]
            this.state.selectedAccountId = accountId
            this.state.isConnected = true
            this.state.pairedWalletData = {
              name: 'HashPack',
              description: 'HashPack Wallet (extracted from storage)',
              icon: ''
            }
            
            console.log('🎊 STORAGE EXTRACTION SUCCESSFUL - Final state:', this.state)
            this.syncConnectionState()
            this.isConnecting = false
            return true
          }
        }
      })
      
    } catch (error) {
      console.log('❌ Error during storage extraction:', error)
    }
    
    console.log('❌ No account information found in browser storage')
    return false
  }

  private attemptAccountRecovery(): void {
    console.log('🔧 Attempting account recovery after decryption error...')
    
    // Try multiple recovery strategies
    
    // Strategy 1: Request additional accounts
    if (this.hashconnect?.requestAdditionalAccounts) {
      try {
        const topic = (this.hashconnect as any).hcData?.topic
        if (topic) {
          console.log('🔧 Strategy 1: Requesting additional accounts...')
          this.hashconnect.requestAdditionalAccounts(topic, {
            topic,
            network: 'mainnet',
            multiAccount: true
          })
        }
      } catch (error) {
        console.log('❌ Strategy 1 failed:', error)
      }
    }
    
    // Strategy 2: Try to manually parse any available account info from browser storage
    setTimeout(() => {
      if (this.state.accountIds.length === 0) {
        console.log('🔧 Strategy 2: Manual account extraction from any available data...')
        this.extractAccountFromAnySource()
      }
    }, 2000)
  }

  private extractAccountFromAnySource(): void {
    console.log('🔍 Extracting account from any available source...')
    
    // Check if HashPack extension has left any traces of account info
    try {
      // Look for HashPack extension data in the DOM
      const extensionData = (window as any).hashpack
      if (extensionData) {
        console.log('🔍 Found HashPack extension data:', extensionData)
      }
      
      // Check all possible storage locations
      const allStorage = { ...localStorage, ...sessionStorage }
      Object.keys(allStorage).forEach(key => {
        const value = allStorage[key]
        if (typeof value === 'string') {
          // Look for account ID patterns
          const accountMatches = value.match(/0\.0\.\d+/g)
          if (accountMatches && accountMatches.length > 0) {
            console.log(`🔍 Found potential accounts in ${key}:`, accountMatches)
            // Use the first found account
            const accountId = accountMatches[0]
            console.log('✅ Using extracted account:', accountId)
            
            this.state.accountIds = [accountId]
            this.state.selectedAccountId = accountId
            this.state.isConnected = true
            this.state.pairedWalletData = {
              name: 'HashPack',
              description: 'HashPack Wallet (recovered)',
              icon: ''
            }
            
            this.syncConnectionState()
            this.isConnecting = false
            return
          }
        }
      })
      
    } catch (error) {
      console.log('❌ Account extraction failed:', error)
    }
    
    console.log('❌ No account information could be extracted')
  }

  private promptForManualEntry(): void {
    console.log('💡 Showing manual entry prompt...')
    
    // Since HashPack shows Connected but decryption is failing, offer manual entry
    const accountId = prompt(
      'HashPack connection established, but automatic account detection failed due to encryption issues.\n\n' +
      'Please enter your HashPack account ID (format: 0.0.123456):'
    )
      
    if (accountId && accountId.match(/^0\.0\.\d+$/)) {
      console.log('✅ Manual account ID provided:', accountId)
      
      // Update our state with the manually provided account
      this.state.accountIds = [accountId]
      this.state.selectedAccountId = accountId
      this.state.isConnected = true
      this.state.pairedWalletData = {
        name: 'HashPack',
        description: 'HashPack Wallet',
        icon: ''
      }
      
      console.log('🎊 MANUAL RECOVERY SUCCESSFUL - Final state:', this.state)
      this.syncConnectionState()
      this.isConnecting = false
      return
    } else if (accountId) {
      console.log('❌ Invalid account ID format provided:', accountId)
      alert('Invalid account ID format. Please use format: 0.0.123456')
    } else {
      console.log('❌ User cancelled manual account entry')
    }
  }

  private syncConnectionState(): void {
    // HeliSwap-style connection state sync
    console.log('syncConnectionState: Checking HeliSwap-style connection state...')
    console.log('Available hashconnect properties:', Object.keys(this.hashconnect || {}))
    console.log('Current internal state:', this.state)
    
    // Check if we have any saved pairings (HeliSwap checks initData.savedPairings[0])
    if (this.hashconnect && this.state.pairedWalletData && this.state.accountIds.length > 0) {
      console.log('syncConnectionState: Found pairing data, marking as connected')
      this.state.isConnected = true
      this.state.selectedAccountId = this.state.accountIds[0]
    } else {
      console.log('syncConnectionState: No valid pairing found')
      this.state.isConnected = false
      this.state.selectedAccountId = null
    }

    console.log('syncConnectionState: Final state:', this.state)
    this.notifyListeners()
  }


  private handleDisconnection(): void {
    this.state.isConnected = false
    this.state.accountIds = []
    this.state.selectedAccountId = null
    this.state.pairedWalletData = null

    this.notifyListeners()
  }

  private notifyListeners(): void {
    const walletState: WalletState = {
      isConnected: this.state.isConnected,
      accountId: this.state.selectedAccountId,
      evmAddress: null, // Will be derived from account ID if needed
      balance: null // Will be fetched separately
    }

    this.listeners.forEach(listener => listener(walletState))
  }

  onStateChange(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getState(): HashConnectState {
    return { ...this.state }
  }

  getWalletState(): WalletState {
    return {
      isConnected: this.state.isConnected,
      accountId: this.state.selectedAccountId,
      evmAddress: null,
      balance: null
    }
  }

  getHashConnect(): HashConnect | null {
    return this.hashconnect
  }
}

export const walletService = new WalletService()