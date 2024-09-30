const ethers = require('ethers');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const MarketFactoryABI = require('../abis/MarketFactory.json');
const logger = require('../utils/logger');

class OffchainService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.marketFactory = new ethers.Contract(process.env.MARKET_FACTORY_ADDRESS, MarketFactoryABI.abi, this.provider);
    this.merkleTree = new MerkleTree([], keccak256, { sortPairs: true });
  }

  init() {
    this.listenForMarketCreatedEvents();
    this.scheduleRootUpdates();
  }

  async listenForMarketCreatedEvents() {
    this.marketFactory.on('MarketCreated', async (marketId, marketAddress, event) => {
      logger.info(`New market created: ${marketId} at ${marketAddress}`);
      await this.addMarket(marketId, marketAddress);
    });
  }

  async addMarket(marketId, marketAddress) {
    try {
      const leaf = this.hashMarket(marketId, marketAddress);
      this.merkleTree.addLeaf(leaf);
      logger.info(`Updated Merkle tree for market ${marketId}`);
      await this.updateMarketsMerkleRoot();
    } catch (error) {
      logger.error(`Error updating Merkle tree: ${error.message}`);
    }
  }

  async updateMarketsMerkleRoot() {
    try {
      const merkleRoot = this.getRoot();
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      const marketFactoryWithSigner = this.marketFactory.connect(signer);
      const tx = await marketFactoryWithSigner.updateMarketsMerkleRoot(`0x${merkleRoot}`);
      await tx.wait();
      logger.info('Markets Merkle root updated on-chain');
    } catch (error) {
      logger.error(`Error updating Merkle root on-chain: ${error.message}`);
    }
  }

  scheduleRootUpdates() {
    setInterval(() => {
      this.updateMarketsMerkleRoot();
    }, 3600000); // Update every hour
  }

  getRoot() {
    return this.merkleTree.getRoot().toString('hex');
  }

  getProof(marketId, marketAddress) {
    const leaf = this.hashMarket(marketId, marketAddress);
    return this.merkleTree.getProof(leaf).map(x => '0x' + x.data.toString('hex'));
  }

  verify(marketId, marketAddress) {
    const leaf = this.hashMarket(marketId, marketAddress);
    const proof = this.getProof(marketId, marketAddress);
    return this.merkleTree.verify(proof, leaf, this.getRoot());
  }

  hashMarket(marketId, marketAddress) {
    return keccak256(ethers.utils.solidityPack(['uint256', 'address'], [marketId, marketAddress]));
  }
}

module.exports = new OffchainService();