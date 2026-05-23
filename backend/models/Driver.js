import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Available', 'On Trip', 'Suspended', 'On Leave'],
      default: 'Available',
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 5,
      default: 5.0,
    },
    totalTrips: {
      type: Number,
      default: 0,
    },
    delayedTrips: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
