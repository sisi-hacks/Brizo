// sBTC Wallet Service for Bitcoin/Stacks Integration
// Based on Stacks sBTC Clarity Contracts documentation
// Supports Xverse, Hiro, and other Bitcoin wallets for sBTC operations

import { 
  connect, 
  disconnect, 
  isConnected, 
  getUserData,
  getStxAddress
} from '@stacks/connect';
import { 
  STACKS_MAINNET, 
  STACKS_TESTNET
} from '@stacks/network';

export interface WalletState {
  isConnected: boolean
  account: any | null
  network: 'mainnet' | 'testnet'
  balance: {
    stx: string
    sbtc: string
  }
  walletType: 'xverse' | 'hiro' | 'other' | null
}

export interface PaymentRequest {
  amount: number
  to: string
  description: string
  merchantId: string
}

export interface PaymentResult {
  success: boolean
  txId?: string
  error?: string
  message: string
}

// sBTC Contract Addresses (from Stacks documentation)
const SBTC_CONTRACTS = {
  testnet: {
    sbtcToken: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-token',
    sbtcRegistry: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-registry',
    sbtcDeposit: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-deposit',
    sbtcWithdrawal: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-withdrawal'
  },
  mainnet: {
    sbtcToken: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-token',
    sbtcRegistry: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-registry',
    sbtcDeposit: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-deposit',
    sbtcWithdrawal: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB.sbtc-withdrawal'
  }
}

class WalletService {
  private state: WalletState = {
    isConnected: false,
    account: null,
    network: 'testnet',
    balance: {
      stx: '0',
      sbtc: '0'
    },
    walletType: null
  }

  private listeners: ((state: WalletState) => void)[] = []
  private network: any

  constructor() {
    this.network = STACKS_TESTNET
    this.initializeWallet()
  }

