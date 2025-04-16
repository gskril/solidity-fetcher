import { CcipReadRouter } from '@ensdomains/ccip-read-router'
import { cors } from 'itty-router'
import {
  type Hex,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbi,
} from 'viem'

const { preflight, corsify } = cors()

// Note: it's safe to throw errors because the router library handles them internally
const router = CcipReadRouter({
  base: '/v1',
  before: [preflight],
  finally: [corsify],
})

const abi = parseAbi([
  'function fetch((string url, string path, bytes4 callbackFunction)) view returns (bytes)',
])

router.add({
  type: abi[0],
  handle: async ([req]) => {
    const { url, path } = req

    const proxyRes = await fetch(url)
    const proxyResBody = (await proxyRes.json()) as any
    const item = proxyResBody?.[JSON.parse(path)]
    const returnType = typeof item
    console.log({ url, path, item, returnType })
    let res: Hex

    // Always going to be a string, number or boolean which we need to ABI encode into bytes
    switch (returnType) {
      case 'string':
        res = encodeAbiParameters([{ type: 'string' }], [item])
        break

      case 'number':
        // We multiply all numbers by 1e18 to avoid precision loss since Solidity doesn't support decimals
        res = encodeAbiParameters([{ type: 'uint256' }], [BigInt(item * 1e18)])
        break

      case 'boolean':
        res = encodeAbiParameters([{ type: 'bool' }], [item])
        break

      default:
        throw new Error('Unsupported return type')
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 60
    const calldata = encodeFunctionData({ abi, args: [req] })
    console.log({ calldata })

    return encodeAbiParameters(
      [{ type: 'bytes' }, { type: 'bytes32' }, { type: 'uint256' }],
      [res, keccak256(calldata), BigInt(expiresAt)]
    )
  },
})

export default router
