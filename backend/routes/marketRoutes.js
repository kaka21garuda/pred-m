const express = require('express');
const marketController = require('../controllers/marketController');
//const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', marketController.getAllMarkets);
router.get('/:marketId', marketController.getMarket);

// Protected routes
//router.use(authMiddleware.protect);

router.post('/create', marketController.createMarket);
router.post('/deploy-amm', marketController.deployAMM);
router.post('/add-liquidity', marketController.addLiquidity);
router.post('/place-bet', marketController.placeBet);
router.post('/:marketId/request-resolution', marketController.requestResolution);
router.post('/:marketId/resolve', marketController.resolveMarket);
router.post('/:marketId/claim-winnings', marketController.claimWinnings);

module.exports = router;