// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Fetcher
/// @notice A contract that simplifies offchain data fetching using ERC-3668.
contract Fetcher {
    /// @param url The URL to fetch data from.
    /// @param method The HTTP method to use (GET, POST, PUT, DELETE).
    /// @param path The JSON item to return. For example, if the expected API response is `{"data": {"value": 1}}` and
    ///        the desired output is `1`, the path would be `"data.value"`.
    /// @param callbackFunction The function to call in your contract after receiving the response.
    struct Request {
        string url;
        string method;
        string path;
        bytes4 callbackFunction;
    }

    /// @dev Standard ERC-3668 error
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    /// @notice Create an HTTP request to fetch offchain data using ERC-3668 (CCIP Read).
    function fetch(
        Request calldata request
    ) internal view returns (bytes memory) {
        bytes memory callData = abi.encodeWithSelector(
            Fetcher.fetch.selector,
            request
        );

        string[] memory urls = new string[](1);
        urls[0] = _gateway();

        revert OffchainLookup(
            address(this),
            urls,
            callData,
            request.callbackFunction,
            abi.encode(callData, address(this))
        );
    }

    /// @dev This MUST be called in the callback function of the implementing contract to verify the gateway's response.
    function _verifyFetch(
        bytes calldata response,
        bytes calldata request
    ) internal view returns (bytes memory) {
        return response;
    }

    /// @dev Proxy server that handles ABI encoding and decoding around JSON API requests.
    ///      A default is provided, but can be overridden by the implementing contract.
    function _gateway() internal pure virtual returns (string memory) {
        return "https://solidity-fetcher.gregskril.com";
    }
}
