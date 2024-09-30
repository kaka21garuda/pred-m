// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Market.sol";

contract AMM is ReentrancyGuard {
    Market public market; // reference to the associated Market contract.
    IERC20 public collateralToken;

    uint256 public constant SCALE = 1e18;
    uint256 public constant FEE = 5e15; // 0.5%
    uint256 public constant MAX_SLIPPAGE = 50; // 5%

    uint256 public yesLiquidity;
    uint256 public noLiquidity;

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event TokensPurchased(
        address indexed buyer,
        bool outcome,
        uint256 amount,
        uint256 cost
    );
    event TokensSold(
        address indexed seller,
        bool outcome,
        uint256 amount,
        uint256 payout
    );

    /*
    Initializes the contract with references to the Market and collateral token.
    */
    constructor(address _market, address _collateralToken) {
        market = Market(_market);
        collateralToken = IERC20(_collateralToken);
    }

    /*  
    Allows users to:
        • add liquidity to the AMM,
        • transfers collateral tokens from the user to the contract
        • splits the liquidity equally between YES and NO outcomes.
    */
    function addLiquidity(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            collateralToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        uint256 halfAmount = _amount / 2;
        yesLiquidity += halfAmount;
        noLiquidity += halfAmount;

        emit LiquidityAdded(msg.sender, _amount);
    }

    /*
    Allows users to:
        • remove liquidity from the AMM,
        • checks if there's sufficient liquidity before removal, 
        • transfers collateral tokens back to the user.
    */
    function removeLiquidity(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            yesLiquidity >= _amount / 2 && noLiquidity >= _amount / 2,
            "Insufficient liquidity"
        );

        yesLiquidity -= _amount / 2;
        noLiquidity -= _amount / 2;

        require(
            collateralToken.transfer(msg.sender, _amount),
            "Transfer failed"
        );
        emit LiquidityRemoved(msg.sender, _amount);
    }

    /*
    Allows users to:
        • buy outcome tokens (YES or NO),
        • calculates the cost using the getCostForTokens function,
        • updates the liquidity pools accordingly,
        • calls the placeBet function on the Market contract.
    */
    function buyTokens(
        bool _outcome,
        uint256 _amount,
        uint256 _maxCost
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        uint256 cost = getCostForTokens(_outcome, _amount);
        require(cost <= _maxCost, "Slippage exceeded");

        require(
            collateralToken.transferFrom(msg.sender, address(this), cost),
            "Transfer failed"
        );

        if (_outcome) {
            yesLiquidity += cost;
            noLiquidity -= _amount;
        } else {
            noLiquidity += cost;
            yesLiquidity -= _amount;
        }

        market.placeBet(_outcome, _amount);

        emit TokensPurchased(msg.sender, _outcome, _amount, cost);
    }

    /*
    Allows users to:
        • sell outcome tokens (YES or NO),
        • calculates the payout using the getPayoutForTokens function,
        • updates the liquidity pools and transfers the payout to the user.
    */
    function sellTokens(
        bool _outcome,
        uint256 _amount,
        uint256 _minPayout
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        uint256 payout = getPayoutForTokens(_outcome, _amount);
        require(payout >= _minPayout, "Slippage exceeded");

        if (_outcome) {
            yesLiquidity -= payout;
            noLiquidity += _amount;
        } else {
            noLiquidity -= payout;
            yesLiquidity += _amount;
        }

        require(
            collateralToken.transfer(msg.sender, payout),
            "Transfer failed"
        );
        emit TokensSold(msg.sender, _outcome, _amount, payout);
    }

    // Implement the constant product formula (x * y = k) for price calculation
    function getCostForTokens(
        bool _outcome,
        uint256 _amount
    ) public view returns (uint256) {
        uint256 liquidityIn = _outcome ? yesLiquidity : noLiquidity;
        uint256 liquidityOut = _outcome ? noLiquidity : yesLiquidity;

        uint256 costWithoutFee = (liquidityIn * _amount) /
            (liquidityOut - _amount);
        uint256 fee = (costWithoutFee * FEE) / SCALE;
        return costWithoutFee + fee;
    }

    // Implement the constant product formula (x * y = k) for price calculation
    function getPayoutForTokens(
        bool _outcome,
        uint256 _amount
    ) public view returns (uint256) {
        uint256 liquidityIn = _outcome ? yesLiquidity : noLiquidity;
        uint256 liquidityOut = _outcome ? noLiquidity : yesLiquidity;

        uint256 payoutWithoutFee = (liquidityOut * _amount) /
            (liquidityIn + _amount);
        uint256 fee = (payoutWithoutFee * FEE) / SCALE;
        return payoutWithoutFee - fee;
    }

    // to get the current price of YES/NO tokens
    function getCurrentPrice(bool _outcome) public view returns (uint256) {
        uint256 liquidityIn = _outcome ? yesLiquidity : noLiquidity;
        uint256 liquidityOut = _outcome ? noLiquidity : yesLiquidity;
        return (liquidityIn * SCALE) / liquidityOut;
    }

    // to check the current liquidity ratio
    function getLiquidityRatio() public view returns (uint256) {
        return (yesLiquidity * SCALE) / (yesLiquidity + noLiquidity);
    }
}
