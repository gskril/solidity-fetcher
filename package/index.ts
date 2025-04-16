import {
  type Abi,
  type Account,
  type Address,
  type Chain,
  type Client,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type Hex,
  type SimulateContractParameters,
  type SimulateContractReturnType,
  type Transport,
  offchainLookup,
} from 'viem'
import { simulateContract } from 'viem/actions'

type CcipReadContext =
  | {
      response: Hex
      request: Hex
    }
  | undefined

// Viem function that returns CCIP Read context
// This can be done in a couple ways:
// 1. Modified `simulateContract` to return `context` in addition to `request` and `result`
// 2. Modified `writeContract` that handles everything under the hood
export type FetcherActions<
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = {
  simulateContractFetch: <
    const abi extends Abi | readonly unknown[],
    functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
    const args extends ContractFunctionArgs<
      abi,
      'nonpayable' | 'payable',
      functionName
    >,
    chainOverride extends Chain | undefined,
    accountOverride extends Account | Address | undefined = undefined,
  >(
    args: SimulateContractParameters<
      abi,
      functionName,
      args,
      chain,
      chainOverride,
      accountOverride
    >
  ) => Promise<
    SimulateContractReturnType<
      abi,
      functionName,
      args,
      chain,
      account,
      chainOverride,
      accountOverride
    > & { context: CcipReadContext }
  >
}

export function fetcherActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>): FetcherActions<chain, account> {
  return {
    simulateContractFetch: (args) => simulateContractFetch(client, args),
  }
}

async function simulateContractFetch<
  chain extends Chain | undefined,
  account extends Account | undefined,
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  const args extends ContractFunctionArgs<
    abi,
    'nonpayable' | 'payable',
    functionName
  >,
  chainOverride extends Chain | undefined = undefined,
  accountOverride extends Account | Address | null | undefined = undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: SimulateContractParameters<
    abi,
    functionName,
    args,
    chain,
    chainOverride,
    accountOverride
  >
): Promise<
  SimulateContractReturnType<
    abi,
    functionName,
    args,
    chain,
    account,
    chainOverride,
    accountOverride
  > & { context: CcipReadContext }
> {
  let context: { response: Hex; request: Hex } | undefined

  const modifiedClient = {
    ...client,
  }

  modifiedClient.ccipRead = {
    request: async (req) => {
      const response = await offchainLookup(client, {
        data: req.data,
        to: req.sender,
      })

      context = { response, request: req.data }
      return response
    },
  }

  const simulation = await simulateContract(modifiedClient, parameters)

  return { ...simulation, context }
}
