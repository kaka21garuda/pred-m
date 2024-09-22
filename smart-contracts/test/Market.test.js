const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Market", function () {
  let market;
  let owner;
  let addr1;
  let addr2;
  let collateralToken;
  let oracle;
  let endTime;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
  
    // Deploy the MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    collateralToken = await MockERC20.deploy("Mock USDC", "MUSDC");
   
    console.log("Collateral Token Address:", collateralToken.address);
  
    // Deploy the MockOracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    oracle = await MockOracle.deploy();
    
    console.log("Oracle Address:", oracle.address);
  
    // Set the end time for the market
    const latestTime = await time.latest();
    endTime = latestTime + 86400; // 1 day later
  
    // Deploy the Market contract
    const Market = await ethers.getContractFactory("Market");
    market = await Market.deploy(
      "Will ETH reach $5000 by end of 2023?",
      endTime,
      collateralToken.address,
      oracle.address
    );

    console.log("Market Address:", market.address);
  
    // Mint tokens for addr1 and addr2 for testing
    await collateralToken.mint(addr1.address, ethers.parseEther("1000"));
    await collateralToken.mint(addr2.address, ethers.parseEther("1000"));
  });
  

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await market.owner()).to.equal(owner.address);
    });

    it("Should set the correct question", async function () {
      expect(await market.question()).to.equal("Will ETH reach $5000 by end of 2023?");
    });

    it("Should set the correct end time", async function () {
      expect(await market.endTime()).to.equal(endTime);
    });

    it("Should set the correct collateral token", async function () {
      console.log("Expected Collateral Token Address:", collateralToken.address);
      expect(await market.collateralToken()).to.equal(collateralToken.address);
    });

    it("Should set the correct oracle", async function () {
      console.log("Expected Oracle Address:", oracle.address);
      expect(await market.oracle()).to.equal(oracle.address);
    });
  });

  describe("Placing Bets", function () {
    it("Should allow placing a bet", async function () {
      await collateralToken.connect(addr1).approve(market.address, ethers.parseEther("100"));
      await market.connect(addr1).placeBet(true, ethers.parseEther("100"));
      expect(await market.yesShares()).to.equal(ethers.parseEther("100"));
      expect(await market.userShares(addr1.address, true)).to.equal(ethers.parseEther("100"));
    });

    it("Should emit BetPlaced event", async function () {
      await collateralToken.connect(addr1).approve(market.address, ethers.parseEther("100"));
      await expect(market.connect(addr1).placeBet(true, ethers.parseEther("100")))
        .to.emit(market, "BetPlaced")
        .withArgs(addr1.address, true, ethers.parseEther("100"));
    });

    it("Should not allow betting after end time", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      await collateralToken.connect(addr1).approve(market.address, ethers.parseEther("100"));
      await expect(market.connect(addr1).placeBet(true, ethers.parseEther("100"))).to.be.revertedWith("Market has closed");
    });

    it("Should not allow betting if market is resolved", async function () {
      await market.resolveMarket(true); // Resolve the market first

      await collateralToken.connect(addr1).approve(market.address, ethers.parseEther("100"));
      await expect(market.connect(addr1).placeBet(true, ethers.parseEther("100"))).to.be.revertedWith("Market already resolved");
    });
  });

  describe("Requesting Resolution", function () {
    it("Should allow owner to request resolution after end time", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      await expect(market.requestResolution())
        .to.emit(market, "OracleRequestSent");
    });

    it("Should not allow requesting resolution before end time", async function () {
      await expect(market.requestResolution()).to.be.revertedWith("Market hasn't closed yet");
    });

    it("Should not allow non-owner to request resolution", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine");

      await expect(market.connect(addr1).requestResolution()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Resolving Market", function () {
    beforeEach(async function () {
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine");
      await market.requestResolution();
    });

    it("Should allow resolving the market", async function () {
      await oracle.mockSettleRequest(1); // Mock oracle settling with "Yes" outcome
      await expect(market.resolveMarket(true))
        .to.emit(market, "MarketResolved")
        .withArgs(true);

      expect(await market.resolved()).to.be.true;
      expect(await market.outcome()).to.be.true;
    });

    it("Should not allow resolving before oracle settles", async function () {
      await expect(market.resolveMarket(true)).to.be.revertedWith("Oracle hasn't settled yet");
    });
  });

  describe("Claiming Winnings", function () {
    beforeEach(async function () {
      await collateralToken.connect(addr1).approve(market.address, ethers.parseEther("100"));
      await market.connect(addr1).placeBet(true, ethers.parseEther("100"));
      await collateralToken.connect(addr2).approve(market.address, ethers.parseEther("100"));
      await market.connect(addr2).placeBet(false, ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine");
      await market.requestResolution();
      await oracle.mockSettleRequest(1); // "Yes" outcome
      await market.resolveMarket(true);
    });

    it("Should allow winner to claim winnings", async function () {
      const initialBalance = await collateralToken.balanceOf(addr1.address);
      await market.connect(addr1).claimWinnings();
      const finalBalance = await collateralToken.balanceOf(addr1.address);
      expect(finalBalance.sub(initialBalance)).to.equal(ethers.parseEther("200")); // Winner gets all shares
    });

    it("Should not allow loser to claim winnings", async function () {
      await expect(market.connect(addr2).claimWinnings()).to.be.revertedWith("No winnings to claim");
    });

    it("Should emit WinningsClaimed event", async function () {
      await expect(market.connect(addr1).claimWinnings())
        .to.emit(market, "WinningsClaimed")
        .withArgs(addr1.address, ethers.parseEther("200"));
    });

    it("Should not allow claiming twice", async function () {
      await market.connect(addr1).claimWinnings();
      await expect(market.connect(addr1).claimWinnings()).to.be.revertedWith("No winnings to claim");
    });
  });

  describe("getMarketInfo", function () {
    it("Should return correct market info", async function () {
      const info = await market.getMarketInfo();
      expect(info._question).to.equal("Will ETH reach $5000 by end of 2023?");
      expect(info._endTime).to.equal(endTime);
      expect(info._resolved).to.be.false;
      expect(info._outcome).to.be.false;
      expect(info._yesShares).to.equal(0);
      expect(info._noShares).to.equal(0);
    });
  });
});
