const express = require('express');
const axios = require('axios');
const { getForecastScenario } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Python forecasting service URL
const FORECASTING_SERVICE_URL = process.env.FORECASTING_SERVICE_URL || 'http://forecasting-engine:8000';

// Get all forecast scenarios with optional sorting and filtering
router.get('/', async (req, res) => {
  try {
    const { sort = '-forecast_date', limit = 1000, offset = 0, scenario_type, date_from, date_to } = req.query;
    
    const where = {};
    if (scenario_type) where.scenario_type = scenario_type;
    if (date_from || date_to) {
      where.forecast_date = {};
      if (date_from) where.forecast_date[Op.gte] = date_from;
      if (date_to) where.forecast_date[Op.lte] = date_to;
    }

    const order = [];
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';
      order.push([sortField, sortDirection]);
    }

    const ForecastScenario = getForecastScenario();
    const data = await ForecastScenario.findAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching forecast scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch forecast scenarios' });
  }
});

// Health check for Python forecasting service (must be before /:id route)
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${FORECASTING_SERVICE_URL}/health/detailed`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      status: 'healthy',
      forecasting_service: response.data,
      integration: 'active'
    });
  } catch (error) {
    console.error('Forecasting service health check failed:', error.message);
    
    res.status(503).json({
      status: 'unhealthy',
      forecasting_service: 'unavailable',
      integration: 'failed',
      error: error.message
    });
  }
});

// Get forecast scenario by ID
router.get('/:id', async (req, res) => {
  try {
    const ForecastScenario = getForecastScenario();
    const data = await ForecastScenario.findByPk(req.params.id);
    
    if (!data) {
      return res.status(404).json({ error: 'Forecast scenario not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching forecast scenario:', error);
    res.status(500).json({ error: 'Failed to fetch forecast scenario' });
  }
});

// Create new forecast scenario
router.post('/', async (req, res) => {
  try {
    const ForecastScenario = getForecastScenario();
    const data = await ForecastScenario.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating forecast scenario:', error);
    res.status(400).json({ error: 'Failed to create forecast scenario', details: error.message });
  }
});

// Update forecast scenario
router.put('/:id', async (req, res) => {
  try {
    const ForecastScenario = getForecastScenario();
    const [updated] = await ForecastScenario.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Forecast scenario not found' });
    }
    
    const data = await ForecastScenario.findByPk(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Error updating forecast scenario:', error);
    res.status(400).json({ error: 'Failed to update forecast scenario', details: error.message });
  }
});

// Delete forecast scenario
router.delete('/:id', async (req, res) => {
  try {
    const ForecastScenario = getForecastScenario();
    const deleted = await ForecastScenario.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Forecast scenario not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting forecast scenario:', error);
    res.status(500).json({ error: 'Failed to delete forecast scenario' });
  }
});

// Generate new forecast using Python forecasting engine
router.post('/generate', async (req, res) => {
  try {
    console.log('Generating forecast using Python service...');
    
    const response = await axios.post(`${FORECASTING_SERVICE_URL}/api/forecasting/generate`, req.body, {
      timeout: 300000, // 5 minute timeout for complex forecasts
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Forecast generated successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error generating forecast:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to generate forecast', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Generate baseline forecast
router.post('/baseline', async (req, res) => {
  try {
    console.log('Generating baseline forecast...');
    
    const { forecast_months = 12 } = req.body;
    
    const response = await axios.post(
      `${FORECASTING_SERVICE_URL}/api/forecasting/baseline?forecast_months=${forecast_months}`,
      {},
      {
        timeout: 300000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Baseline forecast generated successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error generating baseline forecast:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to generate baseline forecast', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Run backtest analysis
router.post('/backtest', async (req, res) => {
  try {
    console.log('Running backtest analysis...');
    
    const response = await axios.post(`${FORECASTING_SERVICE_URL}/api/forecasting/backtest`, req.body, {
      timeout: 600000, // 10 minute timeout for backtest
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Backtest completed successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error running backtest:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to run backtest', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Get model diagnostics
router.get('/diagnostics', async (req, res) => {
  try {
    console.log('Fetching model diagnostics...');
    
    const response = await axios.get(`${FORECASTING_SERVICE_URL}/api/forecasting/diagnostics`, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching diagnostics:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch diagnostics', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Get accuracy metrics
router.get('/accuracy-metrics', async (req, res) => {
  try {
    const { scenario_id } = req.query;
    const url = scenario_id 
      ? `${FORECASTING_SERVICE_URL}/api/forecasting/accuracy-metrics?scenario_id=${scenario_id}`
      : `${FORECASTING_SERVICE_URL}/api/forecasting/accuracy-metrics`;
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching accuracy metrics:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch accuracy metrics', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Scenario management endpoints (proxy to Python service)
router.get('/scenarios', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${FORECASTING_SERVICE_URL}/api/scenarios${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching scenarios:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch scenarios', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

router.post('/scenarios/compare', async (req, res) => {
  try {
    const response = await axios.post(`${FORECASTING_SERVICE_URL}/api/scenarios/compare`, req.body, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error comparing scenarios:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to compare scenarios', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

// Analytics endpoints (proxy to Python service)
router.get('/analytics/performance-metrics', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${FORECASTING_SERVICE_URL}/api/analytics/performance-metrics${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching performance metrics:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch performance metrics', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

router.get('/analytics/seasonal-patterns', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${FORECASTING_SERVICE_URL}/api/analytics/seasonal-patterns${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching seasonal patterns:', error.response?.data || error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch seasonal patterns', 
        details: error.message,
        service: 'Python Forecasting Engine'
      });
    }
  }
});

module.exports = router; 