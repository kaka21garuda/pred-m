const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const ethers = require('ethers');

class MarketMerkleTree {
  constructor() {
    this.tree = new MerkleTree([], keccak256, { sortPairs: true });
  }

  addMarket(marketId, marketAddress) {
    const leaf = this.hashMarket(marketId, marketAddress);
    this.tree.addLeaf(leaf);
  }

  getRoot() {
    return this.tree.getRoot().toString('hex');
  }

  getProof(marketId, marketAddress) {
    const leaf = this.hashMarket(marketId, marketAddress);
    return this.tree.getProof(leaf).map(x => '0x' + x.data.toString('hex'));
  }

  verify(marketId, marketAddress) {
    const leaf = this.hashMarket(marketId, marketAddress);
    const proof = this.getProof(marketId, marketAddress);
    return this.tree.verify(proof, leaf, this.getRoot());
  }

  hashMarket(marketId, marketAddress) {
    return keccak256(ethers.utils.solidityPack(['uint256', 'address'], [marketId, marketAddress]));
  }
}

module.exports = new MarketMerkleTree();