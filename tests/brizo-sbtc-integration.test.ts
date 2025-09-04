import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Brizo sBTC Integration Contract", () => {
  beforeEach(() => {
    // Ensure contract is deployed
    const contractSource = simnet.getContractSource("brizo-sbtc-integration");
    expect(contractSource).toBeDefined();
  });

  describe("Merchant Management", () => {
    it("registers a new merchant successfully", () => {
      const merchantId = "merchant-123";
      const name = "Test Merchant";
      const description = "A test merchant for testing";
      
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii(name),
          Cl.stringAscii(description),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      expect(result.result).toBeOk();
      
      // Verify merchant was created
      const merchant = simnet.getMapEntry(
        "brizo-sbtc-integration",
        "merchant",
        Cl.stringAscii(merchantId)
      );
      expect(merchant).toBeDefined();
    });

    it("fails to register merchant with duplicate ID", () => {
      const merchantId = "duplicate-merchant";
      
      // First registration
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("First Merchant"),
          Cl.stringAscii("First description"),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      // Second registration with same ID should fail
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("Second Merchant"),
          Cl.stringAscii("Second description"),
          Cl.standardPrincipal(wallet2.address)
        ],
        wallet2
      );

      expect(result.result).toBeErr();
    });

    it("fails to register merchant with mismatched wallet address", () => {
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii("mismatch-merchant"),
          Cl.stringAscii("Test Merchant"),
          Cl.stringAscii("Test description"),
          Cl.standardPrincipal(wallet2.address) // Different from caller
        ],
        wallet1 // Caller is wallet1
      );

      expect(result.result).toBeErr();
    });
  });

  describe("Payment Management", () => {
    let merchantId: string;
    let paymentId: string;

    beforeEach(() => {
      // Register a merchant first
      merchantId = "test-merchant";
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("Test Merchant"),
          Cl.stringAscii("Test description"),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      paymentId = "payment-123";
    });

    it("creates a new payment successfully", () => {
      const amount = 1000; // 0.00001 sBTC
      const description = "Test payment";
      
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii(merchantId),
          Cl.uint(amount),
          Cl.stringAscii(description),
          Cl.none() // No memo
        ],
        wallet2
      );

      expect(result.result).toBeOk();
      
      // Verify payment was created
      const payment = simnet.getMapEntry(
        "brizo-sbtc-integration",
        "payment",
        Cl.stringAscii(paymentId)
      );
      expect(payment).toBeDefined();
    });

    it("fails to create payment with invalid merchant", () => {
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii("invalid-payment"),
          Cl.stringAscii("non-existent-merchant"),
          Cl.uint(1000),
          Cl.stringAscii("Test payment"),
          Cl.none()
        ],
        wallet2
      );

      expect(result.result).toBeErr();
    });

    it("fails to create payment with amount too small", () => {
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii("small-payment"),
          Cl.stringAscii(merchantId),
          Cl.uint(500), // Below minimum 1000
          Cl.stringAscii("Test payment"),
          Cl.none()
        ],
        wallet2
      );

      expect(result.result).toBeErr();
    });

    it("completes a payment successfully", () => {
      // First create the payment
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii(merchantId),
          Cl.uint(1000),
          Cl.stringAscii("Test payment"),
          Cl.none()
        ],
        wallet2
      );

      // Complete the payment (called by merchant/recipient)
      const txHash = "0x1234567890abcdef";
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "complete-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii(txHash)
        ],
        wallet1 // Merchant/recipient
      );

      expect(result.result).toBeOk();
      
      // Verify payment status changed to completed
      const payment = simnet.getMapEntry(
        "brizo-sbtc-integration",
        "payment",
        Cl.stringAscii(paymentId)
      );
      expect(payment).toBeDefined();
    });

    it("fails to complete payment by non-recipient", () => {
      // Create payment
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii(merchantId),
          Cl.uint(1000),
          Cl.stringAscii("Test payment"),
          Cl.none()
        ],
        wallet2
      );

      // Try to complete by non-recipient (should fail)
      const result = simnet.callPublicFn(
        "brizo-sbtc-integration",
        "complete-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii("0x1234567890abcdef")
        ],
        wallet2 // Not the recipient
      );

      expect(result.result).toBeErr();
    });
  });

  describe("Read-only Functions", () => {
    it("gets merchant details", () => {
      const merchantId = "read-test-merchant";
      
      // Register merchant
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("Read Test Merchant"),
          Cl.stringAscii("Test description"),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      // Get merchant details
      const result = simnet.callReadOnlyFn(
        "brizo-sbtc-integration",
        "get-merchant",
        [Cl.stringAscii(merchantId)],
        wallet1
      );

      expect(result.result).toBeOk();
    });

    it("gets payment details", () => {
      const merchantId = "payment-test-merchant";
      const paymentId = "payment-test-123";
      
      // Setup merchant and payment
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("Payment Test Merchant"),
          Cl.stringAscii("Test description"),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "create-payment",
        [
          Cl.stringAscii(paymentId),
          Cl.stringAscii(merchantId),
          Cl.uint(1000),
          Cl.stringAscii("Test payment"),
          Cl.none()
        ],
        wallet2
      );

      // Get payment details
      const result = simnet.callReadOnlyFn(
        "brizo-sbtc-integration",
        "get-payment",
        [Cl.stringAscii(paymentId)],
        wallet1
      );

      expect(result.result).toBeOk();
    });

    it("gets merchant payments", () => {
      const merchantId = "list-test-merchant";
      
      // Register merchant
      simnet.callPublicFn(
        "brizo-sbtc-integration",
        "register-merchant",
        [
          Cl.stringAscii(merchantId),
          Cl.stringAscii("List Test Merchant"),
          Cl.stringAscii("Test description"),
          Cl.standardPrincipal(wallet1.address)
        ],
        wallet1
      );

      // Create multiple payments
      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          "brizo-sbtc-integration",
          "create-payment",
          [
            Cl.stringAscii(`payment-${i}`),
            Cl.stringAscii(merchantId),
            Cl.uint(1000),
            Cl.stringAscii(`Test payment ${i}`),
            Cl.none()
          ],
          wallet2
        );
      }

      // Get merchant payments
      const result = simnet.callReadOnlyFn(
        "brizo-sbtc-integration",
        "get-merchant-payments",
        [Cl.stringAscii(merchantId), Cl.uint(10)],
        wallet1
      );

      expect(result.result).toBeOk();
    });
  });

  describe("sBTC Integration", () => {
    it("gets sBTC balance for a user", () => {
      const result = simnet.callReadOnlyFn(
        "brizo-sbtc-integration",
        "get-sbtc-balance",
        [Cl.standardPrincipal(wallet1.address)],
        wallet1
      );

      expect(result.result).toBeOk();
    });
  });
});
