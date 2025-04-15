import { CcipReadRouter } from '@ensdomains/ccip-read-router'
import { cors } from 'itty-router'
import { encodeAbiParameters } from 'viem'

const { preflight, corsify } = cors()

// Note: it's safe to throw errors because the router library handles them internally
const router = CcipReadRouter({
  base: '/v1',
  before: [preflight],
  finally: [corsify],
})

router.add({
  type: 'function fetch((string url, string path, bytes4 callbackFunction)) view returns (bytes)',
  handle: async ([req]) => {
    const { url, path } = req

    const proxyRes = await fetch(url)
    const proxyResBody = (await proxyRes.json()) as any
    const item = proxyResBody?.[JSON.parse(path)]
    const returnType = typeof item
    console.log({ url, path, item, returnType })

    // Always going to be a string, number or boolean which we need to ABI encode into bytes
    switch (returnType) {
      case 'string':
        return encodeAbiParameters([{ type: 'string' }], [item])

      case 'number':
        // We multiply all numbers by 1e18 to avoid precision loss since Solidity doesn't support decimals
        return encodeAbiParameters([{ type: 'uint256' }], [BigInt(item * 1e18)])

      case 'boolean':
        return encodeAbiParameters([{ type: 'bool' }], [item])

      default:
        throw new Error('Unsupported return type')
    }
  },
})

export default router
