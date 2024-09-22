// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockOracle {
    mapping(uint256 => bool) public settled;
    mapping(uint256 => uint256) public prices;

    function requestPrice(bytes32, uint256, bytes memory, address, uint256) external pure returns (uint256) {
        return 1;
    }

    function mockSettleRequest(uint256 price) external {
        settled[1] = true;
        prices[1] = price;
    }

    function getRequest(uint256) external view returns (
        address, address, address, bool, bool, uint256, uint256, uint256, uint256, uint256, uint256, uint256
    ) {
        return (address(0), address(0), address(0), settled[1], false, prices[1], 0, 0, 0, 0, 0, 0);
    }
}