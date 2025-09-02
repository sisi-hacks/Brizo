"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bitcoin, Heart, CheckCircle } from "lucide-react"

interface DonateWithsBTCProps {
  merchantName?: string
  merchantLogo?: string
  customAmounts?: number[]
  allowCustomAmount?: boolean
  theme?: "light" | "dark"
  className?: string
}

export function DonateWithsBTC({
  merchantName = "Support Creator",
  merchantLogo,
  customAmounts = [5, 10, 20],
  allowCustomAmount = true,
  theme = "light",
  className = "",
}: DonateWithsBTCProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [showThankYou, setShowThankYou] = useState(false)
  const [donationSummary, setDonationSummary] = useState<{
    amount: number
    timestamp: string
  } | null>(null)

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const handleDonate = () => {
    const amount = selectedAmount || Number.parseFloat(customAmount)
    if (!amount || amount <= 0) return

    // Convert USD to sBTC (mock conversion rate: 1 sBTC = $50,000)
    const sBTCAmount = (amount / 50000).toFixed(8)

    setDonationSummary({
      amount: Number.parseFloat(sBTCAmount),
      timestamp: new Date().toLocaleString(),
    })
    setShowThankYou(true)

    // Reset form
    setSelectedAmount(null)
    setCustomAmount("")
  }

  const getSelectedAmount = () => {
    return selectedAmount || Number.parseFloat(customAmount) || 0
  }

  return (
    <>
      <Card
        className={`w-full max-w-sm mx-auto hover:shadow-lg transition-all duration-300 hover:scale-105 ${className}`}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {merchantLogo ? (
              <img src={merchantLogo || "/placeholder.svg"} alt={merchantName} className="w-8 h-8 rounded-full" />
            ) : (
              <Heart className="w-6 h-6 text-secondary transition-transform hover:scale-110" />
            )}
            <CardTitle className="text-lg font-semibold text-foreground">{merchantName}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
            Powered by Bitcoin
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Preset Amount Buttons */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Choose an amount:</p>
            <div className="grid grid-cols-3 gap-2">
              {customAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  className={
                    selectedAmount === amount
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all duration-200"
                      : "hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-105 transition-all duration-200"
                  }
                  onClick={() => handleAmountSelect(amount)}
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          {allowCustomAmount && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Or enter custom amount:</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Amount Preview */}
          {getSelectedAmount() > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">You're donating:</p>
              <p className="text-lg font-semibold text-primary">${getSelectedAmount().toFixed(2)} USD</p>
              <p className="text-xs text-muted-foreground">≈ {(getSelectedAmount() / 50000).toFixed(8)} sBTC</p>
            </div>
          )}

          {/* Donate Button */}
          <Button
            onClick={handleDonate}
            disabled={getSelectedAmount() <= 0}
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold hover:scale-105 transition-all duration-200 hover:shadow-lg"
            size="lg"
          >
            <Bitcoin className="mr-2 h-5 w-5" />
            Donate with sBTC
          </Button>

          <p className="text-xs text-center text-muted-foreground">Secure Bitcoin donation powered by Brizo</p>
        </CardContent>
      </Card>

      {/* Thank You Dialog */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              Thank you for your donation!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-150">
              Your support means the world to us
            </DialogDescription>
          </DialogHeader>

          {donationSummary && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-secondary">{donationSummary.amount} sBTC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <span className="text-sm text-foreground">{donationSummary.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={() => setShowThankYou(false)} className="bg-primary hover:bg-primary/90">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
