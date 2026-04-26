const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  upload,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productsController');

const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProduct));
router.post('/', upload.single('image'), asyncHandler(createProduct));
router.put('/:id', upload.single('image'), asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));

module.exports = router;

