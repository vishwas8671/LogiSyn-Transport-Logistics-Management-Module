import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  Navigation,
  Compass,
  MapPin,
  Clock,
  Gauge,
  Info,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

// DivIcon overrides for premium aesthetics & resolving default leaflet icon resolution bugs
const truckIcon = L.divIcon({
  html: `<div class="w-9 h-9 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-xl animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.05a1.009 1.009 0 0 0-.29-.707l-2.007-2.006A1 1 0 0 0 19 9h-5"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const originIcon = L.divIcon({
  html: `<div class="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white font-extrabold text-[10px] shadow-lg">ORG</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const destIcon = L.divIcon({
  html: `<div class="w-7 h-7 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white font-extrabold text-[10px] shadow-lg">DST</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Map View auto-adjuster
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords]);
  return null;
};

const Tracking = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [activeShipments, setActiveShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  
  // Real-time tracking coordinates
  const [truckCoords, setTruckCoords] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [currentAddress, setCurrentAddress] = useState('Verifying route status...');
  const [etaText, setEtaText] = useState('Calculating...');
  const [distanceRemaining, setDistanceRemaining] = useState(0);

  const simulationRef = useRef(null);

  // Load In Transit shipments
  useEffect(() => {
    const fetchActiveShipments = async () => {
      try {
        const res = await api.get('/shipments?status=In Transit');
        const list = res.data.data || [];
        setActiveShipments(list);
        if (list.length > 0) {
          setSelectedShipment(list[0]);
        }
      } catch (err) {
        console.error('Failed to load active shipments:', err);
      }
    };
    fetchActiveShipments();
  }, []);

  // Listen to Socket events when active shipment selection changes
  useEffect(() => {
    if (!selectedShipment || !socket) return;

    // Join room for this specific shipment
    socket.emit('joinShipmentTrack', selectedShipment._id);

    // Set initial coordinates
    setTruckCoords([selectedShipment.origin.lat, selectedShipment.origin.lng]);
    setCurrentAddress(selectedShipment.origin.address);
    setDistanceRemaining(selectedShipment.distance);
    setSpeed(0);

    // Setup listener for coordinates broadcasts
    socket.on('liveLocationFeed', (data) => {
      setTruckCoords([data.lat, data.lng]);
      if (data.address) setCurrentAddress(data.address);
      if (data.speed !== undefined) setSpeed(data.speed);
      if (data.eta) {
        const time = new Date(data.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setEtaText(time);
      }
    });

    // Cleanup on unmount or switch
    return () => {
      socket.off('liveLocationFeed');
    };
  }, [selectedShipment, socket]);

  // client-side simulation engine to demonstrate live tracking movement
  const startSimulation = () => {
    if (!selectedShipment) return;
    if (simulationRef.current) clearInterval(simulationRef.current);

    const startLat = selectedShipment.origin.lat;
    const startLng = selectedShipment.origin.lng;
    const endLat = selectedShipment.destination.lat;
    const endLng = selectedShipment.destination.lng;

    let step = 0;
    const totalSteps = 100;
    
    // Simulate speed: fluctuate between 60 - 80 km/h
    setSpeed(68);

    simulationRef.current = setInterval(() => {
      step += 1;
      if (step > totalSteps) {
        clearInterval(simulationRef.current);
        setSpeed(0);
        setCurrentAddress('Destination Reached');
        setDistanceRemaining(0);
        return;
      }

      // Linear interpolation
      const currentLat = startLat + ((endLat - startLat) * step) / totalSteps;
      const currentLng = startLng + ((endLng - startLng) * step) / totalSteps;

      // Random speed fluctuations
      const simulatedSpeed = Math.floor(62 + Math.random() * 15);
      setSpeed(simulatedSpeed);

      const calculatedRemaining = Math.round(selectedShipment.distance * (1 - step / totalSteps));
      setDistanceRemaining(calculatedRemaining);

      const computedEta = new Date(Date.now() + (calculatedRemaining / 70) * 60 * 60 * 1000);
      setEtaText(computedEta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Update location
      const newCoords = [currentLat, currentLng];
      setTruckCoords(newCoords);
      setCurrentAddress(`National Highway Section: Mile ${step * 5}`);

      // Broadcast back to WebSocket server so other users (e.g. admins) see it live too!
      socket.emit('driverLocationUpdate', {
        shipmentId: selectedShipment._id,
        lat: currentLat,
        lng: currentLng,
        address: `National Highway Section: Mile ${step * 5}`,
        speed: simulatedSpeed,
        eta: computedEta
      });

    }, 3000); // Trigger ticks every 3 seconds
  };

  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      setSpeed(0);
    }
  };

  useEffect(() => {
    return () => stopSimulation();
  }, []);

  const hasCoords = truckCoords && truckCoords[0] !== undefined;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Side Control panel */}
      <div className="w-full md:w-80 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          
          {/* Header */}
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} size={16} />
              Telemetry Status
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Live tracking and route tracking logs.</p>
          </div>

          {/* Shipment Selector */}
          <div>
            <label className="block text-[9px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Active Shipments</label>
            {activeShipments.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-center border border-dashed border-slate-200 dark:border-slate-800">
                No shipments currently In Transit
              </p>
            ) : (
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-indigo-500 dark:text-white font-medium"
                value={selectedShipment?._id || ''}
                onChange={(e) => {
                  const match = activeShipments.find(s => s._id === e.target.value);
                  if (match) setSelectedShipment(match);
                }}
              >
                {activeShipments.map(s => (
                  <option key={s._id} value={s._id}>{s.shipmentId} ({s.vehicle?.vehicleNumber})</option>
                ))}
              </select>
            )}
          </div>

          {/* Telemetry Stats */}
          {selectedShipment && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              
              {/* Route */}
              <div className="flex gap-2.5 items-start">
                <MapPin className="text-slate-400 mt-0.5 shrink-0" size={15} />
                <div className="text-[11px] leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedShipment.origin.address.split(' ')[0]}</span>
                    <ChevronRight size={10} className="text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedShipment.destination.address.split(' ')[0]}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[180px]">{currentAddress}</p>
                </div>
              </div>

              {/* Speedometer */}
              <div className="flex gap-2.5 items-center">
                <Gauge className="text-indigo-500 shrink-0" size={15} />
                <div>
                  <span className="text-[9px] font-semibold text-slate-400 block uppercase">Speed</span>
                  <span className="font-extrabold text-slate-700 dark:text-white">{speed} km/h</span>
                </div>
              </div>

              {/* Distance Remaining */}
              <div className="flex gap-2.5 items-center">
                <Compass className="text-emerald-500 shrink-0" size={15} />
                <div>
                  <span className="text-[9px] font-semibold text-slate-400 block uppercase">Distance Left</span>
                  <span className="font-extrabold text-slate-700 dark:text-white">{distanceRemaining} km</span>
                </div>
              </div>

              {/* ETA */}
              <div className="flex gap-2.5 items-center">
                <Clock className="text-amber-500 shrink-0" size={15} />
                <div>
                  <span className="text-[9px] font-semibold text-slate-400 block uppercase">Estimated ETA</span>
                  <span className="font-extrabold text-slate-700 dark:text-white">{etaText}</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Demo Simulations panel */}
        {selectedShipment && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1">
              <TrendingUp size={12} className="text-indigo-500" />
              Developer Simulation
            </h4>
            <div className="flex gap-2">
              <button
                onClick={startSimulation}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-md transition-colors"
              >
                Run GPS
              </button>
              <button
                onClick={stopSimulation}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition-colors"
              >
                Halt
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Map View */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden relative shadow-sm h-full min-h-[300px]">
        {selectedShipment && hasCoords ? (
          <MapContainer 
            center={[selectedShipment.origin.lat, selectedShipment.origin.lng]} 
            zoom={6} 
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Premium sleek dark map theme!
            />
            
            {/* Origin Marker */}
            <Marker position={[selectedShipment.origin.lat, selectedShipment.origin.lng]} icon={originIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">Origin Plant</p>
                  <p className="text-[10px] text-slate-500 mt-1">{selectedShipment.origin.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Destination Marker */}
            <Marker position={[selectedShipment.destination.lat, selectedShipment.destination.lng]} icon={destIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">Destination Depot</p>
                  <p className="text-[10px] text-slate-500 mt-1">{selectedShipment.destination.address}</p>
                </div>
              </Popup>
            </Marker>

            {/* Moving Vehicle Marker */}
            <Marker position={truckCoords} icon={truckIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold text-indigo-500">Vehicle: {selectedShipment.vehicle?.vehicleNumber}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Driver: {selectedShipment.driver?.user?.name}</p>
                </div>
              </Popup>
            </Marker>

            {/* Route Line */}
            <Polyline 
              positions={[
                [selectedShipment.origin.lat, selectedShipment.origin.lng],
                [selectedShipment.destination.lat, selectedShipment.destination.lng]
              ]} 
              color="#4f46e5" 
              weight={3} 
              dashArray="6, 8"
            />

            {/* Auto Map adjustment */}
            <ChangeMapView coords={truckCoords} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/10">
            <Layers className="animate-pulse" size={40} />
            <p className="text-xs font-semibold">Select an active "In Transit" shipment to view real-time maps</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Tracking;
