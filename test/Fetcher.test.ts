import { Foundry } from '@adraffy/blocksmith'
import { afterAll, beforeAll, expect, test } from 'bun:test'
import {
  type Account,
  type Chain,
  type ClientConfig,
  type Hex,
  type PublicClient,
  type Transport,
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
let walletClient: WalletClient<Transport, Chain, Account>
let publicClient: PublicClient<Transport, Chain, Account>

beforeAll(async () => {
  foundry = await Foundry.launch()

  const clientArgs = {
    account: privateKeyToAccount(foundry.wallets.admin!.privateKey as Hex),
    transport: http(`http://127.0.0.1:${foundry.port}`),
    chain: anvil,
    ccipRead: {
      // Make Viem handle CCIP Read requests locally
      request: async ({ sender, data }) => {
        const res = await router.call({ to: sender, data })
        const body = res.body as { data: Hex }
        return body.data
      },
    },
  } satisfies ClientConfig

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

  // CCIP Read works here and returns the below object
  const txRequest = await publicClient.simulateContract({
    ...contract,
    functionName: 'awaitSetNumber',
  })

  console.log({ txRequest })
  /*
    {
      txRequest: {
        result: 8000000000000000000n,
        request: {
          abi: [
            [Object ...]
          ],
          address: "0x3Ede3eCa2a72B3aeCC820E955B36f38437D01395",
          args: undefined,
          dataSuffix: undefined,
          functionName: "awaitSetNumber",
          account: [Object ...],
        },
      },
    }
  */

  // This fails because it's calling `awaitSetNumber()` which implements CCIP Read, which Viem doesn't support in transactions
  const hash = await walletClient.writeContract(txRequest.request)
  await publicClient.waitForTransactionReceipt({ hash })

  const numberAfter = await publicClient.readContract({
    ...contract,
    functionName: 'number',
  })

  expect(numberAfter).toBeGreaterThan(0n)
})
