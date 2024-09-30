const Market = require('../models/market');
const { ethers } = require('ethers');
const MarketFactoryABI = require('../abis/MarketFactory.json');
const MarketABI = require('../abis/Market.json');
const AMMABI = require('../abis/AMM.json');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const marketFactoryContract = new ethers.Contract(process.env.MARKET_FACTORY_ADDRESS, MarketFactoryABI, signer);

exports.getAllMarkets = catchAsync(async (req, res, next) => {
  const markets = await Market.find();
  res.status(200).json({
    status: 'success',
    results: markets.length,
    data: { markets }
  });
});

exports.getMarket = catchAsync(async (req, res, next) => {
  const market = await Market.findOne({ marketId: req.params.marketId });
  if (!market) {
    return next(new AppError('No market found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { market }
  });
});

exports.createMarket = catchAsync(async (req, res, next) => {
  const { question, endTime, collateralToken, oracleAddress } = req.body;

  if (!question || !endTime || !collateralToken || !oracleAddress) {
    return next(new AppError('Missing required parameters', 400));
  }

  const endTimeUnix = Math.floor(new Date(endTime).getTime() / 1000);

  const tx = await marketFactoryContract.createMarket(
    question,
    endTimeUnix,
    collateralToken,
    oracleAddress
  );
  const receipt = await tx.wait();
  const marketCreatedEvent = receipt.events.find(e => e.event === 'MarketCreated');
  const [marketId, marketAddress] = marketCreatedEvent.args;

  const market = await Market.create({
    marketId: marketId.toString(),
    question,
    endTime,
    contractAddress: marketAddress,
    collateralToken,
    oracleAddress
  });

  res.status(201).json({
    status: 'success',
    data: { market }
  });
});

exports.deployAMM = catchAsync(async (req, res, next) => {
  const { marketId, collateralToken } = req.body;
  const market = await Market.findOne({ marketId });
  
  if (!market) {
    return next(new AppError('Market not found', 404));
  }

  // Deploy AMM logic here
  // This is a placeholder. You'll need to implement the actual AMM deployment.
  const AMMFactory = new ethers.ContractFactory(AMMABI.abi, AMMABI.bytecode, signer);
  const ammContract = await AMMFactory.deploy(market.contractAddress, collateralToken);
  await ammContract.deployed();
  const ammAddress = ammContract.address;

  const tx = await marketFactoryContract.linkAMMToMarket(marketId, ammAddress);
  await tx.wait();

  market.ammAddress = ammAddress;
  await market.save();

  res.status(200).json({
    status: 'success',
    data: { ammAddress }
  });
});

exports.addLiquidity = catchAsync(async (req, res, next) => {
  const { marketId, amount } = req.body;
  const market = await Market.findOne({ marketId });
  
  if (!market || !market.ammAddress) {
    return next(new AppError('Market or AMM not found', 404));
  }

  const ammContract = new ethers.Contract(market.ammAddress, AMMABI.abi, signer);
  const tx = await ammContract.addLiquidity(ethers.utils.parseEther(amount));
  await tx.wait();

  res.status(200).json({
    status: 'success',
    message: 'Liquidity added'
  });
});

exports.placeBet = catchAsync(async (req, res, next) => {
  const { marketId, outcome, amount, maxCost } = req.body;
  const market = await Market.findOne({ marketId });
  
  if (!market || !market.ammAddress) {
    return next(new AppError('Market or AMM not found', 404));
  }

  const ammContract = new ethers.Contract(market.ammAddress, AMMABI.abi, signer);
  const tx = await ammContract.buyTokens(outcome, ethers.utils.parseEther(amount), ethers.utils.parseEther(maxCost));
  await tx.wait();

  res.status(200).json({
    status: 'success',
    message: 'Bet placed'
  });
});

exports.requestResolution = catchAsync(async (req, res, next) => {
  const { marketId } = req.params;
  const market = await Market.findOne({ marketId });
  
  if (!market) {
    return next(new AppError('Market not found', 404));
  }

  const marketContract = new ethers.Contract(market.contractAddress, MarketABI.abi, signer);
  const tx = await marketContract.requestResolution();
  const receipt = await tx.wait();
  const requestEvent = receipt.events.find(e => e.event === 'OracleRequestSent');
  const [requestId] = requestEvent.args;

  market.oracleRequestId = requestId.toString();
  await market.save();

  res.status(200).json({
    status: 'success',
    data: { requestId: requestId.toString() }
  });
});

exports.resolveMarket = catchAsync(async (req, res, next) => {
  const { marketId } = req.params;
  const market = await Market.findOne({ marketId });
  
  if (!market) {
    return next(new AppError('Market not found', 404));
  }

  const marketContract = new ethers.Contract(market.contractAddress, MarketABI.abi, signer);
  const tx = await marketContract.resolveMarket();
  await tx.wait();

  const marketInfo = await marketContract.getMarketInfo();
  market.resolved = marketInfo.resolved;
  market.outcome = marketInfo.outcome;
  await market.save();

  res.status(200).json({
    status: 'success',
    data: { outcome: market.outcome }
  });
});

exports.claimWinnings = catchAsync(async (req, res, next) => {
  const { marketId } = req.params;
  const market = await Market.findOne({ marketId });
  
  if (!market) {
    return next(new AppError('Market not found', 404));
  }

  const marketContract = new ethers.Contract(market.contractAddress, MarketABI.abi, signer);
  const tx = await marketContract.claimWinnings();
  await tx.wait();

  res.status(200).json({
    status: 'success',
    message: 'Winnings claimed'
  });
});