import { Foundry } from '@adraffy/blocksmith'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import {
  type Hex,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { anvil } from 'viem/chains'

import router from '../gateway/index'

let foundry: Foundry
let walletClient: WalletClient
let publicClient: PublicClient

beforeAll(async () => {
  foundry = await Foundry.launch()

  const clientArgs = {
    account: privateKeyToAccount(foundry.wallets.admin!.privateKey as Hex),
    transport: http(`http://127.0.0.1:${foundry.port}`),
    chain: anvil,
  } as const

  walletClient = createWalletClient(clientArgs)
  publicClient = createPublicClient(clientArgs)
})

afterAll(async () => {
  foundry.shutdown()
})

test('test', async () => {
  const _contract = await foundry.deploy({
    file: 'contracts/examples/Counter.sol',
  })

  const contract = {
    address: (await _contract.getAddress()) as Hex,
    abi: parseAbi([
      'error OffchainLookup(address sender,string[] urls,bytes callData,bytes4 callbackFunction,bytes extraData)',
      'function number() view returns (uint256)',
      'function awaitSetNumber() returns (uint256)',
      'function setNumber(bytes calldata fetchResponse, bytes calldata fetchRequest) public returns (uint256)',
    ]),
  }

  const numberBefore = await publicClient.readContract({
    ...contract,
    functionName: 'number',
  })

  expect(numberBefore).toBe(0n)

  // This should revert with `OffchainLookup` and call `setNumber()`
  await walletClient.writeContract({
    ...contract,
    functionName: 'awaitSetNumber',
  })
})
