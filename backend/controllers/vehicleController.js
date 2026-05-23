import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
export const getVehicles = async (req, res, next) => {
  try {
    const { status, type, available } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (available === 'true') {
      query.status = 'Available';
    }

    const vehicles = await Vehicle.find(query).populate({
      path: 'driver',
      populate: { path: 'user', select: 'name email' }
    });

    res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
export const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate({
      path: 'driver',
      populate: { path: 'user', select: 'name email' }
    });

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private (Admin/Manager)
export const createVehicle = async (req, res, next) => {
  const { vehicleNumber, type, capacity, fuelEfficiency, insuranceExpiry, driver } = req.body;

  try {
    const vehicleExists = await Vehicle.findOne({ vehicleNumber });

    if (vehicleExists) {
      res.status(400);
      throw new Error('Vehicle number already exists');
    }

    // Verify driver exists if assigned
    if (driver) {
      const driverExists = await Driver.findById(driver);
      if (!driverExists) {
        res.status(400);
        throw new Error('Assigned driver does not exist');
      }
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      type,
      capacity,
      fuelEfficiency,
      insuranceExpiry: new Date(insuranceExpiry),
      driver: driver || null,
      status: 'Available',
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Admin/Manager)
export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    // Verify driver exists if assigned
    if (req.body.driver && req.body.driver !== String(vehicle.driver)) {
      const driverExists = await Driver.findById(req.body.driver);
      if (!driverExists) {
        res.status(400);
        throw new Error('Assigned driver does not exist');
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'driver',
      populate: { path: 'user', select: 'name email' }
    });

    res.json({ success: true, data: updatedVehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Admin)
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    // Check if vehicle is currently in transit
    if (vehicle.status === 'In Transit') {
      res.status(400);
      throw new Error('Cannot delete a vehicle while it is in transit');
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle location / mileage
// @route   PATCH /api/vehicles/:id/location
// @access  Private (Driver/Manager)
export const updateVehicleLocation = async (req, res, next) => {
  const { lat, lng, address, currentMileage } = req.body;

  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }

    if (lat !== undefined) vehicle.currentLocation.lat = lat;
    if (lng !== undefined) vehicle.currentLocation.lng = lng;
    if (address !== undefined) vehicle.currentLocation.address = address;
    if (currentMileage !== undefined) {
      vehicle.currentMileage = currentMileage;
      // Auto-trigger maintenance alert if past service limit
      if (vehicle.currentMileage >= vehicle.nextServiceMileage) {
        vehicle.status = 'Maintenance';
      }
    }

    await vehicle.save();

    // Broadcast location update if Socket.IO is attached (we will handle this in server.js)
    if (req.app.get('io')) {
      req.app.get('io').emit('vehicleLocationUpdate', {
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.vehicleNumber,
        location: vehicle.currentLocation,
        status: vehicle.status,
        currentMileage: vehicle.currentMileage,
      });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};
