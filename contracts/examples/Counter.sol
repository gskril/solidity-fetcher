// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Fetcher} from "../Fetcher.sol";

/// @dev Simple example contract that implements Fetcher.
///      The intended pattern is to call `awaitSetNumber()` from an application, which fetches an offchain value and
///      then calls `setNumber()` in the callback which is actually what's executed onchain. Both functions must have
///      the same return type for easy usage in applications.
contract Counter is Fetcher {
    uint256 public number;

    /// @dev This function initiates an API request, which will then call `setNumber()` with all the data needed for it
    ///      to return a number.
    /// @dev Marked as payable to explicity make it a transaction, otherwise it will be interpreted as a read method.
    function awaitSetNumber() public payable returns (uint256) {
        Request memory request = Request({
            url: "https://www.randomnumberapi.com/api/v1.0/random",
            path: "[0]",
            callbackFunction: this.setNumber.selector
        });

        fetch(request);
    }

    /// @dev The callback function is what will get executed onchain. It must accept `(bytes, bytes)` to comply
    ///      with ERC-3668, and should return the type of whatever's expected from the API.
    function setNumber(
        bytes calldata fetchResponse,
        bytes calldata fetchRequest
    ) public returns (uint256) {
        bytes memory encodedResponse = _verifyFetch(
            fetchResponse,
            fetchRequest
        );

        // This is where you can decode the response and do whatever you need with it.
        number = abi.decode(encodedResponse, (uint256));
        return number;
    }
}
