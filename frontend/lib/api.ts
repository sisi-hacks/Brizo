const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001')

export interface CreatePaymentRequest {
  amount: number
  description: string
  merchantId: string
  donation?: boolean
}

export interface CreatePaymentResponse {
  paymentId: string
  checkoutUrl: string
  amount: number
  description: string
  merchantId: string
  donation: boolean
  status: string
}

export interface PaymentStatus {
  paymentId: string
  amount: number
  description: string
  merchantId: string
  donation: boolean
  status: string
  createdAt: string
  paidAt?: string
  sbtcTxId?: string
  checkoutUrl: string
}

export interface ProcessPaymentRequest {
  sbtcTxId: string
  walletAddress: string
}

export interface ProcessPaymentResponse {
  success: boolean
  paymentId: string
  status: string
  sbtcTxId: string
  message: string
}

export interface MerchantInfo {
  id: string
  name: string
  walletAddress: string
  createdAt: string
}

export interface DonationAnalytics {
  merchantId: string
  donations: Array<{
    totalDonations: number
    totalAmount: number
    averageAmount: number
    date: string
  }>
  summary: {
    totalDonations: number
    totalAmount: number
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

// Create a new payment
export async function createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  return apiRequest<CreatePaymentResponse>('/create-payment', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Check payment status
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  return apiRequest<PaymentStatus>(`/check-status/${paymentId}`)
}

// Process payment (mark as paid)
export async function processPayment(
  paymentId: string, 
  data: ProcessPaymentRequest
): Promise<ProcessPaymentResponse> {
  return apiRequest<ProcessPaymentResponse>(`/process-payment/${paymentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Get merchant information
export async function getMerchantInfo(merchantId: string): Promise<MerchantInfo> {
  return apiRequest<MerchantInfo>(`/merchant/${merchantId}`)
}

// Get donation analytics
export async function getDonationAnalytics(merchantId: string): Promise<DonationAnalytics> {
  return apiRequest<DonationAnalytics>(`/analytics/donations/${merchantId}`)
}

// Health check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return apiRequest<{ status: string; timestamp: string }>('/health')
}

// Webhook notification (for external integrations)
export async function sendWebhookNotification(data: {
  paymentId: string
  sbtcTxId: string
  amount: number
  merchantId: string
}): Promise<{ received: boolean; timestamp: string }> {
  return apiRequest<{ received: boolean; timestamp: string }>('/webhook/payment-success', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
