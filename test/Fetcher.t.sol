// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Fetcher} from "../src/Fetcher.sol";

contract FetcherTest is Test {
    Fetcher public fetcher;

    function setUp() public {
        fetcher = new Fetcher();
    }

    function test_FetchRevertsWithOffchainLookup() public {
        vm.expectRevert();
        fetcher.fetch(
            Fetcher.Request({
                url: "",
                method: "",
                path: "",
                callbackFunction: bytes4(0)
            })
        );
    }
}
