# Polymarket-Inspired Prediction Market

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Smart Contract Architecture](#smart-contract-architecture)
5. [Application Flow](#application-flow)
6. [Setup and Installation](#setup-and-installation)
7. [Usage](#usage)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

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

## Application Flow

<details>
<summary>Click to expand the application flow diagram</summary>
```mermaid
graph TD
    A[User] --> B{Action?}
    B -->|Create Market| C[MarketFactory Contract]
    C --> D[Create new Market Contract]
    D --> E[Emit MarketCreated Event]

    B -->|Add Liquidity| H[AMM Contract]
    H --> I[Transfer Collateral]
    I --> J[Update Liquidity Pools]

    B -->|Buy Tokens| K[AMM Contract]
    K --> L[Calculate Cost]
    L --> M[Transfer Collateral]
    M --> N[Update Liquidity Pools]
    N --> O[Place Bet on Market Contract]

    B -->|Sell Tokens| P[AMM Contract]
    P --> Q[Calculate Payout]
    Q --> R[Update Liquidity Pools]
    R --> S[Transfer Payout]

    B -->|Resolve Market| T[Market Contract]
    T --> U[Set Outcome]
    U --> V[Allow Claiming]

    B -->|Claim Winnings| W[Market Contract]
    W --> X[Verify Outcome]
    X --> Y[Transfer Winnings]

    E --> Z[Off-chain Service]
    J --> Z
    O --> Z
    S --> Z
    V --> Z
    Z --> AA[Calculate New Merkle Root]
    AA --> AB[Update Merkle Root on MarketFactory]

    AC[Front-end / Other Services] --> AD[Verify Multiple Markets]
    AD --> AE[Use Merkle Proof]
    AE --> AF[Call verifyMarketsBatch on MarketFactory]

    style A fill:#f9f,stroke:#333,stroke-width:2px,color:#000
    style B fill:#ccf,stroke:#333,stroke-width:2px,color:#000
    style C fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style H fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style K fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style P fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style T fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style W fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    style Z fill:#fcf,stroke:#333,stroke-width:2px,color:#000
    style AC fill:#cff,stroke:#333,stroke-width:2px,color:#000

</details>```

This diagram illustrates the main flows in the prediction market application:

1. Market Creation: User creates a market through the MarketFactory.
2. Liquidity Provision: User adds liquidity to the AMM.
3. Token Trading: Users can buy or sell tokens through the AMM.
4. Market Resolution: The market is resolved by setting the outcome.
5. Claiming Winnings: Users can claim their winnings if they bet correctly.

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
