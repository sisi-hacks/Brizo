'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, Wallet, LogOut, RefreshCw } from 'lucide-react'
import { walletService, WalletState } from '@/lib/wallet'

interface WalletConnectProps {
  onConnect?: (state: WalletState) => void
  onDisconnect?: () => void
  className?: string
}

export default function WalletConnect({ onConnect, onDisconnect, className = '' }: WalletConnectProps) {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState())
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    const unsubscribe = walletService.subscribe((state) => {
      setWalletState(state)
      if (onConnect && state.isConnected) {
        onConnect(state)
      }
      if (onDisconnect && !state.isConnected) {
        onDisconnect()
      }
    })

    return unsubscribe
  }, [onConnect, onDisconnect])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await walletService.connectWallet('testnet')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      await walletService.disconnectWallet()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleRefresh = async () => {
    // Trigger a refresh of wallet state
    const currentState = walletService.getState()
    setWalletState(currentState)
  }

  if (walletState.isConnected) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-green-700">
            <Wallet className="w-5 h-5 mr-2" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Your Hiro Wallet is connected to {walletState.network}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                {walletState.account?.addresses[walletState.network]?.slice(0, 8)}...
                {walletState.account?.addresses[walletState.network]?.slice(-6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Network:</span>
              <Badge variant="outline" className="capitalize">
                {walletState.network}
              </Badge>
            </div>
          </div>

          {/* Balances */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">STX Balance:</span>
              <span className="font-medium">
                {parseFloat(walletState.balance.stx).toFixed(6)} STX
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">sBTC Balance:</span>
              <span className="font-medium">
                {parseFloat(walletState.balance.sbtc).toFixed(8)} sBTC
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-gray-200 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Bitcoin className="w-5 h-5 mr-2" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your Hiro Wallet to make sBTC payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Hiro Wallet
            </>
          )}
        </Button>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Don't have Hiro Wallet?{' '}
            <a 
              href="https://www.hiro.so/wallet/install-web-extension" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brizo-600 hover:text-brizo-700 underline"
            >
              Install it here
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
