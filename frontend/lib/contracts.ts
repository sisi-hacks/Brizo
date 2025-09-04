import { 
  makeContractCall, 
  standardPrincipalCV, 
  stringAsciiCV, 
  uintCV, 
  noneCV, 
  someCV,
  PostConditionMode,
  AnchorMode,
  FungibleConditionCode,
  createFungiblePostCondition,
  createAssetInfo
} from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'

// Contract addresses (updated after deployment)
const CONTRACT_ADDRESSES = {
  testnet: {
    brizoPayments: 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-payments',
    brizoTrait: 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-trait',
    brizoSbtcIntegration: 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.brizo-sbtc-integration',
    deploy: 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.deploy'
  },
  mainnet: {
    brizoPayments: 'SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.brizo-payments',
    brizoTrait: 'SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.brizo-trait',
    deploy: 'SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.deploy'
  }
}

// Contract function names
const CONTRACT_FUNCTIONS = {
  registerMerchant: 'register-merchant',
  createPayment: 'create-payment',
  completePayment: 'complete-payment',
  cancelPayment: 'cancel-payment',
  getPayment: 'get-payment',
  getMerchant: 'get-merchant',
  getPlatformStats: 'get-platform-stats',
  getMerchantPayments: 'get-merchant-payments'
}

export interface ContractConfig {
  network: 'testnet' | 'mainnet'
  sender: string
  fee?: number
}

export interface MerchantRegistration {
  merchantId: string
  name: string
  description: string
  walletAddress: string
}

export interface PaymentCreation {
  paymentId: string
  merchantId: string
  amount: number
  description: string
  memo?: string
}

export interface PaymentCompletion {
  paymentId: string
  txHash: string
}

// Get contract address based on network
export function getContractAddress(contract: keyof typeof CONTRACT_ADDRESSES.testnet, network: 'testnet' | 'mainnet' = 'testnet') {
  return CONTRACT_ADDRESSES[network][contract]
}

// Get network instance
export function getNetwork(network: 'testnet' | 'mainnet' = 'testnet') {
  return network === 'testnet' ? new StacksTestnet() : new StacksMainnet()
}

// Register a new merchant
export async function registerMerchant(
  config: ContractConfig,
  merchant: MerchantRegistration
) {
  const network = getNetwork(config.network)
  const contractAddress = getContractAddress('brizoPayments', config.network)
  
  const functionArgs = [
    stringAsciiCV(merchant.merchantId),
    stringAsciiCV(merchant.name),
    stringAsciiCV(merchant.description),
    standardPrincipalCV(merchant.walletAddress)
  ]

  const transaction = await makeContractCall({
    contractAddress: contractAddress.split('.')[0],
    contractName: contractAddress.split('.')[1],
    functionName: CONTRACT_FUNCTIONS.registerMerchant,
    functionArgs,
    sender: config.sender,
    network,
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    fee: config.fee || 10000
  })

  return transaction
}

// Create a new payment
export async function createPayment(
  config: ContractConfig,
  payment: PaymentCreation
) {
  const network = getNetwork(config.network)
  const contractAddress = getContractAddress('brizoPayments', config.network)
  
  const functionArgs = [
    stringAsciiCV(payment.paymentId),
    stringAsciiCV(payment.merchantId),
    uintCV(Math.floor(payment.amount * 1e8)), // Convert to micro units
    stringAsciiCV(payment.description),
    payment.memo ? someCV(stringAsciiCV(payment.memo)) : noneCV()
  ]

  const transaction = await makeContractCall({
    contractAddress: contractAddress.split('.')[0],
    contractName: contractAddress.split('.')[1],
    functionName: CONTRACT_FUNCTIONS.createPayment,
    functionArgs,
    sender: config.sender,
    network,
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    fee: config.fee || 10000
  })

  return transaction
}

// Complete a payment
export async function completePayment(
  config: ContractConfig,
  completion: PaymentCompletion
) {
  const network = getNetwork(config.network)
  const contractAddress = getContractAddress('brizoPayments', config.network)
  
  const functionArgs = [
    stringAsciiCV(completion.paymentId),
    stringAsciiCV(completion.txHash)
  ]

  const transaction = await makeContractCall({
    contractAddress: contractAddress.split('.')[0],
    contractName: contractAddress.split('.')[1],
    functionName: CONTRACT_FUNCTIONS.completePayment,
    functionArgs,
    sender: config.sender,
    network,
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    fee: config.fee || 10000
  })

  return transaction
}

// Cancel a payment
export async function cancelPayment(
  config: ContractConfig,
  paymentId: string
) {
  const network = getNetwork(config.network)
  const contractAddress = getContractAddress('brizoPayments', config.network)
  
  const functionArgs = [stringAsciiCV(paymentId)]

  const transaction = await makeContractCall({
    contractAddress: contractAddress.split('.')[0],
    contractName: contractAddress.split('.')[1],
    functionName: CONTRACT_FUNCTIONS.cancelPayment,
    functionArgs,
    sender: config.sender,
    network,
    postConditionMode: PostConditionMode.Deny,
    anchorMode: AnchorMode.Any,
    fee: config.fee || 10000
  })

  return transaction
}

// Read-only contract calls (for getting data)
export async function callReadOnly(
  config: ContractConfig,
  functionName: string,
  functionArgs: any[]
) {
  const network = getNetwork(config.network)
  const contractAddress = getContractAddress('brizoPayments', config.network)
  
  const transaction = await makeContractCall({
    contractAddress: contractAddress.split('.')[0],
    contractName: contractAddress.split('.')[1],
    functionName,
    functionArgs,
    sender: config.sender,
    network,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
    fee: config.fee || 10000
  })

  return transaction
}

// Get payment details
export async function getPayment(config: ContractConfig, paymentId: string) {
  return callReadOnly(config, CONTRACT_FUNCTIONS.getPayment, [stringAsciiCV(paymentId)])
}

// Get merchant details
export async function getMerchant(config: ContractConfig, merchantId: string) {
  return callReadOnly(config, CONTRACT_FUNCTIONS.getMerchant, [stringAsciiCV(merchantId)])
}

// Get platform statistics
export async function getPlatformStats(config: ContractConfig) {
  return callReadOnly(config, CONTRACT_FUNCTIONS.getPlatformStats, [])
}

// Get merchant payments
export async function getMerchantPayments(config: ContractConfig, merchantId: string, limit: number = 10) {
  return callReadOnly(config, CONTRACT_FUNCTIONS.getMerchantPayments, [
    stringAsciiCV(merchantId),
    uintCV(limit)
  ])
}

// Utility function to check if contracts are deployed
export async function checkContractDeployment(network: 'testnet' | 'mainnet' = 'testnet') {
  try {
    const config: ContractConfig = {
      network,
      sender: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
    }
    
    await getPlatformStats(config)
    return true
  } catch (error) {
    console.error('Contract not deployed or not accessible:', error)
    return false
  }
}
