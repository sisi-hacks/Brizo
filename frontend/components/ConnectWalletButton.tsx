'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { showConnect } from '@stacks/connect'
import { openContractCall, type ContractCallRegularOptions } from '@stacks/transactions'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Brizo'
const APP_ICON = process.env.NEXT_PUBLIC_APP_ICON || '/favicon.ico'

export default function ConnectWalletButton() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setConnecting(true)
      await new Promise<void>((resolve, reject) => {
        showConnect({
          appDetails: { name: APP_NAME, icon: APP_ICON },
          userSession: undefined as any,
          onFinish: payload => {
            try {
              const addrs = (payload as any)?.authResponsePayload?.profile?.stxAddress || {}
              const testnet = addrs?.testnet || (payload as any)?.addresses?.testnet
              setAddress(testnet || null)
            } catch {}
            resolve()
          },
          onCancel: () => resolve(),
        })
      })
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Button size="sm" variant="outline" className="h-8 px-3" onClick={handleConnect} disabled={connecting}>
      {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : connecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  )
}
