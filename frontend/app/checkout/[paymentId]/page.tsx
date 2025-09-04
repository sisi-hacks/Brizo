'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, CheckCircle, Clock, X, ArrowLeft, Wallet } from 'lucide-react'
import Link from 'next/link'
import { checkPaymentStatus, processPayment } from '@/lib/api'
import { walletService, PaymentRequest } from '@/lib/wallet'
import WalletConnect from '@/components/WalletConnect'

export default function CheckoutPage() {
  const params = useParams()
  const paymentId = params.paymentId as string
  
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletConnected, setWalletConnected] = useState(false)

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails()
    }
    
    // Check wallet connection status
    const checkWallet = () => {
      setWalletConnected(walletService.isWalletConnected())
    }
    
    checkWallet()
    const unsubscribe = walletService.subscribe((state) => {
      setWalletConnected(state.isConnected)
    })
    
    return unsubscribe
  }, [paymentId])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/check-status/${paymentId}`)
      if (!response.ok) {
        throw new Error('Payment not found')
      }
      const data = await response.json()
      setPayment(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      if (!walletConnected) {
        setError('Please connect your wallet first')
        return
      }

      setProcessing(true)
      setError(null)
      
      // Create payment request for wallet service
      const paymentRequest: PaymentRequest = {
        amount: payment.payment.amount,
        to: payment.merchant.walletAddress,
        description: payment.payment.description,
        merchantId: payment.merchant.id
      }
      
      // Send payment through wallet
      const result = await walletService.sendPayment(paymentRequest)
      
      if (result.success && result.txId) {
        // Mark payment as processed in backend
        await processPayment(paymentId, {
          sbtcTxId: result.txId,
          walletAddress: walletService.getAccountAddress() || 'unknown'
        })
        
        // Refresh payment status
        await fetchPaymentDetails()
      } else {
        throw new Error(result.error || 'Payment failed')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brizo-600"></div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <X className="w-5 h-5 mr-2" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Payment not found'}</p>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPaid = payment.payment.status === 'paid'
  const isPending = payment.payment.status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Brizo
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Checkout */}
          <div className="lg:col-span-2">
            {/* Payment Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Details</span>
                  <Badge variant={isPaid ? "default" : isPending ? "secondary" : "destructive"}>
                    {payment.payment.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-lg">{payment.payment.amount} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span>{payment.payment.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant:</span>
                  <span>{payment.merchant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(payment.payment.createdAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Actions */}
            {isPending && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bitcoin className="w-5 h-5 mr-2" />
                    Complete Payment
                  </CardTitle>
                  <CardDescription>
                    {walletConnected 
                      ? 'Click the button below to process your sBTC payment'
                      : 'Connect your Hiro Wallet to complete the payment'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {walletConnected ? (
                    <Button 
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Bitcoin className="w-4 h-4 mr-2" />
                          Pay {payment.payment.amount} sBTC
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Connect your wallet to continue</p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Success State */}
            {isPaid && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Payment Successful!
                  </CardTitle>
                  <CardDescription>
                    Your payment has been processed successfully
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono">{payment.payment.sbtcTxId || 'mock-tx-id'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processed:</span>
                      <span>{new Date(payment.payment.processedAt || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button asChild className="w-full mt-4">
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pending State */}
            {isPending && !processing && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center text-yellow-600">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="font-medium">Payment Pending</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    Your payment is waiting to be processed. Connect your wallet and click the payment button above to complete the transaction.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Wallet Connection */}
            <div className="mb-6">
              <WalletConnect />
            </div>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{payment.payment.amount} sBTC</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Fee:</span>
                  <span>~0.00001 STX</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{payment.payment.amount} sBTC</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Security</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <p>• Payments are processed on Stacks blockchain</p>
                <p>• Your private keys never leave your wallet</p>
                <p>• All transactions are immutable and verifiable</p>
                <p>• Powered by sBTC (Bitcoin on Stacks)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}