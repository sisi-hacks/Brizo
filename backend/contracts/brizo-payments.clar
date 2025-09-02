;; Brizo Payment System Smart Contract
;; A foundation for sBTC payment processing on Stacks
;; 
;; This contract provides:
;; - Payment tracking and verification
;; - Merchant management
;; - sBTC transaction handling
;; - Future expansion capabilities

(impl-trait .brizo-trait.brizo-payments-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-UNAUTHORIZED (err u100))
(define-constant ERR-PAYMENT-NOT-FOUND (err u101))
(define-constant ERR-INVALID-AMOUNT (err u102))
(define-constant ERR-PAYMENT-ALREADY-PROCESSED (err u103))
(define-constant ERR-MERCHANT-NOT-FOUND (err u104))

;; Data Variables
(define-data-var payment-counter uint u0)
(define-data-var contract-active bool true)

;; Maps
(define-map payments
  uint
  {
    id: uint,
    merchant-id: (optional (string-utf8 50)),
    amount: uint,
    currency: (string-utf8 10),
    description: (string-utf8 500),
    status: (string-utf8 20),
    created-at: uint,
    processed-at: (optional uint),
    sbtc-tx-id: (optional (string-utf8 100))
  }
)

(define-map merchants
  (string-utf8 50)
  {
    id: (string-utf8 50),
    name: (string-utf8 100),
    wallet-address: (string-utf8 100),
    active: bool,
    created-at: uint
  }
)

(define-map merchant-balances
  (string-utf8 50)
  {
    sbtc-balance: uint,
    last-updated: uint
  }
)

;; Public Functions

;; Create a new payment
(define-public (create-payment
  (merchant-id (string-utf8 50))
  (amount uint)
  (currency (string-utf8 10))
  (description (string-utf8 500))
)
  (begin
    (asserts! (var-get contract-active) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    ;; Check if merchant exists
    (asserts! (is-ok (map-get? merchants merchant-id)) ERR-MERCHANT-NOT-FOUND)
    
    ;; Get next payment ID
    (let ((payment-id (+ (var-get payment-counter) u1)))
      (begin
        ;; Store payment
        (ok (map-set payments payment-id {
          id: payment-id,
          merchant-id: (some merchant-id),
          amount: amount,
          currency: currency,
          description: description,
          status: u"pending",
          created-at: (unwrap! (get-block-info? time u0) u0),
          processed-at: none,
          sbtc-tx-id: none
        }))
        
        ;; Increment counter
        (var-set payment-counter payment-id)
        
        ;; Return payment ID
        (ok payment-id)
      )
    )
  )
)

;; Process a payment with sBTC transaction verification
(define-public (process-payment
  (payment-id uint)
  (sbtc-tx-id (string-utf8 100))
  (wallet-address (string-utf8 100))
)
  (begin
    (asserts! (var-get contract-active) ERR-UNAUTHORIZED)
    
    ;; Get payment
    (let ((payment (unwrap! (map-get? payments payment-id) ERR-PAYMENT-NOT-FOUND)))
      (begin
        ;; Check if payment is still pending
        (asserts! (is-eq (get status payment) u"pending") ERR-PAYMENT-ALREADY-PROCESSED)
        
        ;; Update payment status
        (ok (map-set payments payment-id {
          id: (get id payment),
          merchant-id: (get merchant-id payment),
          amount: (get amount payment),
          currency: (get currency payment),
          description: (get description payment),
          status: u"paid",
          created-at: (get created-at payment),
          processed-at: (some (unwrap! (get-block-info? time u0) u0)),
          sbtc-tx-id: (some sbtc-tx-id)
        }))
        
        ;; Update merchant balance (simplified - in real implementation, 
        ;; this would verify the actual sBTC transaction)
        (let ((merchant-id (unwrap-panic (get merchant-id payment))))
          (begin
            (map-set merchant-balances merchant-id {
              sbtc-balance: (+ (get sbtc-balance (unwrap! (map-get? merchant-balances merchant-id) {
                sbtc-balance: u0,
                last-updated: u0
              })) (get amount payment)),
              last-updated: (unwrap! (get-block-info? time u0) u0)
            })
            
            (ok payment-id)
          )
        )
      )
    )
  )
)

;; Get payment details
(define-read-only (get-payment (payment-id uint))
  (ok (map-get? payments payment-id))
)

;; Get merchant balance
(define-read-only (get-merchant-balance (merchant-id (string-utf8 50)))
  (ok (map-get? merchant-balances merchant-id))
)

;; Register a new merchant
(define-public (register-merchant
  (merchant-id (string-utf8 50))
  (name (string-utf8 100))
  (wallet-address (string-utf8 100))
)
  (begin
    (asserts! (var-get contract-active) ERR-UNAUTHORIZED)
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    
    ;; Store merchant
    (ok (map-set merchants merchant-id {
      id: merchant-id,
      name: name,
      wallet-address: wallet-address,
      active: true,
      created-at: (unwrap! (get-block-info? time u0) u0)
    }))
    
    ;; Initialize balance
    (ok (map-set merchant-balances merchant-id {
      sbtc-balance: u0,
      last-updated: (unwrap! (get-block-info? time u0) u0)
    }))
    
    (ok merchant-id)
  )
)

;; Update merchant status
(define-public (update-merchant-status
  (merchant-id (string-utf8 50))
  (active bool)
)
  (begin
    (asserts! (var-get contract-active) ERR-UNAUTHORIZED)
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    
    (let ((merchant (unwrap! (map-get? merchants merchant-id) ERR-MERCHANT-NOT-FOUND)))
      (ok (map-set merchants merchant-id {
        id: (get id merchant),
        name: (get name merchant),
        wallet-address: (get wallet-address merchant),
        active: active,
        created-at: (get created-at merchant)
      }))
    )
  )
)

;; Get contract statistics
(define-read-only (get-contract-stats)
  (ok {
    total-payments: (var-get payment-counter),
    contract-active: (var-get contract-active),
    contract-owner: CONTRACT-OWNER
  })
)

;; Emergency functions (contract owner only)
(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (ok (var-set contract-active false))
  )
)

(define-public (resume-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-UNAUTHORIZED)
    (ok (var-set contract-active true))
  )
)
