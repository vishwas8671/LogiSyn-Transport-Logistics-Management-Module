import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import Shipment from '../models/Shipment.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transport_logistics');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Driver.deleteMany();
    await Vehicle.deleteMany();
    await Shipment.deleteMany();
    await Notification.deleteMany();
    await ActivityLog.deleteMany();
    console.log('Database cleared of existing records.');

    // 1. Create Admins and Managers
    const adminUser = await User.create({
      name: 'Executive Admin',
      email: 'admin@logistics.com',
      password: 'admin123',
      role: 'admin',
    });

    const managerUser = await User.create({
      name: 'Fleet Manager',
      email: 'manager@logistics.com',
      password: 'manager123',
      role: 'manager',
    });

    console.log('Created Admin & Manager accounts.');

    // 2. Create Driver Users & Profiles
    const driverUsersData = [
      { name: 'Rajesh Kumar', email: 'rajesh@logistics.com', password: 'driver123', licenseNumber: 'DL-1234567890', phone: '+91 98765 43210', score: 4.8, total: 45, delayed: 2 },
      { name: 'Amit Singh', email: 'amit@logistics.com', password: 'driver123', licenseNumber: 'DL-0987654321', phone: '+91 87654 32109', score: 4.2, total: 30, delayed: 4 },
      { name: 'Sanjay Sharma', email: 'sanjay@logistics.com', password: 'driver123', licenseNumber: 'DL-5678901234', phone: '+91 76543 21098', score: 3.5, total: 18, delayed: 6 },
      { name: 'Vikram Singh', email: 'vikram@logistics.com', password: 'driver123', licenseNumber: 'DL-4321098765', phone: '+91 65432 10987', score: 4.9, total: 60, delayed: 1 },
    ];

    const seededDrivers = [];
    for (const d of driverUsersData) {
      const u = await User.create({
        name: d.name,
        email: d.email,
        password: d.password,
        role: 'driver',
      });

      const driverProfile = await Driver.create({
        user: u._id,
        licenseNumber: d.licenseNumber,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3), // 3 years expiry
        phone: d.phone,
        status: 'Available',
        performanceScore: d.score,
        totalTrips: d.total,
        delayedTrips: d.delayed,
      });
      seededDrivers.push(driverProfile);
    }
    console.log(`Created ${seededDrivers.length} Driver profiles.`);

    // 3. Create Vehicles
    const vehiclesData = [
      { vehicleNumber: 'MH-12-PQ-9876', type: 'Semi-Truck', capacity: 25000, fuelEfficiency: 4.2, status: 'Available', insuranceDays: 240, mileage: 82000, lat: 18.5204, lng: 73.8567, address: 'Pune Manufacturing Hub' },
      { vehicleNumber: 'DL-01-AB-1234', type: 'Box Truck', capacity: 12000, fuelEfficiency: 6.8, status: 'Available', insuranceDays: 15, mileage: 45000, lat: 28.6139, lng: 77.2090, address: 'Delhi Logistics Depot' },
      { vehicleNumber: 'KA-03-XY-5678', type: 'Cargo Van', capacity: 3500, fuelEfficiency: 11.2, status: 'Available', insuranceDays: 320, mileage: 22000, lat: 12.9716, lng: 77.5946, address: 'Bengaluru Operations Hub' },
      { vehicleNumber: 'MH-43-ZZ-4321', type: 'Flatbed', capacity: 18000, fuelEfficiency: 5.0, status: 'Available', insuranceDays: 90, mileage: 65000, lat: 19.0760, lng: 72.8777, address: 'Mumbai Port Hub' },
      { vehicleNumber: 'GJ-01-CD-8765', type: 'Reefer', capacity: 15000, fuelEfficiency: 5.5, status: 'Maintenance', insuranceDays: 5, mileage: 104000, lat: 23.0225, lng: 72.5714, address: 'Ahmedabad Service Garage' },
    ];

    const seededVehicles = [];
    for (const v of vehiclesData) {
      const vehicle = await Vehicle.create({
        vehicleNumber: v.vehicleNumber,
        type: v.type,
        capacity: v.capacity,
        fuelEfficiency: v.fuelEfficiency,
        status: v.status,
        insuranceExpiry: new Date(Date.now() + v.insuranceDays * 24 * 60 * 60 * 1000),
        currentMileage: v.mileage,
        nextServiceMileage: v.mileage < 100000 ? Math.ceil(v.mileage / 10000) * 10000 + 5000 : v.mileage + 2000,
        currentLocation: { lat: v.lat, lng: v.lng, address: v.address },
      });
      seededVehicles.push(vehicle);
    }
    console.log(`Created ${seededVehicles.length} Vehicles.`);

    // 4. Create Historical Shipments
    // Pune to Mumbai (Delivered)
    const shipment1 = await Shipment.create({
      shipmentId: 'SHIP-908123',
      origin: { address: 'Pune Manufacturing Hub', lat: 18.5204, lng: 73.8567 },
      destination: { address: 'Mumbai Port Hub', lat: 19.0760, lng: 72.8777 },
      distance: 150,
      weight: 12000,
      priority: 'High',
      status: 'Delivered',
      driver: seededDrivers[0]._id,
      vehicle: seededVehicles[0]._id,
      estimatedFuelCost: 48.20,
      predictedDelayRisk: 'Low',
      delayProbability: 8.5,
      qrCodeData: 'QR-SHIP-908123-VERIFY',
      eta: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      actualDeliveryTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000), // Delivered in 3.5 hrs
      createdBy: managerUser._id,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });

    // Delhi to Ahmedabad (Delayed)
    const shipment2 = await Shipment.create({
      shipmentId: 'SHIP-872651',
      origin: { address: 'Delhi Logistics Depot', lat: 28.6139, lng: 77.2090 },
      destination: { address: 'Ahmedabad Hub', lat: 23.0225, lng: 72.5714 },
      distance: 950,
      weight: 15000,
      priority: 'Critical',
      status: 'Delivered',
      driver: seededDrivers[2]._id,
      vehicle: seededVehicles[4]._id,
      estimatedFuelCost: 233.18,
      predictedDelayRisk: 'High',
      delayProbability: 72.0,
      qrCodeData: 'QR-SHIP-872651-VERIFY',
      eta: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      actualDeliveryTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // Delivered 8 hours late
      createdBy: managerUser._id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    });

    // Bengaluru to Pune (Delivered)
    const shipment3 = await Shipment.create({
      shipmentId: 'SHIP-562910',
      origin: { address: 'Bengaluru Operations Hub', lat: 12.9716, lng: 77.5946 },
      destination: { address: 'Pune Manufacturing Hub', lat: 18.5204, lng: 73.8567 },
      distance: 840,
      weight: 3200,
      priority: 'Medium',
      status: 'Delivered',
      driver: seededDrivers[3]._id,
      vehicle: seededVehicles[2]._id,
      estimatedFuelCost: 101.25,
      predictedDelayRisk: 'Moderate',
      delayProbability: 24.5,
      qrCodeData: 'QR-SHIP-562910-VERIFY',
      eta: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      actualDeliveryTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000), // 1 hr early
      createdBy: managerUser._id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    // 5. Create Active/Scheduled Shipments
    // Mumbai to Delhi (In Transit - Live map simulation)
    const activeShipment = await Shipment.create({
      shipmentId: 'SHIP-100293',
      origin: { address: 'Mumbai Port Hub', lat: 19.0760, lng: 72.8777 },
      destination: { address: 'Delhi Logistics Depot', lat: 28.6139, lng: 77.2090 },
      distance: 1400,
      weight: 18000,
      priority: 'High',
      status: 'In Transit',
      driver: seededDrivers[1]._id,
      vehicle: seededVehicles[3]._id,
      estimatedFuelCost: 378.00,
      predictedDelayRisk: 'Moderate',
      delayProbability: 38.4,
      qrCodeData: 'QR-SHIP-100293-VERIFY',
      eta: new Date(Date.now() + 18 * 60 * 60 * 1000), // ETA in 18 hours
      createdBy: managerUser._id,
      createdAt: new Date(),
    });

    // Set Driver 2 status to 'On Trip', Vehicle 4 status to 'In Transit'
    await Driver.findByIdAndUpdate(seededDrivers[1]._id, { status: 'On Trip' });
    await Vehicle.findByIdAndUpdate(seededVehicles[3]._id, { status: 'In Transit', driver: seededDrivers[1]._id });

    console.log('Created historical and active shipments.');

    // 6. Create notifications
    await Notification.create([
      { title: 'Vehicle Insurance Nearing Expiry', message: 'Vehicle GJ-01-CD-8765 insurance is expiring in 5 days.', type: 'maintenance', recipientRole: 'manager' },
      { title: 'New Shipment Dispatched', message: 'Shipment SHIP-100293 has been dispatched from Mumbai to Delhi.', type: 'dispatch', recipientRole: 'all' },
      { title: 'Delivery Completed', message: 'Rajesh Kumar completed delivery SHIP-908123 Pune to Mumbai.', type: 'completion', recipientRole: 'all' },
      { title: 'Delay Warning Issued', message: 'Amit Singh reports heavy monsoon traffic on NH8 for shipment SHIP-100293.', type: 'delay', recipientRole: 'manager' },
    ]);

    console.log('Created default system notifications.');
    
    console.log('Data successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seedData();
