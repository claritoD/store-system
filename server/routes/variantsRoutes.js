const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant
} = require('../controllers/variantsController');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(listVariants));
router.post('/', asyncHandler(createVariant));
router.put('/:id', asyncHandler(updateVariant));
router.delete('/:id', asyncHandler(deleteVariant));

module.exports = router;

