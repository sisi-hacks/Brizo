;; Brizo Payments - Main Payment Contract
;; Handles payment creation, escrow, and completion
;; Deployed on Stacks Testnet

(define-constant CONTRACT_OWNER "ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB")
(define-constant PLATFORM_FEE_RATE 25) ;; 0.25% platform fee (25 basis points)
(define-constant MIN_PAYMENT_AMOUNT 1000) ;; Minimum 0.00001 sBTC (1000 micro units)

;; Payment status enum
(define-enum payment-status
  created
  pending
  completed
  cancelled
  refunded
)

;; Payment struct
(define-data-var payment (tuple
  (id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (description (string-ascii 256))
  (recipient principal)
  (payer principal)
  (status (enum payment-status))
  (created-at uint)
  (completed-at (optional uint))
  (memo (optional (string-ascii 256)))
)

;; Merchant struct
(define-data-var merchant (tuple
  (id (string-ascii 64))
  (owner principal)
  (name (string-ascii 128))
  (description (string-ascii 256))
  (wallet-address principal)
  (is-active bool)
  (created-at uint)
  (total-volume uint)
  (total-transactions uint)
)

;; Platform stats
(define-data-var platform-stats (tuple
  (total-volume uint)
  (total-transactions uint)
  (total-fees-collected uint)
  (active-merchants uint)
)

;; Events
(define-event payment-created
  (payment-id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (payer principal)
)

(define-event payment-completed
  (payment-id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (payer principal)
  (tx-hash (string-ascii 64))
)

(define-event merchant-registered
  (merchant-id (string-ascii 64))
  (owner principal)
  (name (string-ascii 128))
)

;; Helper functions
(define-private (calculate-platform-fee (amount uint))
  (/ (* amount PLATFORM_FEE_RATE) 10000)
)

(define-private (calculate-merchant-amount (amount uint))
  (- amount (calculate-platform-fee amount))
)

(define-private (is-valid-payment-id (id (string-ascii 64)))
  (and
    (> (len id) 0)
    (< (len id) 65)
  )
)

(define-private (is-valid-amount (amount uint))
  (>= amount MIN_PAYMENT_AMOUNT)
)

;; Public functions

;; Register a new merchant
(define-public (register-merchant
  (merchant-id (string-ascii 64))
  (name (string-ascii 128))
  (description (string-ascii 256))
  (wallet-address principal)
)
  (let
    ((caller (as-contract tx-sender)))
    (asserts! (is-valid-payment-id merchant-id) (err "Invalid merchant ID"))
    (asserts! (not (default-to false (some? (get merchant merchant-id)))) (err "Merchant already exists"))
    (asserts! (is-eq caller wallet-address) (err "Wallet address must match caller"))
    
    (let
      ((merchant-data (tuple
        (id merchant-id)
        (owner caller)
        (name name)
        (description description)
        (wallet-address wallet-address)
        (is-active true)
        (created-at (block-height))
        (total-volume u0)
        (total-transactions u0)
      )))
      (data-set merchant merchant-id merchant-data)
      (emit merchant-registered merchant-id caller name)
      (ok merchant-data)
    )
  )
)

;; Create a new payment
(define-public (create-payment
  (payment-id (string-ascii 64))
  (merchant-id (string-ascii 64))
  (amount uint)
  (description (string-ascii 256))
  (memo (optional (string-ascii 256)))
)
  (let
    ((caller (as-contract tx-sender))
     (merchant-data (unwrap! (get merchant merchant-id) (err "Merchant not found"))))
    
    (asserts! (is-valid-payment-id payment-id) (err "Invalid payment ID"))
    (asserts! (not (default-to false (some? (get payment payment-id)))) (err "Payment ID already exists"))
    (asserts! (is-valid-amount amount) (err "Amount too small"))
    (asserts! (get merchant-data is-active) (err "Merchant is inactive"))
    
    (let
      ((payment-data (tuple
        (id payment-id)
        (merchant-id merchant-id)
        (amount amount)
        (description description)
        (recipient (get merchant-data wallet-address))
        (payer caller)
        (status (enum payment-status created))
        (created-at (block-height))
        (completed-at none)
        (memo memo)
      )))
      (data-set payment payment-id payment-data)
      (emit payment-created payment-id merchant-id amount caller)
      (ok payment-data)
    )
  )
)

;; Complete a payment (called by merchant after receiving sBTC)
(define-public (complete-payment
  (payment-id (string-ascii 64))
  (tx-hash (string-ascii 64))
)
  (let
    ((caller (as-contract tx-sender))
     (payment-data (unwrap! (get payment payment-id) (err "Payment not found"))))
    
    (asserts! (is-eq caller (get payment-data recipient)) (err "Only recipient can complete payment"))
    (asserts! (is-eq (get payment-data status) (enum payment-status created)) (err "Payment already processed"))
    
    (let
      ((updated-payment (tuple
        (id payment-id)
        (merchant-id (get payment-data merchant-id))
        (amount (get payment-data amount))
        (description (get payment-data description))
        (recipient (get payment-data recipient))
        (payer (get payment-data payer))
        (status (enum payment-status completed))
        (created-at (get payment-data created-at))
        (completed-at (some (block-height)))
        (memo (get payment-data memo))
      ))
       (merchant-data (unwrap! (get merchant (get payment-data merchant-id)) (err "Merchant not found")))
       (platform-fee (calculate-platform-fee (get payment-data amount)))
       (merchant-amount (calculate-merchant-amount (get payment-data amount))))
      
      ;; Update payment status
      (data-set payment payment-id updated-payment)
      
      ;; Update merchant stats
      (data-set merchant (get payment-data merchant-id) (tuple
        (id (get merchant-data id))
        (owner (get merchant-data owner))
        (name (get merchant-data name))
        (description (get merchant-data description))
        (wallet-address (get merchant-data wallet-address))
        (is-active (get merchant-data is-active))
        (created-at (get merchant-data created-at))
        (total-volume (+ (get merchant-data total-volume) (get payment-data amount)))
        (total-transactions (+ (get merchant-data total-transactions) u1))
      ))
      
      ;; Update platform stats
      (let ((current-stats (unwrap! (get platform-stats "global") (tuple
        (total-volume u0)
        (total-transactions u0)
        (total-fees-collected u0)
        (active-merchants u0)
      ))))
        (data-set platform-stats "global" (tuple
          (total-volume (+ (get current-stats total-volume) (get payment-data amount)))
          (total-transactions (+ (get current-stats total-transactions) u1))
          (total-fees-collected (+ (get current-stats total-fees-collected) platform-fee))
          (active-merchants (get current-stats active-merchants))
        ))
      )
      
      (emit payment-completed payment-id (get payment-data merchant-id) (get payment-data amount) (get payment-data payer) tx-hash)
      (ok (tuple
        (payment updated-payment)
        (platform-fee platform-fee)
        (merchant-amount merchant-amount)
      ))
    )
  )
)

;; Cancel a payment (only by payer before completion)
(define-public (cancel-payment (payment-id (string-ascii 64)))
  (let
    ((caller (as-contract tx-sender))
     (payment-data (unwrap! (get payment payment-id) (err "Payment not found"))))
    
    (asserts! (is-eq caller (get payment-data payer)) (err "Only payer can cancel payment"))
    (asserts! (is-eq (get payment-data status) (enum payment-status created)) (err "Payment already processed"))
    
    (let
      ((updated-payment (tuple
        (id payment-id)
        (merchant-id (get payment-data merchant-id))
        (amount (get payment-data amount))
        (description (get payment-data description))
        (recipient (get payment-data recipient))
        (payer (get payment-data payer))
        (status (enum payment-status cancelled))
        (created-at (get payment-data created-at))
        (completed-at none)
        (memo (get payment-data memo))
      )))
      (data-set payment payment-id updated-payment)
      (ok updated-payment)
    )
  )
)

;; Get payment details
(define-read-only (get-payment (payment-id (string-ascii 64)))
  (get payment payment-id)
)

;; Get merchant details
(define-read-only (get-merchant (merchant-id (string-ascii 64)))
  (get merchant merchant-id)
)

;; Get platform stats
(define-read-only (get-platform-stats)
  (get platform-stats "global")
)

;; Get payments by merchant
(define-read-only (get-merchant-payments (merchant-id (string-ascii 64) (limit uint)))
  (filter-map
    (lambda (entry (tuple (key (string-ascii 64)) (value (tuple
      (id (string-ascii 64))
      (merchant-id (string-ascii 64))
      (amount uint)
      (description (string-ascii 256))
      (recipient principal)
      (payer principal)
      (status (enum payment-status))
      (created-at uint)
      (completed-at (optional uint))
      (memo (optional (string-ascii 256)))
    )))
    (if (is-eq (get value merchant-id) merchant-id)
      (some value)
      none
    )
  )
  (map
    (lambda (entry (tuple (key (string-ascii 64)) (value (tuple
      (id (string-ascii 64))
      (merchant-id (string-ascii 64))
      (amount uint)
      (description (string-ascii 256))
      (recipient principal)
      (payer principal)
      (status (enum payment-status))
      (created-at uint)
      (completed-at (optional uint))
      (memo (optional (string-ascii 256)))
    )))
    entry
  )
  (data-map payment)
  )
  limit
)
