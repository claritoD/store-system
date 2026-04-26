const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(getDashboard));

module.exports = router;

