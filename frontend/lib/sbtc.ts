import { openContractCall, type ContractCallRegularOptions } from '@stacks/connect'
import { AnchorMode, PostConditionMode, uintCV, standardPrincipalCV, noneCV, stringAsciiCV, createAssetInfo, createFungiblePostCondition, FungibleConditionCode } from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'

// Real sBTC contract addresses from Stacks documentation
const SBTC_CONTRACTS = {
  testnet: {
    address: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
    name: 'sbtc-token',
    function: 'transfer'
  },
  mainnet: {
    address: 'SP3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4', // Update when mainnet is live
    name: 'sbtc-token', 
    function: 'transfer'
  }
}

// Get contract config based on network
const getSbtcContract = (network: 'testnet' | 'mainnet' = 'testnet') => {
  return SBTC_CONTRACTS[network]
}

export type SbtcTransferParams = {
  recipient: string
  amount: number // sBTC amount in whole units
  sender?: string
  memo?: string
  network?: 'testnet' | 'mainnet'
}

export async function sendSbtcTransfer({ 
  recipient, 
  amount, 
  memo, 
  network = 'testnet' 
}: SbtcTransferParams): Promise<{ txId?: string }> {
  console.log('Initiating real sBTC transfer...')
  console.log('Amount:', amount, 'sBTC')
  console.log('Recipient:', recipient)
  console.log('Network:', network)

  const contract = getSbtcContract(network)
  const networkInstance = network === 'testnet' ? new StacksTestnet() : new StacksMainnet()

  // sBTC uses 8 decimal places (same as Bitcoin)
  const microAmount = Math.floor(amount * 1e8)

  // SIP-010 standard transfer function signature: (amount, sender, recipient, memo?)
  const functionArgs = [
    uintCV(microAmount),
    standardPrincipalCV(recipient),
    memo ? stringAsciiCV(memo) : noneCV(),
  ]

  // Create post-condition to ensure exact amount is transferred
  const postConditions = [
    createFungiblePostCondition(
      createAssetInfo(contract.address, contract.name, 'sbtc'),
      FungibleConditionCode.Equal,
      uintCV(microAmount),
      recipient
    ),
  ]

  const options: ContractCallRegularOptions = {
    network: networkInstance,
    contractAddress: contract.address,
    contractName: contract.name,
    functionName: contract.function,
    functionArgs,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    anchorMode: AnchorMode.Any,
    onFinish: data => {
      console.log('sBTC transfer completed:', data)
    },
    onCancel: () => {
      console.log('sBTC transfer canceled')
    },
  }

  const result = await openContractCall(options)
  return { txId: (result as any)?.txId }
}
