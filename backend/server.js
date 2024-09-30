const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const marketRoutes = require('./routes/marketRoutes');
const authRoutes = require('./routes/authRoutes');
const OffchainService = require('./services/OffChainService');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

require('dotenv').config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/auth', authRoutes);

// Start OffchainService
OffchainService.init();

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

module.exports = app; // for testing purposes