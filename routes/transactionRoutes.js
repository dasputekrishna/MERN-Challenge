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

// API to list transactions with search and pagination..
router.get('/transactions', async (req, res) => {
  const { page = 1, perPage = 10, search = '', month } = req.query;
  const regex = new RegExp(search, 'i');
  
  const startOfMonth = new Date(`${month} 1, 2023`);
  const endOfMonth = new Date(`${month} 1, 2023`);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);

  try {
    const query = {
      dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
      $or: [
        { title: regex },
        { description: regex },
        { price: { $regex: search, $options: 'i' } }
      ]
    };
    
    const transactions = await ProductTransaction
      .find(query)
      .skip((page - 1) * perPage)
      .limit(Number(perPage));

    const count = await ProductTransaction.countDocuments(query);
    res.json({ transactions, count, page, perPage });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// API for statistics (total sales, sold items, not sold items)..
router.get('/statistics', async (req, res) => {
  const { month } = req.query;

  const startOfMonth = new Date(`${month} 1, 2023`);
  const endOfMonth = new Date(`${month} 1, 2023`);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);

  try {
    const soldItems = await ProductTransaction.countDocuments({
      dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
      sold: true
    });

    const notSoldItems = await ProductTransaction.countDocuments({
      dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
      sold: false
    });

    const totalSales = await ProductTransaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
          sold: true
        }
      },
      {
        $group: { _id: null, total: { $sum: "$price" } }
      }
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      soldItems,
      notSoldItems
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// API for bar chart data (price ranges)..
router.get('/bar-chart', async (req, res) => {
  const { month } = req.query;

  const startOfMonth = new Date(`${month} 1, 2023`);
  const endOfMonth = new Date(`${month} 1, 2023`);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);

  const priceRanges = [
    { range: '0-100', min: 0, max: 100 },
    { range: '101-200', min: 101, max: 200 },
    { range: '201-300', min: 201, max: 300 },
    { range: '301-400', min: 301, max: 400 },
    { range: '401-500', min: 401, max: 500 },
    { range: '501-600', min: 501, max: 600 },
    { range: '601-700', min: 601, max: 700 },
    { range: '701-800', min: 701, max: 800 },
    { range: '801-900', min: 801, max: 900 },
    { range: '901-above', min: 901, max: Infinity }
  ];

  try {
    const data = await Promise.all(priceRanges.map(async (range) => {
      const count = await ProductTransaction.countDocuments({
        dateOfSale: { $gte: startOfMonth, $lt: endOfMonth },
        price: { $gte: range.min, $lte: range.max }
      });
      return { range: range.range, count };
    }));

    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// API for pie chart (unique categories and item count)..
router.get('/pie-chart', async (req, res) => {
  const { month } = req.query;

  const startOfMonth = new Date(`${month} 1, 2023`);
  const endOfMonth = new Date(`${month} 1, 2023`);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);

  try {
    const categories = await ProductTransaction.aggregate([
      {
        $match: {
          dateOfSale: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(categories.map(cat => ({ category: cat._id, count: cat.count })));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
