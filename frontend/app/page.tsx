'use client'

import Link from 'next/link'
import { ArrowRight, Bitcoin, Zap, Shield, Globe, Heart } from 'lucide-react'
import DonateWithsBTC from '@/components/DonateWithsBTC'
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brizo-500 to-bitcoin-500 rounded-lg flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">Brizo</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/merchant" className="btn-secondary">
                Merchant Dashboard
              </Link>
              <Link href="/demo" className="btn-primary">
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brizo-600 to-brizo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Flowing Bitcoin Payments,
              <span className="block text-bitcoin-400">Effortlessly</span>
            </h1>
            <p className="text-xl md:text-2xl text-brizo-100 mb-8 max-w-3xl mx-auto">
              Accept Bitcoin payments through Stacks using sBTC. Built for creators, 
              merchants, and charities who want seamless crypto payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/merchant" className="btn-primary text-lg px-8 py-4">
                Start Accepting Payments
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/demo" className="btn-secondary text-lg px-8 py-4">
                View Demo
              </Link>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-brizo-400/20 rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-bitcoin-400/20 rounded-full opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-brizo-300/20 rounded-full opacity-60 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Brizo?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built on the most secure and scalable Bitcoin layer, Stacks
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-brizo-100 dark:bg-brizo-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brizo-200 dark:group-hover:bg-brizo-800 transition-colors duration-300">
                <Bitcoin className="w-8 h-8 text-brizo-600 dark:text-brizo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                sBTC Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Native Bitcoin payments through Stacks' sBTC protocol, ensuring 
                fast and secure transactions.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-bitcoin-100 dark:bg-bitcoin-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-bitcoin-200 dark:group-hover:bg-bitcoin-800 transition-colors duration-300">
                <Zap className="w-8 h-8 text-bitcoin-600 dark:text-bitcoin-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sub-second payment confirmations with Stacks' unique consensus 
                mechanism.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-brizo-100 dark:bg-brizo-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brizo-200 dark:group-hover:bg-brizo-800 transition-colors duration-300">
                <Shield className="w-8 h-8 text-brizo-600 dark:text-brizo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure by Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built on Bitcoin's security with additional smart contract 
                capabilities through Clarity.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-bitcoin-100 dark:bg-bitcoin-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-bitcoin-200 dark:group-hover:bg-bitcoin-800 transition-colors duration-300">
                <Globe className="w-8 h-8 text-bitcoin-600 dark:text-bitcoin-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Embeddable Widgets
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Easy-to-integrate donation and payment widgets for any website 
                or application.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-brizo-100 dark:bg-brizo-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brizo-200 dark:group-hover:bg-brizo-800 transition-colors duration-300">
                <Heart className="w-8 h-8 text-brizo-600 dark:text-brizo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Creator Friendly
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Perfect for content creators, artists, and charities to accept 
                Bitcoin donations and payments.
              </p>
            </div>

            <div className="card text-center group hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
              <div className="w-16 h-16 bg-bitcoin-100 dark:bg-bitcoin-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-bitcoin-200 dark:group-hover:bg-bitcoin-800 transition-colors duration-300">
                <ArrowRight className="w-8 h-8 text-bitcoin-600 dark:text-bitcoin-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Easy Integration
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simple API endpoints and React components for seamless 
                integration into existing applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Support Brizo Development
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Help us build the future of Bitcoin payments. Your donations support open-source development and innovation.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <DonateWithsBTC 
              merchantId="brizo-development"
              theme="light"
              presetAmounts={[0.001, 0.005, 0.01, 0.025]}
              showCustomAmount={true}
            />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              💡 Want to integrate donations into your own site? 
              <Link href="/demo" className="text-brizo-600 dark:text-brizo-400 hover:text-brizo-700 dark:hover:text-brizo-300 font-medium ml-1">
                Check out our demo →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brizo-600 to-brizo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Accepting Bitcoin?
          </h2>
          <p className="text-xl text-brizo-100 mb-8">
            Join the future of payments with Brizo's sBTC-powered gateway
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant" className="bg-white text-brizo-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors duration-200">
              Get Started Now
            </Link>
            <Link href="/demo" className="border-2 border-white text-white hover:bg-white hover:text-brizo-600 font-semibold py-4 px-8 rounded-lg transition-colors duration-200">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-brizo-500 to-bitcoin-500 rounded-lg flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Brizo</span>
              </div>
              <p className="text-gray-400">
                Flowing Bitcoin payments, effortlessly.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/merchant" className="hover:text-white transition-colors">Merchant Dashboard</Link></li>
                <li><Link href="/demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Stacks Docs</a></li>
                <li><a href="https://www.hiro.so" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Hiro Wallet</a></li>
                <li><a href="https://docs.stacks.co/concepts/sbtc" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">sBTC Guide</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Brizo. All rights reserved. Built with ❤️ on Stacks.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
