// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";

import {Counter} from "../src/examples/Counter.sol";

// Idk how to test Fetcher directly due to logic being internal, so these tests are for an example implementation.
contract FetcherTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_FetchRevertsWithOffchainLookup() public {
        vm.expectRevert();
        counter.awaitSetNumber();
    }
}
