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

export async function POST(req: NextRequest, { params }: { params: { paymentId: string } }) {
  try {
    const { sbtcTxId, walletAddress } = await req.json()
    if (!sbtcTxId) return NextResponse.json({ error: 'Missing sbtcTxId' }, { status: 400 })

    const store = getStore()
    const item = store.get(params.paymentId)
    if (!item) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

    item.status = 'paid'
    item.paidAt = new Date().toISOString()
    item.sbtcTxId = sbtcTxId
    store.set(params.paymentId, item)

    return NextResponse.json({
      success: true,
      paymentId: item.paymentId,
      status: item.status,
      sbtcTxId: item.sbtcTxId,
      walletAddress: walletAddress || 'unknown',
      message: 'Payment marked as paid',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to process payment' }, { status: 500 })
  }
}


