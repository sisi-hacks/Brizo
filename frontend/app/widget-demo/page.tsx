import { DonateWithsBTC } from "@/components/donate-with-sbtc"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bitcoin, ArrowLeft, Code } from "lucide-react"
import Link from "next/link"

export default function WidgetDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-8 w-8 text-secondary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Brizo</h1>
                <p className="text-xs text-muted-foreground">Widget Demo</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Donation Widget Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how the Brizo donation widget looks and works. Perfect for creators, charities, and content creators.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Widget Demo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Widget</CardTitle>
                <CardDescription>Try the donation widget below - it's fully functional!</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <DonateWithsBTC
                  merchantName="Open Source Project"
                  customAmounts={[5, 10, 25]}
                  allowCustomAmount={true}
                />
              </CardContent>
            </Card>

            {/* Different Variations */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Creator Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonateWithsBTC merchantName="Content Creator" customAmounts={[3, 5, 10]} allowCustomAmount={false} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Charity Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonateWithsBTC merchantName="Animal Shelter" customAmounts={[10, 25, 50]} allowCustomAmount={true} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Integration Code */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="mr-2 h-5 w-5" />
                  Integration Code
                </CardTitle>
                <CardDescription>Copy and paste this code to embed the widget on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm text-foreground">
                    <code>{`import { DonateWithsBTC } from '@brizo/widget'

<DonateWithsBTC
  merchantName="Your Name"
  customAmounts={[5, 10, 20]}
  allowCustomAmount={true}
/>`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Widget Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-foreground">Customizable Amounts</p>
                    <p className="text-sm text-muted-foreground">Set preset donation amounts or allow custom inputs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-foreground">Instant Confirmation</p>
                    <p className="text-sm text-muted-foreground">Beautiful thank you modal with donation summary</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-foreground">Responsive Design</p>
                    <p className="text-sm text-muted-foreground">Works perfectly on desktop and mobile devices</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-foreground">Easy Integration</p>
                    <p className="text-sm text-muted-foreground">Drop-in component with minimal setup required</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Ready to get started?</CardTitle>
                <CardDescription>Add Bitcoin donations to your website in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/merchant">Create Your Widget</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
