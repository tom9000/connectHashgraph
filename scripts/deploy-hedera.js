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
import { Client, ContractCreateFlow, FileCreateTransaction, Hbar, PrivateKey } from '@hashgraph/sdk'

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
client.setOperator(ACCOUNT_ID, PrivateKey.fromString(PRIV_KEY))

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
    console.log('Set these in .env.local:')
    console.log(`VITE_CONTRACT_ID=${contractId}`)

    // Note: evm address derivation is provided by mirror node; print instruction
    console.log('Find EVM address on HashScan or mirror node, then set:')
    console.log('VITE_CONTRACT_EVM_ADDRESS=0x...')
  } catch (err) {
    console.error('Deployment failed:', err)
    process.exit(1)
  }
})()
