"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bitcoin, Copy, QrCode, TrendingUp, Users, DollarSign, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

// Mock data for demonstration
const recentPayments = [
  {
    id: "PAY_001",
    amount: "0.0025",
    status: "paid",
    timestamp: "2024-01-15 14:30",
    description: "Premium Course Access",
  },
  {
    id: "PAY_002",
    amount: "0.001",
    status: "pending",
    timestamp: "2024-01-15 13:45",
    description: "Monthly Donation",
  },
  {
    id: "PAY_003",
    amount: "0.005",
    status: "paid",
    timestamp: "2024-01-15 12:20",
    description: "Digital Product",
  },
  {
    id: "PAY_004",
    amount: "0.0015",
    status: "paid",
    timestamp: "2024-01-15 11:10",
    description: "Support Donation",
  },
]

export default function MerchantDashboard() {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [isDonation, setIsDonation] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [showQR, setShowQR] = useState(false)

  const handleGenerateLink = () => {
    if (!description || !amount) return

    // Generate a mock payment link
    const paymentId = `PAY_${Date.now()}`
    const link = `${window.location.origin}/checkout/${paymentId}`
    setGeneratedLink(link)
    setShowQR(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-8 w-8 text-secondary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Brizo</h1>
                <p className="text-xs text-muted-foreground">Merchant Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/merchant" className="text-sm font-medium text-primary">
              Dashboard
            </Link>
            <Link
              href="/merchant/donations"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Donations
            </Link>
            <Link
              href="/merchant/api"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              API Docs
            </Link>
          </nav>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Analytics Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">0.0245 sBTC</div>
              <p className="text-xs text-muted-foreground">≈ $1,225 USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Number of Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">127</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">94.2%</div>
              <p className="text-xs text-muted-foreground">Payment completion rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Payment Link</CardTitle>
              <CardDescription>Generate a secure payment link for your product or service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Product / Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product name or description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (sBTC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="donation-mode" checked={isDonation} onCheckedChange={setIsDonation} />
                <Label htmlFor="donation-mode" className="text-sm">
                  Enable as donation (optional amount)
                </Label>
              </div>

              <Button
                onClick={handleGenerateLink}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!description || !amount}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Generate Checkout Link
              </Button>

              {generatedLink && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Link</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={generatedLink} readOnly className="text-xs" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showQR && (
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg">
                        <QRCodeSVG value={generatedLink} size={150} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                      <TableCell className="font-medium">{payment.amount} sBTC</TableCell>
                      <TableCell>
                        <Badge
                          variant={payment.status === "paid" ? "default" : "secondary"}
                          className={
                            payment.status === "paid"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payment.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
