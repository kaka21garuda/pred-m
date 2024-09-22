const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const marketRoutes = require('./routes/marketRoutes');
const OffchainService = require('./services/OffchainService');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/markets', marketRoutes);

// Start OffchainService
OffchainService.listenForMarketCreatedEvents();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));