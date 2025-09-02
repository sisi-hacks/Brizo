;; Brizo Payment System Trait
;; Defines the interface for the Brizo payment contract

(define-trait brizo-payments-trait
  ;; Payment Management
  (create-payment (string-utf8 50) uint (string-utf8 10) (string-utf8 500) -> (response uint uint))
  (process-payment (uint (string-utf8 100) (string-utf8 100)) -> (response uint uint))
  (get-payment (uint) -> (response (optional {
    id: uint,
    merchant-id: (optional (string-utf8 50)),
    amount: uint,
    currency: (string-utf8 10),
    description: (string-utf8 500),
    status: (string-utf8 20),
    created-at: uint,
    processed-at: (optional uint),
    sbtc-tx-id: (optional (string-utf8 100))
  }) uint))
  
  ;; Merchant Management
  (register-merchant (string-utf8 50) (string-utf8 100) (string-utf8 100) -> (response (string-utf8 50) uint))
  (update-merchant-status (string-utf8 50) bool -> (response bool uint))
  (get-merchant-balance (string-utf8 50) -> (response (optional {
    sbtc-balance: uint,
    last-updated: uint
  }) uint))
  
  ;; Contract Management
  (get-contract-stats () -> (response {
    total-payments: uint,
    contract-active: bool,
    contract-owner: principal
  } uint))
  (pause-contract () -> (response bool uint))
  (resume-contract () -> (response bool uint))
)
