import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['Semi-Truck', 'Flatbed', 'Box Truck', 'Cargo Van', 'Reefer'],
      required: [true, 'Vehicle type is required'],
    },
    capacity: {
      type: Number, // in kg
      required: [true, 'Capacity in kg is required'],
    },
    fuelEfficiency: {
      type: Number, // km per liter
      required: [true, 'Fuel efficiency (km/L) is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    status: {
      type: String,
      enum: ['Available', 'In Transit', 'Maintenance', 'Out of Service'],
      default: 'Available',
    },
    currentLocation: {
      lat: { type: Number, default: 28.6139 }, // Default to New Delhi or similar
      lng: { type: Number, default: 77.2090 },
      address: { type: String, default: 'Manufacturing Plant Main Gate' },
    },
    insuranceExpiry: {
      type: Date,
      required: [true, 'Insurance expiry date is required'],
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    currentMileage: {
      type: Number,
      default: 0,
    },
    nextServiceMileage: {
      type: Number,
      default: 10000,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
