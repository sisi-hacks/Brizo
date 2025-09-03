export type CreateAccountResponse = {
  success: boolean
  accountId: string
  address: string
  network: 'testnet' | 'mainnet'
  publicKey: string
  btcAddress?: string
  privateKey?: string
  backupInstructions?: any
}

export type ImportAccountResponse = CreateAccountResponse & { imported?: boolean }

export type FaucetResponse = {
  success: boolean
  address: string
  stacking?: boolean
  message?: string
  txId?: string | null
  error?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    cache: 'no-store'
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const stacksApi = {
  createAccount: (network: 'testnet' | 'mainnet', passphrase: string) =>
    http<CreateAccountResponse>('/stacks/accounts/create', {
      method: 'POST',
      body: JSON.stringify({ network, passphrase })
    }),

  importAccount: (privateKey: string, network: 'testnet' | 'mainnet', passphrase: string) =>
    http<ImportAccountResponse>('/stacks/accounts/import', {
      method: 'POST',
      body: JSON.stringify({ privateKey, network, passphrase })
    }),

  listAccounts: () => http<{ accounts: any[]; total: number; timestamp: string }>(
    '/stacks/accounts'
  ),

  getAccount: (accountId: string) => http<any>(`/stacks/accounts/${accountId}`),

  requestFaucet: (address: string, stacking = false) =>
    http<FaucetResponse>('/stacks/testnet/faucet', {
      method: 'POST',
      body: JSON.stringify({ address, stacking })
    }),

  getBalance: (address: string) =>
    http<any>(`/stacks/testnet/balance/${address}`),

  getStatus: () => http<any>('/stacks/testnet/status'),
}
