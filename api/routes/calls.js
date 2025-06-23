const express = require('express');
const { getCallData } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get all call data with optional sorting and filtering
router.get('/', async (req, res) => {
  try {
    const { sort = '-date', limit = 1000, offset = 0, call_type, region, date_from, date_to } = req.query;
    
    const where = {};
    if (call_type) where.call_type = call_type;
    if (region) where.region = region;
    if (date_from || date_to) {
      where.date = {};
      if (date_from) where.date[Op.gte] = date_from;
      if (date_to) where.date[Op.lte] = date_to;
    }

    const order = [];
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';
      order.push([sortField, sortDirection]);
    }

    const CallData = getCallData();
    const data = await CallData.findAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching call data:', error);
    res.status(500).json({ error: 'Failed to fetch call data' });
  }
});

// Get call data by ID
router.get('/:id', async (req, res) => {
  try {
    const CallData = getCallData();
    const data = await CallData.findByPk(req.params.id);
    
    if (!data) {
      return res.status(404).json({ error: 'Call data not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching call data:', error);
    res.status(500).json({ error: 'Failed to fetch call data' });
  }
});

// Create new call data
router.post('/', async (req, res) => {
  try {
    const CallData = getCallData();
    const data = await CallData.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating call data:', error);
    res.status(400).json({ error: 'Failed to create call data', details: error.message });
  }
});

// Update call data
router.put('/:id', async (req, res) => {
  try {
    const CallData = getCallData();
    const [updated] = await CallData.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Call data not found' });
    }
    
    const data = await CallData.findByPk(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Error updating call data:', error);
    res.status(400).json({ error: 'Failed to update call data', details: error.message });
  }
});

// Delete call data
router.delete('/:id', async (req, res) => {
  try {
    const CallData = getCallData();
    const deleted = await CallData.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Call data not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting call data:', error);
    res.status(500).json({ error: 'Failed to delete call data' });
  }
});

module.exports = router; 