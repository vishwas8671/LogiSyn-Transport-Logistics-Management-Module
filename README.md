# LogiSync - Transport & Logistics Management Module

LogiSync is a production-grade, full-stack **Transport & Logistics Management SaaS Platform** designed for manufacturing enterprises (e.g. automotive, heavy metals, consumer goods) to streamline fleet operations, driver schedules, shipment allocation, live tracking, and transport analytics.

Built using the **MERN Stack** (MongoDB, Express, React, Node.js), LogiSync features role-based access control (RBAC), simulated real-time GPS telemetry via WebSockets (Socket.IO), Leaflet.js maps, automated fuel cost estimation, and an AI-driven delay risk prediction engine.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC)**: Distinct dashboards and permissions for **Admins**, **Transport Managers**, and **Drivers**.
*   **Executive Operations Dashboard**: Interactive analytics showing fleet status distributions, priority margins, monthly logistics metrics, and driver scorecards using `Recharts`.
*   **Active Fleet & Crew Management**: Complete CRUD logs for vehicles (with capacities, mileage thresholds, and maintenance states) and drivers (with license specs and performance ratings).
*   **Geographic Route Dispatching**: shipment booking with coordinate-based distance calculation, automated diesel fuel costing, and live AI delay probability forecasts.
*   **Live Route Tracking Map**: Interactive map monitoring truck movements along optimized paths, receiving live coordinates via Socket.IO, and offering a developers' GPS animation engine.
*   **Secure Driver Portal**: Responsive layout showing assigned trips, status updates (start trip, report delays), and a simulated **QR Code Proof of Delivery Scanner** to complete orders.
*   **Auditable Audit Logs & Notifications Center**: Centralized actions logger auditing dispatches and instant alerts warning about delays or vehicle maintenance.

---

## 🛠️ Tech Stack & Design System

*   **Frontend**: React.js, Vite, Tailwind CSS v4 (with PostCSS), React Router v6, Axios, Recharts, Leaflet.js, React-Leaflet, Socket.IO-Client.
*   **Backend**: Node.js, Express.js, Socket.IO, JWT, Bcrypt.js, Mongoose, Express-Validator.
*   **Database**: MongoDB (Mongoose schemas).
*   **Design Aesthetics**: Premium Corporate Dark Theme, Glassmorphism panels, customized scrollbars, and micro-interactions.

---

## 📂 Project Structure

