// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Fetcher} from "../Fetcher.sol";

contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
