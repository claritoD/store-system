const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(getSettings));
router.put('/', asyncHandler(updateSettings));

module.exports = router;

