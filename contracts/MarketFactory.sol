// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./Market.sol";

contract MarketFactory is Ownable {
    mapping(uint256 => address) public markets;
    uint256 public marketCount;
    bytes32 public marketsMerkleRoots;

    event MarketCreated(
        uint256 indexed marketId,
        address marketAddress,
        string question
    );

    constructor() Ownable(msg.sender) {}

    function createMarket(
        string memory _question,
        uint256 _endTime,
        address _collateralToken
    ) external onlyOwner returns (uint256) {
        uint256 marketId = marketCount;

        Market newMarket = new Market(_question, _endTime, _collateralToken);
        markets[marketId] = address(newMarket);
        marketCount += 1;

        emit MarketCreated(marketId, address(newMarket), _question);

        return marketId;
    }

    function getMarketAddress(
        uint256 _marketId
    ) external view returns (address) {
        require(_marketId < marketCount, "Market does not exist");
        return markets[_marketId];
    }

    function getMarketCount() external view returns (uint256) {
        return marketCount;
    }

    function getMarketInfo(
        uint256 _marketId
    )
        external
        view
        returns (
            string memory question,
            uint256 endTime,
            bool resolved,
            bool outcome,
            uint256 yesShares,
            uint256 noShares
        )
    {
        require(_marketId < marketCount, "Market does not exist");
        Market market = Market(markets[_marketId]);
        return market.getMarketInfo();
    }

    // updating the merkleroot when a new market is created
    function updateMarketsMerkleRoot(
        bytes32 _newMerkleRoot
    ) external onlyOwner {
        marketsMerkleRoots = _newMerkleRoot;
    }

    // verification process is separate from the market creation process,
    // allowing for efficient batch verification of market data when needed.
    function verifyMarketsBatch(
        bytes32[] calldata _merkleProof,
        uint256[] calldata _marketIds,
        address[] calldata _marketAddresses
    ) external view returns (bool) {
        require(
            _marketIds.length == _marketAddresses.length,
            "Arrays length mismatch"
        );

        bytes32 leaf = keccak256(
            abi.encodePacked(_marketIds, _marketAddresses)
        );
        return MerkleProof.verify(_merkleProof, marketsMerkleRoots, leaf);
    }
}
