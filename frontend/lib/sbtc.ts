import { openContractCall, type ContractCallRegularOptions } from '@stacks/connect'
import { AnchorMode, PostConditionMode, uintCV, standardPrincipalCV, noneCV, stringAsciiCV } from '@stacks/transactions'

// Configure these via env for testnet
const SBTC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SBTC_CONTRACT_ADDRESS || 'SP000000000000000000002Q6VF78' // placeholder
const SBTC_CONTRACT_NAME = process.env.NEXT_PUBLIC_SBTC_CONTRACT_NAME || 'sbtc-token' // placeholder (SIP-010-like)
const SBTC_TRANSFER_FN = process.env.NEXT_PUBLIC_SBTC_TRANSFER_FN || 'transfer' // typical SIP-010

export type SbtcTransferParams = {
  recipient: string
  amount: number // sBTC amount in whole units
  sender?: string
  memo?: string
}

export async function sendSbtcTransfer({ recipient, amount, memo }: SbtcTransferParams): Promise<{ txId?: string }> {
  // Convert whole sBTC to micro-units if the token uses 6 or 8 decimals.
  // Assuming 8 decimals for sBTC: amount * 10^8
  const microAmount = Math.floor(amount * 1e8)

  const functionArgs = [
    uintCV(microAmount),
    standardPrincipalCV(recipient),
    noneCV(),
  ]

  const options: ContractCallRegularOptions = {
    contractAddress: SBTC_CONTRACT_ADDRESS,
    contractName: SBTC_CONTRACT_NAME,
    functionName: SBTC_TRANSFER_FN,
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
    onFinish: data => {
      // eslint-disable-next-line no-console
      console.log('sBTC transfer submitted:', data)
    },
    onCancel: () => {
      // eslint-disable-next-line no-console
      console.log('sBTC transfer canceled')
    },
  }

  const result = await openContractCall(options)
  return { txId: (result as any)?.txId }
}
