import express from 'express';
import { body } from 'express-validator';
import {
  getShipments,
  getShipmentById,
  createShipment,
  updateShipmentStatus,
  verifyDeliveryQR,
} from '../controllers/shipmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';

const router = express.Router();

const shipmentValidation = [
  body('origin.address').notEmpty().withMessage('Origin address is required'),
  body('origin.lat').isNumeric().withMessage('Origin latitude must be numeric'),
  body('origin.lng').isNumeric().withMessage('Origin longitude must be numeric'),
  body('destination.address').notEmpty().withMessage('Destination address is required'),
  body('destination.lat').isNumeric().withMessage('Destination latitude must be numeric'),
  body('destination.lng').isNumeric().withMessage('Destination longitude must be numeric'),
  body('distance').isNumeric().withMessage('Distance must be a number'),
  body('weight').isNumeric().withMessage('Cargo weight must be a number'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority level'),
  body('vehicleId').isMongoId().withMessage('Invalid Vehicle ID'),
  body('driverId').isMongoId().withMessage('Invalid Driver ID'),
  body('eta').isISO8601().toDate().withMessage('Provide a valid ETA date'),
];

router.use(protect);

router.get('/', getShipments);
router.get('/:id', getShipmentById);

// Create shipment (Admin & Manager)
router.post('/', authorize('admin', 'manager'), shipmentValidation, validateRequest, createShipment);

// Update status (Driver and Manager can update statuses)
router.put('/:id/status', updateShipmentStatus);

// Confirm QR signature delivery (Driver)
router.post('/:id/verify-qr', verifyDeliveryQR);

export default router;
