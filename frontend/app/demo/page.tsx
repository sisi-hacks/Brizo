'use client'

import Link from 'next/link'
import { ArrowLeft, Bitcoin, Heart, CreditCard } from 'lucide-react'
import DonateWithsBTC from '@/components/DonateWithsBTC'
import PayWithsBTC from '@/components/PayWithsBTC'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brizo-500 to-bitcoin-500 rounded-lg flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Brizo</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Brizo Components Demo</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how easy it is to integrate Bitcoin payments and donations into your website using our embeddable components.
          </p>
        </div>

        {/* Components Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Donation Widget */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-bitcoin-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-bitcoin-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Donation Widget</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Perfect for creators, charities, and content platforms. Accept Bitcoin donations with customizable amounts.
            </p>

            <DonateWithsBTC 
              merchantId="demo-merchant"
              theme="light"
              presetAmounts={[0.001, 0.005, 0.01, 0.025]}
              showCustomAmount={true}
            />

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Usage:</h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`<DonateWithsBTC 
  merchantId="your-merchant-id"
  theme="light"
  presetAmounts={[0.001, 0.005, 0.01, 0.025]}
  showCustomAmount={true}
/>`}
              </pre>
            </div>
          </div>

          {/* Payment Button */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-brizo-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-brizo-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Button</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Simple payment buttons for products, services, or subscriptions. Clean and customizable design.
            </p>

            <PayWithsBTC 
              amount={0.01}
              description="Premium Content Access"
              merchantId="demo-merchant"
              theme="light"
              buttonText="Buy with sBTC"
              showAmount={true}
            />

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Usage:</h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`<PayWithsBTC 
  amount={0.01}
  description="Premium Content Access"
  merchantId="your-merchant-id"
  theme="light"
  buttonText="Buy with sBTC"
  showAmount={true}
/>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Dark Theme Examples */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="card bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-bitcoin-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-bitcoin-600" />
              </div>
              <h2 className="text-xl font-semibold text-white">Dark Theme Donation</h2>
            </div>
            
            <DonateWithsBTC 
              merchantId="demo-merchant"
              theme="dark"
              presetAmounts={[0.001, 0.005, 0.01]}
              showCustomAmount={false}
            />
          </div>

          <div className="card bg-gray-800 border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-brizo-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-brizo-600" />
              </div>
              <h2 className="text-xl font-semibold text-white">Dark Theme Payment</h2>
            </div>
            
            <PayWithsBTC 
              amount={0.005}
              description="Digital Download"
              merchantId="demo-merchant"
              theme="dark"
              buttonText="Download with sBTC"
              showAmount={true}
            />
          </div>
        </div>

        {/* Integration Guide */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Integration Guide</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brizo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-brizo-600">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Install Dependencies</h4>
              <p className="text-sm text-gray-600">
                Add Stacks.js and our components to your project
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-brizo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-brizo-600">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Import Components</h4>
              <p className="text-sm text-gray-600">
                Use our pre-built components or customize them
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-brizo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-brizo-600">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Start Accepting Payments</h4>
              <p className="text-sm text-gray-600">
                Your users can now pay with Bitcoin via sBTC
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Quick Start Code:</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
{`// Install dependencies
npm install @stacks/connect-react @stacks/transactions

// Import components
import { DonateWithsBTC } from 'brizo-components'
import { PayWithsBTC } from 'brizo-components'

// Use in your app
<DonateWithsBTC merchantId="your-id" />
<PayWithsBTC amount={0.01} description="Product" merchantId="your-id" />`}
            </pre>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-brizo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="w-6 h-6 text-brizo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">sBTC Native</h3>
            <p className="text-sm text-gray-600">
              Built on Stacks for seamless Bitcoin payments
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-bitcoin-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-bitcoin-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Customizable</h3>
            <p className="text-sm text-gray-600">
              Themes, amounts, and styling options
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-brizo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-brizo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Integration</h3>
            <p className="text-sm text-gray-600">
              Drop-in components for any website
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-bitcoin-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-6 h-6 text-bitcoin-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analytics Ready</h3>
            <p className="text-sm text-gray-600">
              Track donations and payments in real-time
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-brizo-600 to-bitcoin-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Integrate?</h2>
            <p className="text-xl text-brizo-100 mb-6">
              Start accepting Bitcoin payments in minutes with our simple components
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/merchant" className="bg-white text-brizo-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                Get Started
              </Link>
              <a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white hover:bg-white hover:text-brizo-600 font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
