> [!NOTE]
> This is a work in progress and not functional yet.

# Solidity Fetcher

A common question for new Solidity developers is "How do I make an API request from a smart contract?" and the short answer is "You can't." But it turns out, you kinda can!

[Fetcher.sol](./src/Fetcher.sol) is a helper contract built on top of [ERC-3668](https://eips.ethereum.org/EIPS/eip-3668) that acts as a proxy to fetch data from any HTTP API and trigger a callback onchain.

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```
