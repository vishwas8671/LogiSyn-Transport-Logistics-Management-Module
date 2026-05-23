import express from 'express';
import {
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
} from '../controllers/driverController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getDrivers);
router.get('/:id', getDriverById);

// Admin & Manager controls
router.put('/:id', authorize('admin', 'manager'), updateDriver);

// Admin controls
router.delete('/:id', authorize('admin'), deleteDriver);

// Status controls
router.patch('/:id/status', updateDriverStatus);

export default router;
