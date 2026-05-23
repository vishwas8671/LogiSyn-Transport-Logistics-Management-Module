import Shipment from '../models/Shipment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { calculateFuelCost, predictDelayRisk } from '../utils/logisticsEngine.js';

// Helper to create notifications and activity logs
const createLogAndAlert = async (req, shipment, title, message, type) => {
  try {
    // Save system notification
    await Notification.create({
      title,
      message,
      type,
      recipientRole: 'all',
    });

    // Save user activity log
    await ActivityLog.create({
      user: req.user._id,
      action: title,
      details: message,
    });

    // Emit live WebSocket notification if socket server is attached
    if (req.app.get('io')) {
      req.app.get('io').emit('newNotification', {
        title,
        message,
        type,
        timestamp: new Date(),
        shipmentId: shipment.shipmentId,
      });
    }
  } catch (error) {
    console.error('Logging helper error:', error);
  }
};

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
export const getShipments = async (req, res, next) => {
  try {
    const { status, priority, driverId } = req.query;
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (driverId) query.driver = driverId;

    // Drivers can only see their own assigned shipments
    if (req.user.role === 'driver') {
      const driverProfile = await Driver.findOne({ user: req.user._id });
      if (driverProfile) {
        query.driver = driverProfile._id;
      } else {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }
    }

    const shipments = await Shipment.find(query)
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('vehicle')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single shipment details
// @route   GET /api/shipments/:id
// @access  Private
export const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('vehicle');

    if (!shipment) {
      res.status(404);
      throw new Error('Shipment not found');
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a shipment order
// @route   POST /api/shipments
// @access  Private (Admin/Manager)
export const createShipment = async (req, res, next) => {
  const { origin, destination, distance, weight, priority, vehicleId, driverId, eta } = req.body;

  try {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      res.status(400);
      throw new Error('Assigned vehicle not found');
    }
    if (vehicle.status !== 'Available') {
      res.status(400);
      throw new Error(`Vehicle ${vehicle.vehicleNumber} is currently unavailable (${vehicle.status})`);
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(400);
      throw new Error('Assigned driver not found');
    }
    if (driver.status !== 'Available') {
      res.status(400);
      throw new Error(`Driver is currently unavailable (${driver.status})`);
    }

    // 1. Calculate Fuel Cost
    const estimatedFuelCost = calculateFuelCost(distance, vehicle.fuelEfficiency, weight);

    // 2. Perform AI Delay Risk Analysis
    const delayAnalysis = predictDelayRisk(distance, priority, driver.performanceScore, vehicle.currentMileage);

    // 3. Create Shipment Document
    const shipment = await Shipment.create({
      origin,
      destination,
      distance,
      weight,
      priority,
      vehicle: vehicleId,
      driver: driverId,
      estimatedFuelCost,
      predictedDelayRisk: delayAnalysis.riskLevel,
      delayProbability: delayAnalysis.probability,
      eta: new Date(eta),
      createdBy: req.user._id,
      status: 'Scheduled',
      history: [
        {
          status: 'Scheduled',
          note: `Shipment order created by ${req.user.name}. Vehicle ${vehicle.vehicleNumber} assigned.`,
          location: vehicle.currentLocation,
        },
      ],
    });

    // 4. Update Driver & Vehicle status
    vehicle.status = 'In Transit';
    vehicle.driver = driverId;
    await vehicle.save();

    driver.status = 'On Trip';
    await driver.save();

    // 5. Audit logs and notify
    await createLogAndAlert(
      req,
      shipment,
      `Shipment Scheduled: ${shipment.shipmentId}`,
      `Route: ${origin.address} to ${destination.address}. Assigned driver: ${driverId}.`,
      'dispatch'
    );

    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shipment status
// @route   PUT /api/shipments/:id/status
// @access  Private (Driver/Manager)
export const updateShipmentStatus = async (req, res, next) => {
  const { status, note, lat, lng, address } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');

    if (!shipment) {
      res.status(404);
      throw new Error('Shipment not found');
    }

    const prevStatus = shipment.status;
    shipment.status = status;

    // Setup coordinates for history entry
    const histLoc = {
      lat: lat || shipment.vehicle?.currentLocation.lat || shipment.origin.lat,
      lng: lng || shipment.vehicle?.currentLocation.lng || shipment.origin.lng,
      address: address || shipment.vehicle?.currentLocation.address || shipment.origin.address,
    };

    // Add status history record
    shipment.history.push({
      status,
      note: note || `Status updated from ${prevStatus} to ${status}`,
      location: histLoc,
    });

    // Coordinate state locks on Driver & Vehicle
    const vehicle = await Vehicle.findById(shipment.vehicle);
    const driver = await Driver.findById(shipment.driver);

    if (status === 'Delivered') {
      shipment.actualDeliveryTime = new Date();
      
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.currentLocation = { lat: shipment.destination.lat, lng: shipment.destination.lng, address: shipment.destination.address };
        await vehicle.save();
      }
      if (driver) {
        driver.status = 'Available';
        driver.totalTrips += 1;

        // Check if shipment ETA is missed (Late Delivery)
        const isLate = new Date() > new Date(shipment.eta);
        if (isLate) {
          driver.delayedTrips += 1;
        }

        // Re-calculate Performance Score (0-5 scaling)
        const successRate = (driver.totalTrips - driver.delayedTrips) / driver.totalTrips;
        driver.performanceScore = parseFloat((successRate * 5).toFixed(2));
        await driver.save();
      }

      await createLogAndAlert(
        req,
        shipment,
        `Shipment Completed: ${shipment.shipmentId}`,
        `Cargo successfully delivered to ${shipment.destination.address}.`,
        'completion'
      );
    } 
    else if (status === 'Cancelled') {
      if (vehicle) {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      if (driver) {
        driver.status = 'Available';
        await driver.save();
      }
      await createLogAndAlert(
        req,
        shipment,
        `Shipment Cancelled: ${shipment.shipmentId}`,
        `Shipment route was aborted. Fleet availability restored.`,
        'system'
      );
    } 
    else if (status === 'Delayed') {
      await createLogAndAlert(
        req,
        shipment,
        `Shipment Delay Warning: ${shipment.shipmentId}`,
        `Shipment transit is experiencing delays. Note: ${note}`,
        'delay'
      );
    } 
    else if (status === 'In Transit') {
      if (vehicle) {
        vehicle.status = 'In Transit';
        await vehicle.save();
      }
      if (driver) {
        driver.status = 'On Trip';
        await driver.save();
      }
      await createLogAndAlert(
        req,
        shipment,
        `Shipment In-Transit: ${shipment.shipmentId}`,
        `Vehicle is moving towards ${shipment.destination.address}.`,
        'dispatch'
      );
    }

    await shipment.save();

    // Broadcast status to listeners
    if (req.app.get('io')) {
      req.app.get('io').emit('shipmentStatusUpdate', {
        id: shipment._id,
        shipmentId: shipment.shipmentId,
        status: shipment.status,
        history: shipment.history,
      });
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// @desc    Driver completes shipment via QR Code verification
// @route   POST /api/shipments/:id/verify-qr
// @access  Private (Driver)
export const verifyDeliveryQR = async (req, res, next) => {
  const { qrCodeData } = req.body;

  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) {
      res.status(404);
      throw new Error('Shipment not found');
    }

    if (shipment.qrCodeData !== qrCodeData) {
      res.status(400);
      throw new Error('Invalid QR code security token');
    }

    if (shipment.status === 'Delivered') {
      res.status(400);
      throw new Error('Shipment has already been marked as Delivered');
    }

    // Trigger standard Delivered sequence
    req.body.status = 'Delivered';
    req.body.note = 'Delivery confirmed and signed off via QR code proof verification.';
    return updateShipmentStatus(req, res, next);
  } catch (error) {
    next(error);
  }
};
