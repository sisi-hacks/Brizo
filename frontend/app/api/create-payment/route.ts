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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, description, merchantId, donation = false } = body || {}

    if (!amount || !description || !merchantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    const origin = req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('x-forwarded-host')}`
      : req.nextUrl.origin

    const checkoutUrl = `${origin}/checkout/${id}`

    const record: PaymentRecord = {
      paymentId: id,
      amount: Number(amount),
      description: String(description),
      merchantId: String(merchantId),
      donation: Boolean(donation),
      status: 'pending',
      createdAt: new Date().toISOString(),
      checkoutUrl,
    }

    const store = getStore()
    store.set(id, record)

    return NextResponse.json(record)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create payment' }, { status: 500 })
  }
}


