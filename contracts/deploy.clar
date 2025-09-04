;; Brizo Deployment Contract
;; Initializes the payment system with default values

(define-constant CONTRACT_OWNER "ST1PQHQKV0RJXZFYVWE6CHS7NS4T3MG9XJVTQVAVSB")

(define-data-var initialized bool false)

(define-public (initialize-system)
  (let ((caller (as-contract tx-sender)))
    (asserts! (is-eq caller (as-contract CONTRACT_OWNER)) (err "Only owner can initialize"))
    (asserts! (not (var-get initialized)) (err "Already initialized"))
    
    (var-set initialized true)
    (ok "System initialized")
  )
)

(define-read-only (is-initialized)
  (var-get initialized)
)
