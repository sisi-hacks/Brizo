'use client'

import { stacksApi } from '@/lib/stacksApi'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, Wallet, LogOut, RefreshCw, AlertCircle, CheckCircle, X, ArrowUpDown, Coins } from 'lucide-react'
import { walletService, WalletState } from '@/lib/wallet'

export default function WalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState())
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletDetection, setWalletDetection] = useState<{
    xverse: boolean
    hiro: boolean
    other: boolean
  }>({
    xverse: false,
    hiro: false,
    other: false
  })

  // New local UI state for account + faucet actions
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [requestingFaucet, setRequestingFaucet] = useState(false)
  const [passphrase, setPassphrase] = useState('test-passphrase')
  const [privateKey, setPrivateKey] = useState('')
  const [createdAddress, setCreatedAddress] = useState<string | null>(null)
  const [chainBalance, setChainBalance] = useState<{ stx?: string; sbtc?: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    // Check wallet availability on mount
    checkWalletAvailability()
    
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe(setWalletState)
    
    return unsubscribe
  }, [])

  const checkWalletAvailability = () => {
    const xverse = walletService.isWalletAvailable('xverse')
    const hiro = walletService.isWalletAvailable('hiro')
    const other = !xverse && !hiro
    
    setWalletDetection({ xverse, hiro, other })
  }

  const handleConnect = async (network: 'mainnet' | 'testnet' = 'testnet') => {
    try {
      setIsConnecting(true)
      setError(null)
      
      console.log(`Connecting to wallet on ${network}...`)
      const success = await walletService.connectWallet(network)
      
      if (success) {
        console.log('Wallet connected successfully')
        await refreshOnChain()
      } else {
        setError('Failed to connect wallet')
      }
    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      setError(null)
      
      await walletService.disconnectWallet()
      console.log('Wallet disconnected successfully')
      setChainBalance(null)
    } catch (err) {
      console.error('Disconnection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefreshBalance = async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      await walletService.refreshBalance()
      await refreshOnChain()
      console.log('Balance refreshed successfully')
    } catch (err) {
      console.error('Balance refresh error:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh balance')
    } finally {
      setIsRefreshing(false)
    }
  }

  // New handlers
  const handleCreateAccount = async () => {
    try {
      setCreating(true)
      setError(null)
      const res = await stacksApi.createAccount('testnet', passphrase || 'passphrase')
      setCreatedAddress(res.address)
      // After creation, fetch on-chain balance
      await fetchOnChain(res.address)
    } catch (e: any) {
      setError(e.message || 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  const handleImportAccount = async () => {
    try {
      setImporting(true)
      setError(null)
      if (!privateKey) {
        setError('Enter a private key to import')
        return
      }
      const res = await stacksApi.importAccount(privateKey.trim(), 'testnet', passphrase || 'passphrase')
      setCreatedAddress(res.address)
      await fetchOnChain(res.address)
    } catch (e: any) {
      setError(e.message || 'Failed to import account')
    } finally {
      setImporting(false)
    }
  }

  const handleFaucet = async () => {
    try {
      setRequestingFaucet(true)
      setError(null)
      const addr = walletService.getAccountAddress() || createdAddress
      if (!addr) {
        setError('No address available. Create/import or connect first.')
        return
      }
      const res = await stacksApi.requestFaucet(addr, false)
      console.log('Faucet:', res)
      // Refresh displayed balances after faucet
      await refreshOnChain()
    } catch (e: any) {
      setError(e.message || 'Failed to request faucet')
    } finally {
      setRequestingFaucet(false)
    }
  }

  const refreshOnChain = async (address?: string) => {
    const addr = address || walletService.getAccountAddress() || createdAddress
    if (!addr) return
    await fetchOnChain(addr)
  }

  const fetchOnChain = async (address: string) => {
    try {
      const b = await stacksApi.getBalance(address)
      const stx = b?.balance || b?.stx?.balance || '0'
      const sbtc = b?.sbtc?.balance || '0'
      setChainBalance({ stx, sbtc })
    } catch (e) {
      // ignore
    }
  }

  const copy = async (label: string, text?: string | null) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 1200)
    } catch {}
  }

  const getWalletIcon = () => {
    switch (walletState.walletType) {
      case 'xverse':
        return '🟢'
      case 'hiro':
        return '🟡'
      case 'other':
        return '🔵'
      default:
        return '⚪'
    }
  }

  const getWalletName = () => {
    switch (walletState.walletType) {
      case 'xverse':
        return 'Xverse'
      case 'hiro':
        return 'Hiro'
      case 'other':
        return 'Other'
      default:
        return 'None'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          sBTC Wallet Connection
        </CardTitle>
        <CardDescription>
          Connect your Bitcoin wallet for sBTC payments and operations
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Wallet Detection Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available Wallets:</h4>
          <div className="flex gap-2">
            <Badge variant={walletDetection.xverse ? "default" : "secondary"}>
              {walletDetection.xverse ? "✅ Xverse" : "❌ Xverse"}
            </Badge>
            <Badge variant={walletDetection.hiro ? "default" : "secondary"}>
              {walletDetection.hiro ? "✅ Hiro" : "❌ Hiro"}
            </Badge>
            <Badge variant={walletDetection.other ? "default" : "secondary"}>
              {walletDetection.other ? "✅ Other" : "❌ Other"}
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 h-6 px-2 text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Dev account tools (Stacks API) */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dev Tools (Stacks Testnet):</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={handleCreateAccount} disabled={creating}>
              {creating ? 'Creating...' : 'Create Testnet Account'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleFaucet} disabled={requestingFaucet}>
              {requestingFaucet ? 'Requesting...' : 'Request Faucet'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
              className="h-9 px-3 border rounded text-sm"
            />
            <input
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Private key (hex)"
              className="h-9 px-3 border rounded text-sm"
            />
            <Button size="sm" variant="secondary" onClick={handleImportAccount} disabled={importing}>
              {importing ? 'Importing...' : 'Import Private Key'}
            </Button>
          </div>
          {createdAddress && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              Created/Imported: <span className="font-mono">{createdAddress}</span>
              <Button size="sm" variant="outline" onClick={() => copy('address', createdAddress)}>Copy</Button>
              {copied === 'address' && <span className="text-green-600">Copied!</span>}
            </div>
          )}
        </div>

        {/* Connection Status */}
        {walletState.isConnected ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">sBTC Wallet Connected</span>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Wallet:</span>
                <span className="font-medium">{getWalletIcon()} {getWalletName()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Network:</span>
                <Badge variant="outline" className="text-xs">
                  {walletState.network}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Address:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-700 truncate max-w-32">
                    {walletService.getAccountAddress()}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => copy('connected-address', walletService.getAccountAddress())}>Copy</Button>
                </div>
              </div>
            </div>

            {/* Balance Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">STX Balance (local/mock):</span>
                <span className="font-medium">{walletState.balance.stx} STX</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">sBTC Balance (local/mock):</span>
                <span className="font-medium text-brizo-600">{walletState.balance.sbtc} sBTC</span>
              </div>
              {chainBalance && (
                <div className="mt-2 p-2 border rounded">
                  <div className="text-xs font-medium text-gray-700">On-chain (Testnet):</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">STX:</span>
                    <span className="font-mono">{chainBalance.stx}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">sBTC:</span>
                    <span className="font-mono">{chainBalance.sbtc}</span>
                  </div>
                </div>
              )}
            </div>

            {/* sBTC Operations */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">sBTC Operations:</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => console.log('sBTC Deposit')}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  Deposit BTC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => console.log('sBTC Withdrawal')}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  Withdraw BTC
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshBalance}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
                disabled={isDisconnecting}
                className="flex-1"
              >
                {isDisconnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Connection Options */
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No sBTC wallet connected</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleConnect('testnet')}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bitcoin className="w-4 h-4 mr-2" />
                    Connect Wallet (Testnet)
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleConnect('mainnet')}
                variant="outline"
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bitcoin className="w-4 h-4 mr-2" />
                    Connect Wallet (Mainnet)
                  </>
                )}
              </Button>
            </div>

            {/* Wallet Installation Guide */}
            {!walletDetection.xverse && !walletDetection.hiro && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Install a Bitcoin Wallet:</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <p>• <a href="https://www.xverse.app/" target="_blank" rel="noopener noreferrer" className="underline">Xverse</a> - Mobile Bitcoin wallet with sBTC support</p>
                  <p>• <a href="https://wallet.hiro.so/" target="_blank" rel="noopener noreferrer" className="underline">Hiro</a> - Browser extension for Stacks</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  These wallets support sBTC operations on Stacks
                </p>
              </div>
            )}

            {/* sBTC Information */}
            <div className="p-3 bg-brizo-50 border border-brizo-200 rounded-md">
              <h4 className="text-sm font-medium text-brizo-800 mb-2">About sBTC:</h4>
              <p className="text-xs text-brizo-700">
                sBTC is a Bitcoin-backed token on Stacks that allows you to use Bitcoin in DeFi applications. 
                Connect your wallet to deposit BTC and receive sBTC, or withdraw sBTC to get BTC back.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
