// controllers/marketController.js
const Market = require('../models/Market');

exports.createMarket = async (req, res) => {
  try {
    const { question, options, endTime, contractAddress } = req.body;
    const market = new Market({
      question,
      options,
      endTime,
      contractAddress,
    });
    await market.save();
    res.status(201).json(market);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMarkets = async (req, res) => {
  try {
    const markets = await Market.find();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};