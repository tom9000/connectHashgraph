#!/usr/bin/env node
/*
  Simple deployment script using @hashgraph/sdk and solc.
  Requires .env.local with:
  - VITE_HEDERA_ACCOUNT_ID=0.0.x
  - HEDERA_PRIVATE_KEY=<private-key>
  - VITE_HEDERA_NETWORK=mainnet|testnet
*/
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import solc from 'solc'
import { Client, ContractCreateFlow, Hbar, PrivateKey, ContractId } from '@hashgraph/sdk'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })
else dotenv.config()

const ACCOUNT_ID = process.env.VITE_HEDERA_ACCOUNT_ID
const PRIV_KEY = process.env.HEDERA_PRIVATE_KEY
const NET = (process.env.VITE_HEDERA_NETWORK || 'testnet').toLowerCase()

if (!ACCOUNT_ID || !PRIV_KEY) {
  console.error('Missing VITE_HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in env')
  process.exit(1)
}

const client = Client.forName(NET)

function normalizeHex(input) {
  if (!input) return input
  return input.startsWith('0x') ? input.slice(2) : input
}

function parsePrivateKey(raw) {
  const s = (raw || '').trim()
  try {
    // PEM support or SDK-autodetect
    if (s.includes('BEGIN PRIVATE KEY') || s.includes('BEGIN ECDSA PRIVATE KEY') || s.includes('BEGIN ED25519 PRIVATE KEY')) {
      return PrivateKey.fromString(s)
    }
    const hex = normalizeHex(s)
    if (/^[0-9a-fA-F]+$/.test(hex)) {
      // DER-encoded hex generally starts with 0x302e/0x302d
      const prefix = hex.slice(0, 4).toLowerCase()
      if (prefix === '302e' || prefix === '302d') {
        return PrivateKey.fromStringDer(hex)
      }
      // Try ECDSA first (common for EVM accounts), then ED25519
      try { return PrivateKey.fromStringECDSA(hex) } catch {}
      try { return PrivateKey.fromStringED25519(hex) } catch {}
    }
    // Fallback to generic parser
    return PrivateKey.fromString(s)
  } catch (e) {
    console.error('Unable to parse private key. Ensure format matches account key type (ECDSA vs ED25519).')
    throw e
  }
}

const operatorKey = parsePrivateKey(PRIV_KEY)
client.setOperator(ACCOUNT_ID, operatorKey)

const contractPath = path.resolve(process.cwd(), 'contracts/MessageStorage.sol')
const source = fs.readFileSync(contractPath, 'utf8')

const input = {
  language: 'Solidity',
  sources: { 'MessageStorage.sol': { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } }
  }
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
if (output.errors) {
  for (const e of output.errors) console.error(e.formattedMessage || e.message)
}
const contractName = 'MessageStorage'
const artifact = output.contracts['MessageStorage.sol'][contractName]
if (!artifact) {
  console.error('Compilation failed: contract artifact not found')
  process.exit(1)
}
const bytecode = artifact.evm.bytecode.object
if (!bytecode || bytecode.length === 0) {
  console.error('Empty bytecode')
  process.exit(1)
}

;(async () => {
  try {
    console.log(`Deploying ${contractName} to ${NET} as ${ACCOUNT_ID}...`)

    const create = new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(2_000_000)
    const txResponse = await create.execute(client)
    const receipt = await txResponse.getReceipt(client)
    const contractId = receipt.contractId?.toString()

    if (!contractId) throw new Error('No contractId in receipt')

    console.log('Deployed contractId:', contractId)
    const evmAddress = '0x' + ContractId.fromString(contractId).toSolidityAddress()
    console.log('Derived EVM address:', evmAddress)
    console.log('Set these in .env.local:')
    console.log(`VITE_CONTRACT_ID=${contractId}`)
    console.log(`VITE_CONTRACT_EVM_ADDRESS=${evmAddress}`)
    
    try { await client.close?.() } catch {}
    process.exit(0)
  } catch (err) {
    console.error('Deployment failed:', err)
    process.exit(1)
  }
})()
