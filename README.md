# Polymarket-Inspired Prediction Market

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Smart Contract Architecture](#smart-contract-architecture)
5. [Setup and Installation](#setup-and-installation)
6. [Usage](#usage)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [License](#license)

## Project Overview

This project is a decentralized prediction market platform inspired by Polymarket. It allows users to create markets, place bets on outcomes, and earn rewards based on their predictions. The platform uses an Automated Market Maker (AMM) model for liquidity and integrates with decentralized oracles for result verification.

## Features

- Binary markets (Yes/No outcomes)
- Automated Market Maker (AMM) for efficient trading
- Integration with UMA's Optimistic Oracle for market resolution
- Use of stablecoin (e.g., USDC) as collateral
- User-friendly market creation and betting interface
- Liquidity provision mechanisms
- Decentralized governance (planned for future iterations)

## Technology Stack

- Solidity ^0.8.0
- Hardhat
- OpenZeppelin Contracts
- Chainlink (for price feeds, if needed)
- UMA Protocol (for Optimistic Oracle)
- Ethers.js
- React (for frontend, planned)

## Smart Contract Architecture

1. `MarketFactory.sol`: Handles the creation of new prediction markets
2. `Market.sol`: Manages individual markets, including betting and resolution
3. `AMM.sol`: Implements the Automated Market Maker functionality
4. `Oracle.sol`: Interface for interacting with UMA's Optimistic Oracle
5. `TokenInterface.sol`: For interacting with the stablecoin (e.g., USDC)

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/prediction-market.git
   cd prediction-market
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```
   ALCHEMY_API_KEY=your_alchemy_api_key
   PRIVATE_KEY=your_wallet_private_key
   ```

4. Compile the smart contracts:
   ```
   npx hardhat compile
   ```

## Usage

### Creating a New Market

```javascript
const MarketFactory = await ethers.getContractFactory("MarketFactory");
const marketFactory = await MarketFactory.deploy();
await marketFactory.deployed();

await marketFactory.createMarket(
  "Will ETH reach $5000 by end of 2023?",
  1672444800
);
```

### Placing a Bet

```javascript
const Market = await ethers.getContractFactory("Market");
const market = await Market.attach("DEPLOYED_MARKET_ADDRESS");

await market.placeBet(true, { value: ethers.utils.parseEther("1") });
```

## Testing

Run the test suite:

```
npx hardhat test
```

## Deployment

1. Update the `hardhat.config.js` file with the network details.

2. Deploy to the desired network:
   ```
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
