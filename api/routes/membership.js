const express = require('express');
const { getMembershipData } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get all membership data with optional sorting and filtering
router.get('/', async (req, res) => {
  try {
    const { sort = '-date', limit = 1000, offset = 0, segment, region, date_from, date_to } = req.query;
    
    const where = {};
    if (segment) where.segment = segment;
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

    const MembershipData = getMembershipData();
    const data = await MembershipData.findAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(data);
  } catch (error) {
    console.error('Error fetching membership data:', error);
    res.status(500).json({ error: 'Failed to fetch membership data' });
  }
});

// Get membership data by ID
router.get('/:id', async (req, res) => {
  try {
    const MembershipData = getMembershipData();
    const data = await MembershipData.findByPk(req.params.id);
    
    if (!data) {
      return res.status(404).json({ error: 'Membership data not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching membership data:', error);
    res.status(500).json({ error: 'Failed to fetch membership data' });
  }
});

// Create new membership data
router.post('/', async (req, res) => {
  try {
    const MembershipData = getMembershipData();
    const data = await MembershipData.create(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating membership data:', error);
    res.status(400).json({ error: 'Failed to create membership data', details: error.message });
  }
});

// Update membership data
router.put('/:id', async (req, res) => {
  try {
    const MembershipData = getMembershipData();
    const [updated] = await MembershipData.update(req.body, {
      where: { id: req.params.id }
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Membership data not found' });
    }
    
    const data = await MembershipData.findByPk(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Error updating membership data:', error);
    res.status(400).json({ error: 'Failed to update membership data', details: error.message });
  }
});

// Delete membership data
router.delete('/:id', async (req, res) => {
  try {
    const MembershipData = getMembershipData();
    const deleted = await MembershipData.destroy({
      where: { id: req.params.id }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Membership data not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting membership data:', error);
    res.status(500).json({ error: 'Failed to delete membership data' });
  }
});

module.exports = router; 