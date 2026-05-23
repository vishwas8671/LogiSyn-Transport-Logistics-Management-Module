import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get all notifications for a user based on role
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    
    // Fetch notifications matching role or addressed to 'all'
    const notifications = await Notification.find({
      recipientRole: { $in: [userRole, 'all'] },
    }).sort({ createdAt: -1 }).limit(30);

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notifications as read by user
// @route   POST /api/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Add user ID to readBy array for all relevant notifications
    await Notification.updateMany(
      {
        recipientRole: { $in: [req.user.role, 'all'] },
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system auditing activity logs
// @route   GET /api/notifications/logs
// @access  Private (Admin/Manager)
export const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
