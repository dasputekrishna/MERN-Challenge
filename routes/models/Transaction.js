const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  dateOfSale: Date,
  sold: Boolean
});

const ProductTransaction = mongoose.model('ProductTransaction', transactionSchema);
module.exports = ProductTransaction;
