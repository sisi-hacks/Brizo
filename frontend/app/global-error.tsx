'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bitcoin, RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Something went wrong!</CardTitle>
                <CardDescription>
                  An unexpected error occurred. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  We're sorry, but something went wrong. This might be a temporary issue.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-gray-100 rounded text-left">
                    <p className="text-xs font-mono text-gray-700">
                      Error: {error.message}
                    </p>
                    {error.digest && (
                      <p className="text-xs font-mono text-gray-500 mt-1">
                        Digest: {error.digest}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={reset} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">
                      <Home className="w-4 h-4 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    If this problem persists, please contact support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}
