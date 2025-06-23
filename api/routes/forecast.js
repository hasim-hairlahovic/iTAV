const express = require('express');
const { getForecastScenario } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

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

module.exports = router; 