import express from 'express';
import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import User, { findOne } from '../models/User';

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user exists
    const existingUser = await findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const user = new User({
      name, email, phone, password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = sign({ userId: user._id }, process.env.JWT_SECRET);
    
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = sign({ userId: user._id }, process.env.JWT_SECRET);
    
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});