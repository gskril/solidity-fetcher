// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Fetcher {
    struct Request {
        string url;
        string method;
        string path;
        bytes4 callbackFunction;
    }

    /// @dev Default gateway URL
    string private _gateway = "https://solidity-fetcher.gregskril.com";

    /// @dev Standard ERC-3668 error
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    /// @notice Fetch data from a URL using ERC-3668 (CCIP Read)
    function fetch(
        Request calldata request
    ) external view returns (bytes memory) {
        bytes memory callData = abi.encodeWithSelector(
            Fetcher.fetch.selector,
            request
        );

        string[] memory urls = new string[](1);
        urls[0] = gateway();

        revert OffchainLookup(
            address(this),
            urls,
            callData,
            request.callbackFunction,
            abi.encode(callData, address(this))
        );
    }

    /// @dev ERC-3668 callback function to verify the gateway response.
    //       This must be called in the callback function of the implementing contract.
    function verifyFetch(
        bytes calldata response,
        bytes calldata request
    ) public view returns (bytes memory) {}

    /// @dev Proxy server that handles ABI encoding and decoding around JSON API requests
    function gateway() public view virtual returns (string memory) {
        return _gateway;
    }
}
