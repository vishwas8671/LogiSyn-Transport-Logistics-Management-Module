import express from 'express';
import { body } from 'express-validator';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleLocation,
} from '../controllers/vehicleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

const vehicleValidation = [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('type').isIn(['Semi-Truck', 'Flatbed', 'Box Truck', 'Cargo Van', 'Reefer']).withMessage('Invalid vehicle type'),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('fuelEfficiency').isNumeric().withMessage('Fuel efficiency must be a number'),
  body('insuranceExpiry').isISO8601().toDate().withMessage('Provide a valid insurance expiry date'),
];

router.use(protect);

router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Manager and Admin privileges
router.post('/', authorize('admin', 'manager'), vehicleValidation, validateRequest, createVehicle);
router.put('/:id', authorize('admin', 'manager'), updateVehicle);

// Admin only privileges
router.delete('/:id', authorize('admin'), deleteVehicle);

// Location updates (Drivers and Managers can trigger)
router.patch('/:id/location', updateVehicleLocation);

export default router;
