// Mock Wallet Service for Next.js 14 compatibility
// This will be replaced with real Stacks integration in production

export interface WalletState {
  isConnected: boolean
  account: any | null
  network: 'mainnet' | 'testnet'
  balance: {
    stx: string
    sbtc: string
  }
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

class WalletService {
  private state: WalletState = {
    isConnected: false,
    account: null,
    network: 'testnet',
    balance: {
      stx: '0',
      sbtc: '0'
    }
  }

  private listeners: ((state: WalletState) => void)[] = []

  constructor() {
    this.initializeWallet()
  }

  private async initializeWallet() {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // Check if Hiro Wallet extension is available
        const hasHiroWallet = typeof window !== 'undefined' && 
          (window as any).StacksProvider || 
          (window as any).hiroWallet;
        
        if (hasHiroWallet) {
          console.log('Hiro Wallet detected');
        }
      }
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
    }
  }

  async connectWallet(network: 'mainnet' | 'testnet' = 'testnet') {
    try {
      this.state.network = network
      
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock account data
      this.state.account = {
        addresses: {
          testnet: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB',
          mainnet: 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
        }
      }
      
      this.state.isConnected = true
      this.state.balance = {
        stx: '100.0',
        sbtc: '0.5'
      }
      
      this.notifyListeners()
      
      console.log('Mock wallet connected successfully')
      
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  async disconnectWallet() {
    try {
      // Simulate disconnection delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      this.state.isConnected = false
      this.state.account = null
      this.state.balance = { stx: '0', sbtc: '0' }
      this.notifyListeners()
      
      console.log('Mock wallet disconnected')
      
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  async sendPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (!this.state.isConnected || !this.state.account) {
        throw new Error('Wallet not connected')
      }

      // Simulate payment processing
      console.log('Processing payment:', request)
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock transaction ID
      const mockTxId = `mock-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Simulate balance update
      const paymentAmount = request.amount
      const currentSbtc = parseFloat(this.state.balance.sbtc)
      if (currentSbtc >= paymentAmount) {
        this.state.balance.sbtc = (currentSbtc - paymentAmount).toFixed(8)
        this.notifyListeners()
      }
      
      return {
        success: true,
        txId: mockTxId,
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

  async estimateTransactionFee(amount: number): Promise<string> {
    try {
      // Mock fee estimation
      const baseFee = 0.00001 // 0.00001 STX base fee
      const amountFee = amount * 0.001 // 0.1% of amount
      return (baseFee + amountFee).toFixed(6)
    } catch (error) {
      console.error('Fee estimation failed:', error)
      return '0.00001'
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

  // Utility methods
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

  // Mock methods for testing
  async refreshBalance() {
    if (this.state.isConnected) {
      // Simulate balance refresh
      this.state.balance = {
        stx: (Math.random() * 100 + 50).toFixed(2),
        sbtc: (Math.random() * 2 + 0.1).toFixed(8)
      }
      this.notifyListeners()
    }
  }
}

// Create singleton instance
export const walletService = new WalletService()
