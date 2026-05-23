import User from '../models/User.js';
import Driver from '../models/Driver.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { name, email, password, role, licenseNumber, licenseExpiry, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Validation for driver profile
    if (role === 'driver') {
      if (!licenseNumber || !licenseExpiry || !phone) {
        res.status(400);
        throw new Error('Drivers must provide license number, expiry, and phone contact');
      }

      const driverExists = await Driver.findOne({ licenseNumber });
      if (driverExists) {
        res.status(400);
        throw new Error('Driver license number is already registered');
      }
    }

    // Create base user (pre-save hook will hash password)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'manager',
    });

    let driverProfile = null;

    // Create driver sub-profile if role is driver
    if (user.role === 'driver') {
      try {
        driverProfile = await Driver.create({
          user: user._id,
          licenseNumber,
          licenseExpiry: new Date(licenseExpiry),
          phone,
          status: 'Available',
        });
      } catch (driverError) {
        // Rollback user creation on driver schema failure
        await User.findByIdAndDelete(user._id);
        throw driverError;
      }
    }

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      driverProfile: driverProfile ? {
        id: driverProfile._id,
        licenseNumber: driverProfile.licenseNumber,
        phone: driverProfile.phone,
        status: driverProfile.status,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      let driverProfile = null;

      if (user.role === 'driver') {
        driverProfile = await Driver.findOne({ user: user._id });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        driverProfile: driverProfile ? {
          id: driverProfile._id,
          licenseNumber: driverProfile.licenseNumber,
          phone: driverProfile.phone,
          status: driverProfile.status,
          performanceScore: driverProfile.performanceScore,
        } : null,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      let driverProfile = null;
      if (user.role === 'driver') {
        driverProfile = await Driver.findOne({ user: user._id });
      }

      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        driverProfile: driverProfile ? {
          id: driverProfile._id,
          licenseNumber: driverProfile.licenseNumber,
          phone: driverProfile.phone,
          status: driverProfile.status,
          performanceScore: driverProfile.performanceScore,
        } : null,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};
