'use client'

import { useState } from 'react'
import { Bitcoin, CreditCard, CheckCircle, X } from 'lucide-react'
import { createPayment } from '@/lib/api'

interface PayWithsBTCProps {
  amount: number
  description: string
  merchantId: string
  className?: string
  theme?: 'light' | 'dark'
  buttonText?: string
  showAmount?: boolean
}

export default function PayWithsBTC({
  amount,
  description,
  merchantId,
  className = '',
  theme = 'light',
  buttonText = 'Pay with sBTC',
  showAmount = true
}: PayWithsBTCProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      const payment = await createPayment({
        amount,
        description,
        merchantId,
        donation: false
      })

      setPaymentId(payment.paymentId)
      setShowSuccess(true)
      
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('Failed to create payment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const closeSuccess = () => {
    setShowSuccess(false)
    setPaymentId(null)
  }

  const isLightTheme = theme === 'light'
  const bgColor = isLightTheme ? 'bg-white' : 'bg-gray-800'
  const textColor = isLightTheme ? 'text-gray-900' : 'text-white'
  const borderColor = isLightTheme ? 'border-gray-200' : 'border-gray-700'
  const cardBg = isLightTheme ? 'bg-gray-50' : 'bg-gray-700'

  return (
    <>
      <div className={`${bgColor} border ${borderColor} rounded-lg p-4 shadow-sm ${className}`}>
        {showAmount && (
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-brizo-600 mb-1">
              {amount} sBTC
            </div>
            <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
              {description}
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isLoading}
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
              <span>{buttonText}</span>
            </div>
          )}
        </button>

        <div className="mt-3 text-center">
          <p className={`text-xs ${isLightTheme ? 'text-gray-500' : 'text-gray-400'}`}>
            Powered by <span className="font-medium">Brizo</span> on Stacks
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${bgColor} rounded-lg p-6 max-w-md w-full shadow-xl`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                Payment Created!
              </h3>
              <p className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'} mb-6`}>
                Your payment has been created successfully. 
                You'll be redirected to complete the transaction.
              </p>

              {paymentId && (
                <div className={`${cardBg} rounded-lg p-4 mb-6`}>
                  <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'} mb-2`}>
                    Payment ID:
                  </p>
                  <p className="font-mono text-sm break-all">{paymentId}</p>
                </div>
              )}

              <button
                onClick={closeSuccess}
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
