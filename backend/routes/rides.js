const express = require('express');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');

// Create ride
router.post('/', auth, async (req, res) => {
  try {
    const ride = new Ride({
      ...req.body,
      driver: req.user._id
    });
    
    await ride.save();
    await ride.populate('driver', 'name rating totalRides');
    
    res.status(201).json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Search rides
router.get('/search', async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      date, 
      minPrice, 
      maxPrice, 
      availableSeats 
    } = req.query;
    
    let query = { status: 'active' };
    
    // Build search query
    if (origin) {
      query['origin.address'] = { $regex: origin, $options: 'i' };
    }
    
    if (destination) {
      query['destination.address'] = { $regex: destination, $options: 'i' };
    }
    
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.departureTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (minPrice || maxPrice) {
      query.pricePerSeat = {};
      if (minPrice) query.pricePerSeat.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerSeat.$lte = parseFloat(maxPrice);
    }
    
    if (availableSeats) {
      query.$expr = {
        $gte: [
          { $subtract: ['$availableSeats', '$bookedSeats'] },
          parseInt(availableSeats)
        ]
      };
    }
    
    const rides = await Ride.find(query)
      .populate('driver', 'name rating totalRides')
      .sort({ departureTime: 1 });
    
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's rides
router.get('/my-rides', auth, async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id })
      .populate('driver', 'name rating')
      .sort({ departureTime: -1 });
    
    res.json(rides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ride
router.put('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findOne({ 
      _id: req.params.id, 
      driver: req.user._id 
    });
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    // Don't allow updates if ride has bookings
    if (ride.bookedSeats > 0) {
      return res.status(400).json({ 
        error: 'Cannot modify ride with existing bookings' 
      });
    }
    
    Object.assign(ride, req.body);
    await ride.save();
    
    res.json(ride);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});