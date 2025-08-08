export const HASHCONNECT_CONFIG = {
  appMetadata: {
    name: "Hedera HashPack Connector",
    description: "Hedera smart contract interaction demo",
    icons: ["https://hashpack.app/favicon.ico"],
    url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3012'
  }
}

export const WALLET_CONFIG = {
  supportedWallets: ['HashPack'],
  autoConnect: true,
  timeout: 30000 // 30 seconds
}