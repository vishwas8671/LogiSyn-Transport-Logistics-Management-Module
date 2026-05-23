import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import shipmentRoutes from './routes/shipmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load Env variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json());

// Socket.IO Server Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }
});

// Store io instance on app context to fetch inside controllers
app.set('io', io);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // Driver joins a specific shipment tracking room
  socket.on('joinShipmentTrack', (shipmentId) => {
    socket.join(shipmentId);
    console.log(`Socket ${socket.id} joined tracking room for Shipment: ${shipmentId}`);
  });

  // Handle GPS location updates from Driver clients
  socket.on('driverLocationUpdate', (data) => {
    const { shipmentId, lat, lng, address, speed, eta } = data;
    console.log(`Live GPS from driver for Shipment ${shipmentId}: ${lat}, ${lng}`);
    
    // Broadcast coordinates to all clients watching this shipment
    io.to(shipmentId).emit('liveLocationFeed', {
      lat,
      lng,
      address,
      speed,
      eta,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// REST Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Root test route
app.get('/', (req, res) => {
  res.json({ message: 'Transport & Logistics Management API is running...' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
