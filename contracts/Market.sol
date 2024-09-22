// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Oracle.sol";

contract Market is ReentrancyGuard, Ownable {
    string public question; // the market question
    uint256 public endTime; // When the market closes
    bool public resolved; // Has the market been resolved?
    bool public outcome; // The final outcome (if resolved)

    // Total shares for each outcome
    uint256 public yesShares;
    uint256 public noShares;

    IERC20 public immutable collateralToken;

    // Track user's shares for each outcome
    mapping(address => mapping(bool => uint256)) public userShares;

    // UMA Integration
    IOptimisticOracle public oracle;
    bytes32 public constant ORACLE_IDENTIFIER = bytes32("YES_OR_NO_QUERY");
    uint256 public oracleRequestId;
    uint256 public constant ORACLE_LIVENESS = 7200; // 2 hours in seconds

    event BetPlaced(address user, bool prediction, uint256 amount);
    event MarketResolved(bool outcome);
    event WinningsClaimed(address indexed user, uint256 amount);
    event OracleRequestSent(uint256 requestId);
    event OracleResolved(bool outcome);

    constructor(
        string memory _question,
        uint256 _endTime,
        address _collateralToken,
        address _oracle
    ) Ownable(msg.sender) {
        require(_endTime > block.timestamp, "End time must be in the future");
        question = _question;
        endTime = _endTime;
        collateralToken = IERC20(_collateralToken);
        oracle = IOptimisticOracle(_oracle);
    }

    function placeBet(bool _prediction, uint256 _amount) external nonReentrant {
        require(block.timestamp < endTime, "Market has closed");
        require(!resolved, "Market already resolved");
        require(
            (collateralToken.transferFrom(msg.sender, address(this), _amount)),
            "Transfer Failed"
        );

        if (_prediction) {
            yesShares += _amount;
        } else {
            noShares += _amount;
        }

        userShares[msg.sender][_prediction] += _amount;
        emit BetPlaced(msg.sender, _prediction, _amount);
    }

    // initiates a request to the oracle to resolve the market by determining the outcome of a prediction.
    function requestResolution() external onlyOwner {
        require(block.timestamp >= endTime, "Market hasn't closed yet");
        require(!resolved, "Market already resolved");

        bytes memory ancillaryData = abi.encodePacked(question);
        uint256 requestId = oracle.requestPrice(
            ORACLE_IDENTIFIER,
            endTime,
            ancillaryData,
            collateralToken,
            0 // for no reward
        );
        oracleRequestId = requestId;
        emit OracleRequestSent(requestId);
    }

    // finalizes the market resolution based on the oracle's response.
    function resolveMarket(bool _outcome) external {
        require(oracleRequestId != 0, "Oracle request not sent");
        (, , , bool settled, , uint256 resolvedPrice, , , , , , ) = oracle
            .getRequest(oracleRequestId);
        require(settled, "Oracle hasn't settled yet");

        outcome = resolvedPrice == 1;
        resolved = true;

        emit MarketResolved(_outcome);
        emit OracleResolved(outcome);
    }

    function claimWinnings() external nonReentrant {
        require(resolved, "Market hasn't resolved yet");

        uint256 winningShares = userShares[msg.sender][outcome];
        require(winningShares > 0, "No winnings to claim");

        uint256 totalShares = yesShares + noShares;
        uint256 winnings = (winningShares * totalShares) /
            (outcome ? yesShares : noShares);

        userShares[msg.sender][outcome] = 0;
        require(
            collateralToken.transfer(msg.sender, winnings),
            "Transfer Failed"
        );

        emit WinningsClaimed(msg.sender, winnings);
    }

    function getMarketInfo()
        external
        view
        returns (
            string memory _question,
            uint256 _endTime,
            bool _resolved,
            bool _outcome,
            uint256 _yesShares,
            uint256 _noShares
        )
    {
        return (question, endTime, resolved, outcome, yesShares, noShares);
    }
}
