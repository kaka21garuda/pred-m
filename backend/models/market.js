const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  marketId: {
    type: String,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: true,
    unique: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  outcome: {
    type: Boolean,
    default: null,
  },
  yesShares: {
    type: Number,
    default: 0,
  },
  noShares: {
    type: Number,
    default: 0,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  ammAddress: {
    type: String,
    default: null,
  },
  collateralToken: {
    type: String,
    required: true,
  },
  oracleAddress: {
    type: String,
    required: true,
  },
  oracleRequestId: {
    type: String,
    default: null,
  },
  oracleResolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Market', MarketSchema);