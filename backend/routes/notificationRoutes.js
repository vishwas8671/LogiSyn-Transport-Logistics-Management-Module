import express from 'express';
import {
  getNotifications,
  markNotificationsRead,
  getActivityLogs,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/read', markNotificationsRead);

// Audit logs (Admin/Manager only)
router.get('/logs', authorize('admin', 'manager'), getActivityLogs);

export default router;
