import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bitcoin, ArrowLeft, Code, Book, Key } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/merchant">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-8 w-8 text-secondary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Brizo</h1>
                <p className="text-xs text-muted-foreground">API Documentation</p>
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
            <Link
              href="/merchant/donations"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Donations
            </Link>
            <Link href="/merchant/api" className="text-sm font-medium text-primary">
              API Docs
            </Link>
          </nav>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">API Documentation</h1>
          <p className="text-muted-foreground">Integrate Brizo's Bitcoin payment system into your applications</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-secondary">Authentication</CardTitle>
              <CardDescription>Learn how to authenticate your API requests using API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-secondary">Payment Links API</CardTitle>
              <CardDescription>Create and manage payment links programmatically</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-secondary">Webhooks</CardTitle>
              <CardDescription>Receive real-time notifications about payment events</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>Complete API documentation and examples</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <div className="text-center space-y-2">
                <Book className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">API documentation coming soon</p>
                <Badge variant="secondary">Feature in development</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
