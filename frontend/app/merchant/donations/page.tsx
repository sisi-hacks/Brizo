"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bitcoin, ArrowLeft, TrendingUp, Users, DollarSign } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

// Mock data for charts
const monthlyData = [
  { month: "Jul", donations: 0.0045, donors: 23 },
  { month: "Aug", donations: 0.0067, donors: 34 },
  { month: "Sep", donations: 0.0089, donors: 45 },
  { month: "Oct", donations: 0.0123, donors: 67 },
  { month: "Nov", donations: 0.0156, donors: 89 },
  { month: "Dec", donations: 0.0245, donors: 127 },
]

const dailyData = [
  { day: "1", amount: 0.0012 },
  { day: "2", amount: 0.0008 },
  { day: "3", amount: 0.0015 },
  { day: "4", amount: 0.0023 },
  { day: "5", amount: 0.0019 },
  { day: "6", amount: 0.0034 },
  { day: "7", amount: 0.0028 },
]

export default function DonationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="hover:scale-105 transition-transform">
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-8 w-8 text-secondary transition-transform hover:scale-110" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Brizo</h1>
                <p className="text-xs text-muted-foreground">Donations Analytics</p>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/merchant"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link href="/merchant/donations" className="text-sm font-medium text-primary">
              Donations
            </Link>
            <Link
              href="/merchant/api"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              API Docs
            </Link>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Donation Analytics</h1>
          <p className="text-muted-foreground">Track your donation performance and donor engagement</p>
        </div>

        {/* Enhanced Analytics Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">0.0245 sBTC</div>
              <p className="text-xs text-muted-foreground">≈ $1,225 USD</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+15.2% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">127</div>
              <p className="text-xs text-muted-foreground">Unique contributors</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <Bitcoin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">0.00193 sBTC</div>
              <p className="text-xs text-muted-foreground">≈ $9.65 USD</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+8.3% from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Monthly Donation Trends</CardTitle>
              <CardDescription>Donation amounts and donor count over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="donations" fill="hsl(var(--secondary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
              <CardDescription>Daily donation amounts for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
