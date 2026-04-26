const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { createSale, listSales, getSale } = require('../controllers/salesController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(listSales));
router.get('/:id', asyncHandler(getSale));
router.post('/', asyncHandler(createSale));

module.exports = router;

