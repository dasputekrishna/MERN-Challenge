const express = require('express');
const axios = require('axios');
const ProductTransaction = require('../models/Transaction');
const router = express.Router();

router.get('/initialize', async (req, res) => {
  try {
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const transactions = response.data;
    
    await ProductTransaction.insertMany(transactions);
    res.status(200).send('Database Initialized');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
