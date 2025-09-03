import { NextRequest, NextResponse } from 'next/server'

type PaymentRecord = {
  paymentId: string
  amount: number
  description: string
  merchantId: string
  donation: boolean
  status: 'pending' | 'paid'
  createdAt: string
  paidAt?: string
  sbtcTxId?: string
  checkoutUrl: string
}

declare global {
  // eslint-disable-next-line no-var
  var __BRIZO_PAYMENTS__: Map<string, PaymentRecord> | undefined
}

function getStore() {
  if (!global.__BRIZO_PAYMENTS__) {
    global.__BRIZO_PAYMENTS__ = new Map<string, PaymentRecord>()
  }
  return global.__BRIZO_PAYMENTS__
}

export async function GET(_req: NextRequest, { params }: { params: { paymentId: string } }) {
  const store = getStore()
  const item = store.get(params.paymentId)
  if (!item) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  return NextResponse.json(item)
}


