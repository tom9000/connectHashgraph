// Minimal ABI for MessageStorage.sol used by the dApp
export const MESSAGE_STORAGE_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_content", "type": "string" }
    ],
    "name": "storeMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMessageCount",
    "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "_messageId", "type": "uint256" } ],
    "name": "getMessage",
    "outputs": [
      { "internalType": "address", "name": "sender", "type": "address" },
      { "internalType": "string", "name": "content", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [ { "internalType": "uint256", "name": "_count", "type": "uint256" } ],
    "name": "getRecentMessages",
    "outputs": [
      { "internalType": "address[]", "name": "senders", "type": "address[]" },
      { "internalType": "string[]", "name": "contents", "type": "string[]" },
      { "internalType": "uint256[]", "name": "timestamps", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