```text
Transport AI/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── authController.js     # Signup, Signin, Profile endpoints
│   │   ├── dashboardController.js# Recharts aggregate stats builders
│   │   ├── driverController.js   # Crew profile records CRUD
│   │   ├── notificationController.js # Alerts and ActivityLog logs
│   │   ├── shipmentController.js # Shipments lifecycle & QR verification
│   │   └── vehicleController.js  # Fleet status & maintenance toggles
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT & RBAC guards
│   │   ├── errorMiddleware.js    # Global exception formatter
│   │   └── validationMiddleware.js # Input validation check interceptor
│   ├── models/
│   │   ├── ActivityLog.js        # Audit trail schema
│   │   ├── Driver.js             # Driver license & trips statistics
│   │   ├── Notification.js       # System notifications schema
│   │   ├── Shipment.js           # Shipments, routes, and logs schema
│   │   ├── User.js               # Base accounts and credentials schema
│   │   └── Vehicle.js            # Fleet specifications & GPS coordinates
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── dashboardRoutes.js    # /api/dashboard/*
│   │   ├── driverRoutes.js       # /api/drivers/*
│   │   ├── notificationRoutes.js # /api/notifications/*
│   │   ├── shipmentRoutes.js     # /api/shipments/*
│   │   └── vehicleRoutes.js      # /api/vehicles/*
│   ├── utils/
│   │   ├── generateToken.js      # JWT signature utility
│   │   ├── logisticsEngine.js    # AI Delay forecast & fuel biller
│   │   └── seeder.js             # High-fidelity DB seeding script
│   ├── .env                      # Connection strings & secrets
│   ├── package.json
│   └── server.js                 # HTTP, REST API, & Socket.IO server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar, Header, Alerts Dropdown
│   │   │   └── LoadingSkeleton.jsx # Visual skeletons placeholders
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Session credentials cache
│   │   │   └── SocketContext.jsx # WebSockets event dispatcher
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Charts & Leaderboard overview
│   │   │   ├── DriverPortal.jsx  # Driver schedule & QR code scanning
│   │   │   ├── Drivers.jsx       # Crew configurations grid
│   │   │   ├── Login.jsx         # Signin page
│   │   │   ├── Register.jsx      # Signup with dynamic driver subform
│   │   │   ├── Shipments.jsx     # Dispatch booking & CSV export
│   │   │   ├── Tracking.jsx      # Leaflet tracking map & simulation
│   │   │   └── Vehicles.jsx      # Fleet table & specifications modals
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptors
│   │   ├── App.jsx               # Security router mapping
│   │   ├── index.css             # Tailwind v4 globals & maps styling
│   │   └── main.jsx              # React mounting root
│   ├── index.html                # Links Leaflet CDN
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## ⚡ Setup & Launch Instructions

### Prerequisites
*   Node.js (v16.0.0 or higher)
*   MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI.

---

### Step 1: Backend Setup
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure variables in the `.env` file (defaults are already preset):
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/transport_logistics
    JWT_SECRET=super_secret_corporate_logistics_jwt_token_2026
    JWT_EXPIRES_IN=7d
    NODE_ENV=development
    ```
4.  **Seed the Database** (Must be run to log in and see realistic charts immediately):
    ```bash
    npm run seed
    ```
5.  Launch the backend server:
    ```bash
    npm run start
    ```
    *The server runs on `http://localhost:5000`.*

---

### Step 2: Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The app is hosted on `http://localhost:5173`.*

---

## 🔑 Default Credentials for Testing

Use the seeded profiles to log in and explore different roles:

| Role | Email | Password | Seeded Data & Access |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@logistics.com` | `admin123` | Can read/write/delete vehicles, drivers, dispatches, and view logs. |
| **Transport Manager** | `manager@logistics.com` | `manager123` | Can schedule dispatches, modify fleet/crew, monitor routes. |
| **Commercial Driver** | `amit@logistics.com` | `driver123` | Can view assigned shipments, start trips, simulate GPS, scan QR to deliver. |
| **Commercial Driver** | `rajesh@logistics.com` | `driver123` | Access to Rajesh's Driver Portal. |

---

## 🧪 Verification Walkthrough

1.  **Dashboard Inspection**: Log in as `manager@logistics.com` to see metrics, monthly area charts, status distributions, and the driver leaderboard populated by historical records.
2.  **Dispatch Booking**:
    *   Navigate to **Shipments** page. Click **Book Dispatch**.
    *   Select Origin (e.g. Pune) and Destination (e.g. Delhi). Note the distance auto-calculation.
    *   Input cargo weight. Assign an available vehicle and driver.
    *   Observe the **AI Predictor panel** in real-time updating fuel costs and delay risk percentage based on parameters. Click **Confirm**.
3.  **Live Map Movement**:
    *   Open **Live Tracking** page. Select the active "In Transit" shipment.
    *   Click **Run GPS**. Watch the truck marker smoothly slide along the path connecting the hubs, updating speed/ETA live.
4.  **Driver Delivery Completion**:
    *   Log out and sign back in as driver `amit@logistics.com` (password `driver123`).
    *   Observe the active card on the portal. Click **Start Transit Run** to lock driver and vehicle.
    *   Click **Complete Delivery (QR Scan)** to open the simulated scanner camera window showing the package's security code.
    *   Click **Verify QR Signature**. Observe the instant transition to "Delivered", freeing up the driver and vehicle to default "Available" statuses.
