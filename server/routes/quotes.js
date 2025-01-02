const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Auth header:', req.headers.authorization);
    console.log('User ID from middleware:', req.userId);

    console.log('Fetching quote from API Ninjas...');
    console.log('API Key:', process.env.API_NINJA_KEY);

    const response = await fetch('https://api.api-ninjas.com/v1/quotes', {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.API_NINJA_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to fetch quote: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response format');
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error in quotes route:', error);
    res.status(500).json({
      message: 'Error fetching quote',
      error: error.message,
    });
  }
});

module.exports = router;
