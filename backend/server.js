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

// Load Environment Variables
dotenv.config();

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Frontend URL
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

// Make io accessible inside controllers
app.set('io', io);

// Socket Connection
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Join Shipment Room
  socket.on('joinShipmentTrack', (shipmentId) => {
    socket.join(shipmentId);

    console.log(
      `Socket ${socket.id} joined Shipment Room: ${shipmentId}`
    );
  });

  // Driver Live GPS Update
  socket.on('driverLocationUpdate', (data) => {
    try {
      const { shipmentId, lat, lng, address, speed, eta } = data;

      console.log(
        `Shipment ${shipmentId} Location Updated -> ${lat}, ${lng}`
      );

      // Broadcast to shipment room
      io.to(shipmentId).emit('liveLocationFeed', {
        lat,
        lng,
        address,
        speed,
        eta,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Socket Location Update Error:', error.message);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Transport & Logistics Management API is running...',
  });
});

// 404 Middleware
app.use(notFound);

// Error Middleware
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
server.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );
});