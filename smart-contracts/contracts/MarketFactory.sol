// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../../node_modules/@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "./Market.sol";
import "./AMM.sol";

contract MarketFactory is Ownable {
    mapping(uint256 => address) public markets;
    mapping(uint256 => address) public marketToAMM;

    uint256 public marketCount;
    address public immutable collateralToken;
    address public immutable umaOracle;
    bytes32 public marketsMerkleRoots;

    event MarketCreated(
        uint256 indexed marketId,
        address marketAddress,
        string question
    );
    event AMMLinked(uint256 indexed marketId, address ammAddress);
    event MerkleRootUpdated(bytes32 newRoot);

    constructor(
        address _collateralToken,
        address _umaOracle
    ) Ownable(msg.sender) {
        collateralToken = _collateralToken;
        umaOracle = _umaOracle;
    }

    function createMarket(
        string memory _question,
        uint256 _endTime
    ) external onlyOwner returns (uint256) {
        uint256 marketId = marketCount;

        Market newMarket = new Market(
            _question,
            _endTime,
            collateralToken,
            umaOracle
        );

        markets[marketId] = address(newMarket);
        marketCount += 1;

        emit MarketCreated(marketId, address(newMarket), _question);
        return marketId;
    }

    function linkAMMToMarket(
        uint256 _marketId,
        address _ammAddress
    ) external onlyOwner {
        require(markets[_marketId] != address(0), "Market doesn't exist");
        require(
            marketToAMM[_marketId] == address(0),
            "AMM already linked to this market"
        );

        marketToAMM[_marketId] = _ammAddress;
        emit AMMLinked(_marketId, _ammAddress);
    }

    function getMarketAddress(
        uint256 _marketId
    ) external view returns (address) {
        require(_marketId < marketCount, "Market does not exist");
        return markets[_marketId];
    }

    function getAMMAddress(uint256 _marketId) external view returns (address) {
        require(_marketId < marketCount, "Market does not exist");
        return marketToAMM[_marketId];
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
        emit MerkleRootUpdated(_newMerkleRoot);
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
