// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Market is ReentrancyGuard {
    string public question; // the market question
    uint256 public endTime; // When the market closes
    address public creator; // Who created the market
    bool public resolved; // Has the market been resolved?
    bool public outcome; // The final outcome (if resolved)

    // Total shares for each outcome
    uint256 public yesShares;
    uint256 public noShares;

    IERC20 public collateralToken;

    // Track user's shares for each outcome
    mapping(address => mapping(bool => uint256)) public userShares;

    event BetPlaced(address user, bool prediction, uint256 amount);
    event MarketResolved(bool outcome);

    constructor(string memory _question, uint256 _endTime, address _creator, address _collateralToken) {
        question = _question;
        endTime = _endTime;
        creator = _creator;
        collateralToken = IERC20(_collateralToken);
    }

    function placeBet(bool _prediction, uint256 _amount) external nonReentrant {
        require(block.timestamp < endTime, "Market has closed");
        require(!resolved, "Market already resolved");
        require((collateralToken.transferFrom(msg.sender, address(this), _amount)), "Transfer Failed");

        if (_prediction) {
            yesShares += _amount;
        } else {
            noShares += _amount;
        }

        userShares[msg.sender][_prediction] += _amount;
        emit BetPlaced(msg.sender, _prediction, _amount);
    }

    function resolveMarket(bool _outcome) external {
        require(msg.sender == creator, "Only creator can resolve");
        require(block.timestamp >= endTime, "Market hasn't closed yet");
        require(!resolved, "Market already resolved");

        resolved = true;
        outcome = _outcome;

        emit MarketResolved(_outcome);
    }

    function claimWinnings() external nonReentrant {
        require(resolved, "Market hasn't resolved yet");

        uint256 winningShares = userShares[msg.sender][outcome];
        require(winningShares > 0, "No winnings to claim");

        uint256 totalShares = yesShares + noShares;
        uint256 winnings = (winningShares * totalShares) / (outcome ? yesShares : noShares);

        userShares[msg.sender][outcome] = 0;
        require(collateralToken.transfer(msg.sender, winnings), "Transfer Failed");
    }

    

}