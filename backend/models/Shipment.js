import mongoose from 'mongoose';

const shipmentHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
  location: {
    lat: Number,
    lng: Number,
    address: String,
  },
});

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    origin: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    destination: {
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    distance: {
      type: Number, // in km
      required: true,
    },
    weight: {
      type: Number, // in kg
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'],
      default: 'Pending',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    estimatedFuelCost: {
      type: Number,
      default: 0,
    },
    predictedDelayRisk: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      default: 'Low',
    },
    delayProbability: {
      type: Number, // 0 to 100
      default: 0,
    },
    qrCodeData: {
      type: String,
      required: true,
    },
    eta: {
      type: Date,
      required: true,
    },
    actualDeliveryTime: {
      type: Date,
      default: null,
    },
    history: [shipmentHistorySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save to auto-generate a shipmentId if not provided (e.g. SHIP-XXXX)
shipmentSchema.pre('validate', function (next) {
  if (!this.shipmentId) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.shipmentId = `SHIP-${randomNum}`;
  }
  if (!this.qrCodeData) {
    this.qrCodeData = `QR-DELIVERY-${this.shipmentId}-${Date.now()}`;
  }
  next();
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
