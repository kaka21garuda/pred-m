// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOptimisticOracle {
    function requestPrice(
        bytes32 identifier,
        uint256 timestamp,
        bytes memory ancillaryData,
        IERC20 currency,
        uint256 reward
    ) external returns (uint256 requestId);

    function settleRequest(uint256 requestId) external;

    function getRequest(
        uint256 requestId
    )
        external
        view
        returns (
            address proposer,
            address disputer,
            IERC20 currency,
            bool settled,
            bool refunded,
            uint256 proposedPrice,
            uint256 resolvedPrice,
            uint256 expirationTime,
            uint256 reward,
            uint256 finalFee,
            uint256 bond,
            uint256 customLiveness
        );
}
