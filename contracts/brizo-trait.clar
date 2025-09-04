;; Brizo Payment Trait - Standard Interface
;; Defines the interface that all Brizo payment contracts must implement
;; Enables extensibility and standardization across different payment types

(define-trait brizo-payment-trait
  ;; Core payment functions
  (create-payment (payment-id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (memo (optional (string-ascii 256))) (response (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256))))))
  (complete-payment (payment-id (string-ascii 64)) (tx-hash (string-ascii 64)) (response (tuple (payment (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256))))) (platform-fee uint) (merchant-amount uint))))
  (cancel-payment (payment-id (string-ascii 64)) (response (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256))))))
  
  ;; Merchant management
  (register-merchant (merchant-id (string-ascii 64)) (name (string-ascii 128)) (description (string-ascii 256)) (wallet-address principal) (response (tuple (id (string-ascii 64)) (owner principal) (name (string-ascii 128)) (description (string-ascii 256)) (wallet-address principal) (is-active bool) (created-at uint) (total-volume uint) (total-transactions uint))))
  
  ;; Read-only functions
  (get-payment (payment-id (string-ascii 64)) (response (optional (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256)))))))
  (get-merchant (merchant-id (string-ascii 64)) (response (optional (tuple (id (string-ascii 64)) (owner principal) (name (string-ascii 128)) (description (string-ascii 256)) (wallet-address principal) (is-active bool) (created-at uint) (total-volume uint) (total-transactions uint)))))
  (get-platform-stats () (response (tuple (total-volume uint) (total-transactions uint) (total-fees-collected uint) (active-merchants uint))))
  (get-merchant-payments (merchant-id (string-ascii 64)) (limit uint) (response (list (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256)))))))
)

;; Payment status enum (must match implementation)
(define-enum payment-status
  created
  pending
  completed
  cancelled
  refunded
)

;; Extension trait for advanced features
(define-trait brizo-extension-trait
  ;; Multi-signature support
  (setup-multisig (payment-id (string-ascii 64)) (signers (list principal)) (threshold uint) (response bool))
  (approve-payment (payment-id (string-ascii 64)) (signer principal) (response bool))
  
  ;; Time-locked payments
  (create-timelocked-payment (payment-id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (unlock-block uint) (response (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256))))))
  (claim-timelocked-payment (payment-id (string-ascii 64)) (response bool))
  
  ;; Recurring payments
  (setup-recurring-payment (payment-id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (interval-blocks uint) (max-occurrences uint) (response (tuple (id (string-ascii 64)) (merchant-id (string-ascii 64)) (amount uint) (description (string-ascii 256)) (recipient principal) (payer principal) (status (enum payment-status)) (created-at uint) (completed-at (optional uint)) (memo (optional (string-ascii 256))))))
  (process-recurring-payment (payment-id (string-ascii 64)) (response bool))
  
  ;; Escrow and dispute resolution
  (create-escrow (payment-id (string-ascii 64)) (arbitrator principal) (escrow-period uint) (response bool))
  (release-escrow (payment-id (string-ascii 64)) (response bool))
  (dispute-escrow (payment-id (string-ascii 64)) (reason (string-ascii 256)) (response bool))
  (resolve-dispute (payment-id (string-ascii 64)) (winner principal) (response bool))
)

;; Utility trait for common operations
(define-trait brizo-utility-trait
  ;; Validation helpers
  (is-valid-payment-id (id (string-ascii 64)) (response bool))
  (is-valid-amount (amount uint) (response bool))
  (is-valid-merchant-id (id (string-ascii 64)) (response bool))
  
  ;; Fee calculations
  (calculate-platform-fee (amount uint) (response uint))
  (calculate-merchant-amount (amount uint) (response uint))
  
  ;; Access control
  (is-payment-owner (payment-id (string-ascii 64)) (principal) (response bool))
  (is-merchant-owner (merchant-id (string-ascii 64)) (principal) (response bool))
  (is-platform-admin (principal) (response bool))
)