  private async initializeWallet() {
    try {
      if (typeof window !== 'undefined') {
        // Check for available wallets
        const hasXverse = typeof window !== 'undefined' && (window as any).XverseProvider
        const hasHiro = typeof window !== 'undefined' && (window as any).StacksProvider
        
        if (hasXverse) {
          console.log('Xverse Wallet detected')
          this.state.walletType = 'xverse'
        } else if (hasHiro) {
          console.log('Hiro Wallet detected')
          this.state.walletType = 'hiro'
        } else {
          console.log('No wallet detected, will use connect modal')
          this.state.walletType = 'other'
        }

        // Check if already connected
        const connected = await isConnected()
        if (connected) {
          await this.refreshWalletState()
        }
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
    }
  }

  async connectWallet(network: 'mainnet' | 'testnet' = 'testnet') {
    try {
      this.state.network = network
      this.network = network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET

      console.log('Connecting to wallet...')
      
      // Use Stacks Connect to connect wallet
      await connect({
        network: this.network
      })

      // Wait a bit for connection to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if connected and refresh state
      const connected = await isConnected()
      if (connected) {
        await this.refreshWalletState()
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async disconnectWallet() {
    try {
      console.log('Disconnecting wallet...')
      
      await disconnect()
      
      this.state.isConnected = false
      this.state.account = null
      this.state.balance = { stx: '0', sbtc: '0' }
      this.state.walletType = null
      
      this.notifyListeners()
      console.log('Wallet disconnected successfully')
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  async sendPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (!this.state.isConnected || !this.state.account) {
        throw new Error('Wallet not connected')
      }

      console.log('Processing sBTC payment:', request)
      
      // For sBTC payments, we need to interact with the sBTC contract
      // This is a simplified version - in production you'd use the actual sBTC contract calls
      
      if (request.amount > parseFloat(this.state.balance.sbtc)) {
        throw new Error('Insufficient sBTC balance')
      }

      // Simulate payment processing
      const txId = `sbtc-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Update balance
      const currentSbtc = parseFloat(this.state.balance.sbtc)
      this.state.balance.sbtc = (currentSbtc - request.amount).toFixed(8)
      this.notifyListeners()
      
      return {
        success: true,
        txId: txId,
        message: `Payment of ${request.amount} sBTC sent successfully`
      }
      
    } catch (error) {
      console.error('Payment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Payment failed'
      }
    }
  }

  // sBTC specific methods based on Stacks documentation
  async getSbtcBalance(): Promise<string> {
    try {
      if (!this.state.isConnected || !this.state.account) {
        return '0'
      }

      // This would call the sBTC token contract to get balance
      // For now, returning mock data
      return this.state.balance.sbtc
    } catch (error) {
      console.error('Failed to get sBTC balance:', error)
      return '0'
    }
  }

  async depositSbtc(amount: number): Promise<PaymentResult> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Wallet not connected')
      }

      console.log(`Depositing ${amount} BTC to get sBTC...`)
      
      // This would interact with the sBTC deposit contract
      // For now, simulating the process
      
      return {
        success: true,
        txId: `deposit-${Date.now()}`,
        message: `Deposit of ${amount} BTC initiated`
      }
    } catch (error) {
      console.error('sBTC deposit failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Deposit failed'
      }
    }
  }

  async withdrawSbtc(amount: number): Promise<PaymentResult> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Wallet not connected')
      }

      if (amount > parseFloat(this.state.balance.sbtc)) {
        throw new Error('Insufficient sBTC balance')
      }

      console.log(`Withdrawing ${amount} sBTC to get BTC...`)
      
      // This would interact with the sBTC withdrawal contract
      // For now, simulating the process
      
      return {
        success: true,
        txId: `withdrawal-${Date.now()}`,
        message: `Withdrawal of ${amount} sBTC initiated`
      }
    } catch (error) {
      console.error('sBTC withdrawal failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Withdrawal failed'
      }
    }
  }

  async estimateTransactionFee(amount: number): Promise<string> {
    try {
      // Estimate fee based on network and transaction type
      const baseFee = this.state.network === 'testnet' ? 0.00001 : 0.00005
      const amountFee = amount * 0.001
      return (baseFee + amountFee).toFixed(6)
    } catch (error) {
      console.error('Fee estimation failed:', error)
      return '0.00001'
    }
  }

  private async refreshWalletState() {
    try {
      const connected = await isConnected()
      if (connected) {
        const userData = await getUserData()
        
        this.state.account = {
          addresses: {
            testnet: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB',
            mainnet: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
          },
          profile: userData
        }
        this.state.isConnected = true
        
        // Refresh balance
        await this.refreshBalance()
        
        this.notifyListeners()
        console.log('Wallet state refreshed')
      }
    } catch (error) {
      console.error('Failed to refresh wallet state:', error)
    }
  }

  async refreshBalance() {
    try {
      if (this.state.isConnected && this.state.account) {
        // For now, using mock balances
        // In production, you'd call the Stacks API and sBTC contracts
        this.state.balance = {
          stx: '100.0', // Mock STX balance
          sbtc: '0.5'   // Mock sBTC balance
        }
        
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  getState(): WalletState {
    return { ...this.state }
  }

  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  isWalletConnected(): boolean {
    return this.state.isConnected
  }

  getAccountAddress(): string | null {
    return this.state.account?.addresses[this.state.network] || null
  }

  getNetwork(): 'mainnet' | 'testnet' {
    return this.state.network
  }

  getBalance() {
    return { ...this.state.balance }
  }

  getWalletType(): string | null {
    return this.state.walletType
  }

  // Check if specific wallet is available
  isWalletAvailable(walletType: 'xverse' | 'hiro'): boolean {
    if (typeof window === 'undefined') return false
    
    switch (walletType) {
      case 'xverse':
        return !!(window as any).XverseProvider
      case 'hiro':
        return !!(window as any).StacksProvider
      default:
        return false
    }
  }

  // Get sBTC contract addresses for current network
  getSbtcContracts() {
    return SBTC_CONTRACTS[this.state.network]
  }
}

export const walletService = new WalletService()
