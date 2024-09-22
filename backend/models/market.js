const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
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
  oracleRequestId: {
    type: String,
    default: null,
  },
  oracleResolved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Market', MarketSchema);