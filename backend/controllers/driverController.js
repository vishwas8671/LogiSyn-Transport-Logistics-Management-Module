import Driver from '../models/Driver.js';
import User from '../models/User.js';

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
export const getDrivers = async (req, res, next) => {
  try {
    const { status, available } = req.query;
    let query = {};

    if (status) query.status = status;
    if (available === 'true') {
      query.status = 'Available';
    }

    const drivers = await Driver.find(query).populate('user', 'name email role');

    res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver profile
// @route   GET /api/drivers/:id
// @access  Private
export const getDriverById = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('user', 'name email role');

    if (!driver) {
      res.status(404);
      throw new Error('Driver profile not found');
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver profile
// @route   PUT /api/drivers/:id
// @access  Private (Admin/Manager)
export const updateDriver = async (req, res, next) => {
  const { name, email, licenseNumber, licenseExpiry, phone, status, performanceScore } = req.body;

  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }

    // Update User schema fields if provided
    if (name || email) {
      const user = await User.findById(driver.user);
      if (user) {
        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();
      }
    }

    // Update Driver fields
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (licenseExpiry) driver.licenseExpiry = new Date(licenseExpiry);
    if (phone) driver.phone = phone;
    if (status) driver.status = status;
    if (performanceScore !== undefined) driver.performanceScore = performanceScore;

    await driver.save();
    const updatedDriver = await Driver.findById(driver._id).populate('user', 'name email');

    res.json({ success: true, data: updatedDriver });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver profile
// @route   DELETE /api/drivers/:id
// @access  Private (Admin)
export const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }

    if (driver.status === 'On Trip') {
      res.status(400);
      throw new Error('Cannot delete driver while they are currently on a delivery trip');
    }

    // Delete both User and Driver accounts
    await User.findByIdAndDelete(driver.user);
    await Driver.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Driver and associated account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver trip status
// @route   PATCH /api/drivers/:id/status
// @access  Private (Driver/Manager)
export const updateDriverStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      res.status(404);
      throw new Error('Driver profile not found');
    }

    driver.status = status;
    await driver.save();

    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};
