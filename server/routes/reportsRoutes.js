const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { dailySales, monthlySales, productSales, lowStock } = require('../controllers/reportsController');

const router = express.Router();
router.use(requireAuth);

router.get('/daily', asyncHandler(dailySales));
router.get('/monthly', asyncHandler(monthlySales));
router.get('/products', asyncHandler(productSales));
router.get('/low-stock', asyncHandler(lowStock));

module.exports = router;

