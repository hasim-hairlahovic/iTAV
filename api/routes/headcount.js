const express = require('express');
const { getHeadcountData } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get all headcount data with optional sorting and filtering
router.get('/', async (req, res) => {
  try {
    const { sort = '-date', limit = 1000, offset = 0, department, region, date_from, date_to } = req.query;
    
    const where = {};
    if (department) where.department = department;
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

    const HeadcountData = getHeadcountData();
    const data = await HeadcountData.findAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching headcount data:', error);
    res.status(500).json({ error: 'Failed to fetch headcount data' });
  }
});

// Get headcount data by ID
router.get('/:id', async (req, res) => {
  try {
    const HeadcountData = getHeadcountData();
    const data = await HeadcountData.findByPk(req.params.id);
    
    if (!data) {
      return res.status(404).json({ error: 'Headcount data not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching headcount data:', error);
    res.status(500).json({ error: 'Failed to fetch headcount data' });
  }
});

// Create new headcount data
router.post('/', async (req, res) => {
  try {
    const HeadcountData = getHeadcountData();
    const data = await HeadcountData.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating headcount data:', error);
    res.status(400).json({ error: 'Failed to create headcount data', details: error.message });
  }
});

// Update headcount data
router.put('/:id', async (req, res) => {
  try {
    const HeadcountData = getHeadcountData();
    const [updated] = await HeadcountData.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Headcount data not found' });
    }
    
    const data = await HeadcountData.findByPk(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Error updating headcount data:', error);
    res.status(400).json({ error: 'Failed to update headcount data', details: error.message });
  }
});

// Delete headcount data
router.delete('/:id', async (req, res) => {
  try {
    const HeadcountData = getHeadcountData();
    const deleted = await HeadcountData.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Headcount data not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting headcount data:', error);
    res.status(500).json({ error: 'Failed to delete headcount data' });
  }
});

module.exports = router; 