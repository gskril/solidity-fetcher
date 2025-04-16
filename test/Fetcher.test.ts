import { Foundry } from '@adraffy/blocksmith'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import {
  type ClientConfig,
  type Hex,
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { anvil } from 'viem/chains'

import router from '../gateway/index'
import { fetcherActions } from '../package/index'

let foundry: Foundry

beforeAll(async () => {
  foundry = await Foundry.launch()
})

afterAll(async () => {
  foundry.shutdown()
})

test('test', async () => {
  // This will use the `_gateway()` from Fetcher.sol for CCIP Read requests
  const clientArgs = {
    account: privateKeyToAccount(foundry.wallets.admin!.privateKey as Hex),
    transport: http(`http://127.0.0.1:${foundry.port}`),
    chain: anvil,
  } satisfies ClientConfig

  const walletClient = createWalletClient(clientArgs)
  const publicClient = createPublicClient(clientArgs).extend(fetcherActions)

  const _contract = await foundry.deploy({
    file: 'contracts/examples/Counter.sol',
  })

  const contract = {
    address: (await _contract.getAddress()) as Hex,
    abi: parseAbi([
      'error OffchainLookup(address sender,string[] urls,bytes callData,bytes4 callbackFunction,bytes extraData)',
      'function number() view returns (uint256)',
      'function awaitSetNumber() payable returns (uint256)',
      'function setNumber(bytes calldata fetchResponse, bytes calldata fetchRequest) public returns (uint256)',
    ]),
  }

  const numberBefore = await publicClient.readContract({
    ...contract,
    functionName: 'number',
  })

  expect(numberBefore).toBe(0n)

  const simulation = await publicClient.simulateContractFetch({
    ...contract,
    functionName: 'awaitSetNumber',
  })

  if (!simulation.context) {
    throw new Error('Context is undefined')
  }

  // If Viem supported CCIP Read in transactions, this would be called automatically
  await walletClient.writeContract({
    ...contract,
    functionName: 'setNumber',
    args: [simulation.context.response, simulation.context.request],
  })

  const numberAfter = await publicClient.readContract({
    ...contract,
    functionName: 'number',
  })

  expect(numberAfter).toBeGreaterThan(0n)
})
