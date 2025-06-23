const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Sequelize } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/analytics_db', {
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://192.168.1.100:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import models and routes
const { initModels } = require('./models');
const membershipRoutes = require('./routes/membership');
const callRoutes = require('./routes/calls');
const headcountRoutes = require('./routes/headcount');
const forecastRoutes = require('./routes/forecast');
const { router: authRoutes } = require('./routes/auth');
const integrationRoutes = require('./routes/integrations');
const dataManagementRoutes = require('./routes/data-management');

// Initialize database models
initModels(sequelize);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/headcount', headcountRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/data-management', dataManagementRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Analytics API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Database schema is managed by init.sql
    console.log('Database models loaded successfully.');
    
    app.listen(PORT, () => {
      console.log(`Analytics API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer(); 