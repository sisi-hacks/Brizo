'use client'

import { useEffect, useState } from 'react'
import { Bitcoin, Heart, CheckCircle, X } from 'lucide-react'
import { createPayment } from '@/lib/api'
import { walletService } from '@/lib/wallet'
import { sendSbtcTransfer } from '@/lib/sbtc'

interface DonateWithsBTCProps {
  merchantId: string
  className?: string
  theme?: 'light' | 'dark'
  presetAmounts?: number[]
  showCustomAmount?: boolean
}

type DonorEntry = { address: string; amount: number; txid: string; ts: number }

export default function DonateWithsBTC({
  merchantId,
  className = '',
  theme = 'light',
  presetAmounts = [0.001, 0.005, 0.01, 0.05],
  showCustomAmount = true
}: DonateWithsBTCProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [donationId, setDonationId] = useState<string | null>(null)
  const [history, setHistory] = useState<DonorEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('brizo_donations')
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const getFinalAmount = (): number => {
    if (selectedAmount !== null) {
      return selectedAmount
    }
    if (customAmount && !isNaN(parseFloat(customAmount))) {
      return parseFloat(customAmount)
    }
    return 0
  }

  const persistHistory = (next: DonorEntry[]) => {
    setHistory(next)
    try { localStorage.setItem('brizo_donations', JSON.stringify(next)) } catch {}
  }

  const handleDonation = async () => {
    const amount = getFinalAmount()
    
    if (amount <= 0) {
      alert('Please select or enter a valid amount')
      return
    }

    setIsLoading(true)

    try {
      // Trigger real sBTC transfer via connected wallet
      const recipient = process.env.NEXT_PUBLIC_SBTC_RECIPIENT || 'ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB'
      const tx = await sendSbtcTransfer({ 
        recipient, 
        amount, 
        memo: `Donation to ${merchantId}`,
        network: 'testnet' 
      })

      const payment = await createPayment({
        amount,
        description: `Donation to ${merchantId}`,
        merchantId,
        donation: true
      })

      setDonationId(payment.paymentId)
      setShowThankYou(true)
      
      // Store donor history (address, amount, txid)
      const addr = walletService.getAccountAddress?.() || 'anonymous'
      const entry: DonorEntry = { address: addr, amount, txid: tx?.txId || payment.paymentId, ts: Date.now() }
      const next = [entry, ...history].slice(0, 20)
      persistHistory(next)
      
      // Reset form
      setSelectedAmount(null)
      setCustomAmount('')
      
    } catch (error) {
      console.error('Error creating donation:', error)
      alert('Failed to create donation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const closeThankYou = () => {
    setShowThankYou(false)
    setDonationId(null)
  }

  const isLightTheme = theme === 'light'
  const bgColor = isLightTheme ? 'bg-white' : 'bg-gray-800'
  const textColor = isLightTheme ? 'text-gray-900' : 'text-white'
  const borderColor = isLightTheme ? 'border-gray-200' : 'border-gray-700'
  const cardBg = isLightTheme ? 'bg-gray-50' : 'bg-gray-700'

  return (
    <>
      <div className={`${bgColor} border ${borderColor} rounded-lg p-6 shadow-sm ${className}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-brizo-500 to-bitcoin-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
            Support with sBTC
          </h3>
          <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
            Make a Bitcoin donation using Stacks
          </p>
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${textColor} mb-3`}>
            Select Amount (sBTC)
          </label>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedAmount === amount
                    ? 'border-brizo-500 bg-brizo-50 text-brizo-700'
                    : `${borderColor} ${isLightTheme ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`
                }`}
              >
                <span className="font-medium">{amount}</span>
                <span className="text-xs block opacity-75">sBTC</span>
              </button>
            ))}
          </div>

          {showCustomAmount && (
            <div>
              <label className={`block text-sm font-medium ${textColor} mb-2`}>
                Custom Amount
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="0.001"
                className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:ring-2 focus:ring-brizo-500 focus:border-brizo-500 transition-colors ${
                  isLightTheme ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'
                }`}
              />
            </div>
          )}
        </div>

        {/* Donate Button */}
        <button
          onClick={handleDonation}
          disabled={isLoading || getFinalAmount() <= 0}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLightTheme
              ? 'bg-brizo-600 hover:bg-brizo-700 text-white'
              : 'bg-bitcoin-500 hover:bg-bitcoin-600 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Bitcoin className="w-4 h-4" />
              <span>Donate with sBTC</span>
            </div>
          )}
        </button>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className={`text-xs ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
            Powered by <span className="font-medium">Brizo</span> on Stacks
          </p>
        </div>
      </div>

      {/* Donor History */}
      {history.length > 0 && (
        <div className={`mt-6 ${bgColor} border ${borderColor} rounded-lg p-4`}>
          <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Recent Donations</h4>
          <ul className="space-y-2">
            {history.map((h, idx) => (
              <li key={`${h.txid}-${idx}`} className="text-sm flex items-center justify-between">
                <span className="font-mono truncate max-w-[50%]">{h.address}</span>
                <span className="text-gray-500">{new Date(h.ts).toLocaleString()}</span>
                <span className="font-medium">{h.amount} sBTC</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgColor} rounded-lg p-6 max-w-md w-full shadow-xl`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                Thank You!
              </h3>
              <p className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'} mb-6`}>
                Your donation has been created successfully. 
                You'll receive a confirmation email shortly.
              </p>

              {donationId && (
                <div className={`${cardBg} rounded-lg p-4 mb-6`}>
                  <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'} mb-2`}>
                    Donation ID:
                  </p>
                  <p className="font-mono text-sm break-all">{donationId}</p>
                </div>
              )}

              <button
                onClick={closeThankYou}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isLightTheme
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
