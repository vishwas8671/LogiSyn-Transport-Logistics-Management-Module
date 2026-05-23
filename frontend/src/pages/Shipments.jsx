import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  MapPin,
  Calendar,
  AlertTriangle,
  Fuel,
  Info,
  X,
  TrendingUp,
  FileText
} from 'lucide-react';

// Predefined manufacturing nodes in India for simple routing
const LOGISTICS_NODES = {
  'pune': { name: 'Pune Manufacturing Hub', lat: 18.5204, lng: 73.8567 },
  'mumbai': { name: 'Mumbai Port Hub', lat: 19.0760, lng: 72.8777 },
  'delhi': { name: 'Delhi Logistics Depot', lat: 28.6139, lng: 77.2090 },
  'bengaluru': { name: 'Bengaluru Operations Hub', lat: 12.9716, lng: 77.5946 },
  'chennai': { name: 'Chennai Plant Gate', lat: 13.0827, lng: 80.2707 },
  'ahmedabad': { name: 'Ahmedabad Hub', lat: 23.0225, lng: 72.5714 }
};

// Geodesic distance calculator (Haversine formula in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d);
};

const Shipments = () => {
  const { isManager, isAdmin } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form Booking states
  const [modalOpen, setModalOpen] = useState(false);
  const [originKey, setOriginKey] = useState('pune');
  const [destKey, setDestKey] = useState('mumbai');
  const [weight, setWeight] = useState(10000);
  const [priority, setPriority] = useState('Medium');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [eta, setEta] = useState('');
  
  // Real-time calculation previews
  const [distance, setDistance] = useState(150);
  const [fuelEstimate, setFuelEstimate] = useState(0);
  const [delayRisk, setDelayRisk] = useState({ riskLevel: 'Low', probability: 5 });
  const [formError, setFormError] = useState('');

  const fetchShipmentsAndFleet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shipments');
      setShipments(res.data.data || []);

      const vehicleRes = await api.get('/vehicles?available=true');
      setVehicles(vehicleRes.data.data || []);

      const driverRes = await api.get('/drivers?available=true');
      setDrivers(driverRes.data.data || []);
    } catch (err) {
      console.error('Error fetching shipments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentsAndFleet();
  }, []);

  // Update distance when origin/destination keys change
  useEffect(() => {
    const orig = LOGISTICS_NODES[originKey];
    const dest = LOGISTICS_NODES[destKey];
    if (orig && dest) {
      const dist = calculateDistance(orig.lat, orig.lng, dest.lat, dest.lng);
      setDistance(dist);
    }
  }, [originKey, destKey]);

  // Recalculate fuel estimate & delay predictions locally in form context
  useEffect(() => {
    const selectedVehicle = vehicles.find(v => v._id === vehicleId);
    const selectedDriver = drivers.find(d => d._id === driverId);

    // Fuel Estimation
    let efficiency = 6.0;
    let mileage = 20000;
    if (selectedVehicle) {
      efficiency = selectedVehicle.fuelEfficiency;
      mileage = selectedVehicle.currentMileage;
    }
    const weightTons = weight / 1000;
    const adjustedEfficiency = Math.max(2.0, efficiency * (1 - weightTons * 0.02));
    const fuelCost = (distance / adjustedEfficiency) * 1.35;
    setFuelEstimate(parseFloat(fuelCost.toFixed(2)));

    // AI Delay Risk Heuristics
    let driverScore = 5.0;
    if (selectedDriver) {
      driverScore = selectedDriver.performanceScore;
    }

    let prob = 5.0;
    if (distance > 800) prob += 25.0;
    else if (distance > 400) prob += 15.0;

    if (priority === 'Critical') prob += 12.0;
    else if (priority === 'High') prob += 6.0;

    prob += (5.0 - driverScore) * 15.0;
    if (mileage > 80000) prob += 10.0;

    prob = Math.min(99, Math.max(1, prob));
    
    let risk = 'Low';
    if (prob > 50) risk = 'High';
    else if (prob > 20) risk = 'Moderate';

    setDelayRisk({ riskLevel: risk, probability: parseFloat(prob.toFixed(1)) });

  }, [originKey, destKey, distance, weight, priority, vehicleId, driverId, vehicles, drivers]);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (originKey === destKey) {
      setFormError('Origin and Destination cannot be the same manufacturing node');
      return;
    }

    if (!vehicleId || !driverId) {
      setFormError('Please select both a fleet vehicle and a driver');
      return;
    }

    const payload = {
      origin: {
        address: LOGISTICS_NODES[originKey].name,
        lat: LOGISTICS_NODES[originKey].lat,
        lng: LOGISTICS_NODES[originKey].lng
      },
      destination: {
        address: LOGISTICS_NODES[destKey].name,
        lat: LOGISTICS_NODES[destKey].lat,
        lng: LOGISTICS_NODES[destKey].lng
      },
      distance,
      weight: Number(weight),
      priority,
      vehicleId,
      driverId,
      eta
    };

    try {
      await api.post('/shipments', payload);
      setModalOpen(false);
      fetchShipmentsAndFleet();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to dispatch shipment');
    }
  };

  const handleCancelShipment = async (shipmentId) => {
    if (window.confirm('Abort shipment and release associated driver & vehicle?')) {
      try {
        await api.put(`/shipments/${shipmentId}/status`, { status: 'Cancelled', note: 'Aborted by Fleet Administrator' });
        fetchShipmentsAndFleet();
      } catch (err) {
        alert('Action failed.');
      }
    }
  };

  // CSV Seeding export mockup
  const exportToCSV = () => {
    let headers = 'ShipmentID,Origin,Destination,Distance(km),Weight(kg),Status,Priority,DelayRisk,FuelCost,ETA\n';
    let rows = shipments.map(s => 
      `"${s.shipmentId}","${s.origin.address}","${s.destination.address}",${s.distance},${s.weight},"${s.status}","${s.priority}","${s.predictedDelayRisk}",$${s.estimatedFuelCost},"${new Date(s.eta).toLocaleDateString()}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `manufacturing_shipments_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.shipmentId.toLowerCase().includes(search.toLowerCase()) ||
                          s.origin.address.toLowerCase().includes(search.toLowerCase()) ||
                          s.destination.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 w-full sm:w-80 shadow-sm">
          <Search className="text-slate-400 mt-0.5 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search by ID, Origin or Destination..."
            className="bg-transparent border-0 text-xs text-slate-800 dark:text-white focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto items-center">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <SlidersHorizontal size={14} />
            <span>Filters:</span>
          </div>

          <select
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Delayed">Delayed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            onClick={exportToCSV}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 font-semibold rounded-xl text-xs py-2.5 px-4 flex items-center gap-1.5"
            title="Download CSV report"
          >
            <FileText size={14} />
            Export CSV
          </button>

          {(isManager || isAdmin) && (
            <button
              onClick={() => {
                setFormError('');
                setModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 shrink-0"
            >
              <Plus size={16} />
              Book Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Shipments Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Shipment ID</th>
                  <th className="p-4">Origin & Destination</th>
                  <th className="p-4">Specs (Distance / Cargo)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Delay Risk</th>
                  <th className="p-4">Fuel Billing</th>
                  <th className="p-4">ETA</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">No shipments found</td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{shipment.shipmentId}</td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{shipment.origin.address.split(' ')[0]}</span>
                            <ChevronRight size={10} className="text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{shipment.destination.address.split(' ')[0]}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-[200px] truncate" title={`${shipment.origin.address} to ${shipment.destination.address}`}>
                            Route details available
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p>{shipment.distance} km</p>
                          <p className="text-slate-400">{(shipment.weight / 1000).toFixed(1)} Tons ({shipment.priority})</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                          shipment.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                          shipment.status === 'In Transit' ? 'bg-blue-500/10 text-blue-500 animate-status-pulse' :
                          shipment.status === 'Delayed' ? 'bg-amber-500/10 text-amber-500' :
                          shipment.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${
                          shipment.predictedDelayRisk === 'Low' ? 'text-emerald-500' :
                          shipment.predictedDelayRisk === 'Moderate' ? 'text-amber-500' :
                          'text-rose-500 font-extrabold'
                        }`}>
                          {shipment.predictedDelayRisk} ({shipment.delayProbability}%)
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-white">${shipment.estimatedFuelCost}</td>
                      <td className="p-4">{new Date(shipment.eta).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        {shipment.status === 'Scheduled' && (isManager || isAdmin) && (
                          <button
                            onClick={() => handleCancelShipment(shipment._id)}
                            className="text-xs text-rose-400 hover:text-rose-500 font-semibold"
                          >
                            Cancel
                          </button>
                        )}
                        {shipment.status === 'In Transit' && (
                          <span className="text-[10px] text-slate-400 italic">Monitored</span>
                        )}
                        {shipment.status === 'Delivered' && (
                          <span className="text-[10px] text-emerald-500 font-bold">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Dispatch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl animate-scale-up flex flex-col md:flex-row">
            
            {/* Form Column */}
            <form onSubmit={handleCreateShipment} className="flex-1 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Schedule Heavy Shipment Dispatch</h3>
                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Origin Plant</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={originKey}
                    onChange={(e) => setOriginKey(e.target.value)}
                  >
                    {Object.entries(LOGISTICS_NODES).map(([key, item]) => (
                      <option key={key} value={key}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Destination Hub</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={destKey}
                    onChange={(e) => setDestKey(e.target.value)}
                  >
                    {Object.entries(LOGISTICS_NODES).map(([key, item]) => (
                      <option key={key} value={key}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    placeholder="e.g. 15000"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Priority Window</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Assign Vehicle (Available)</label>
                  <select
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    <option value="">-- Choose Available Fleet --</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.type} - Max: {(v.capacity/1000).toFixed(0)}T)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Assign Driver (Available)</label>
                  <select
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  >
                    <option value="">-- Choose Available Driver --</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.user?.name} (Rating: {d.performanceScore}/5)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Delivery Deadline (ETA)</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs py-2 px-5 shadow-lg shadow-emerald-500/10"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>

            {/* Calculations Preview Sidebar Column */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/40 p-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-emerald-500" />
                  AI Predictor & Billing
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">Estimations calculated instantly based on route payload parameters.</p>

                <div className="space-y-6 mt-8">
                  {/* Distance */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-lg shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Total Distance</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white">{distance} km</span>
                    </div>
                  </div>

                  {/* Fuel Estimation */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                      <Fuel size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">Fuel Cost Estimate</span>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white">${fuelEstimate}</span>
                    </div>
                  </div>

                  {/* Delay Risk Indicator */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-slate-400 block">AI Delay Probability</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`font-extrabold text-sm ${
                          delayRisk.riskLevel === 'Low' ? 'text-emerald-500' :
                          delayRisk.riskLevel === 'Moderate' ? 'text-amber-500' :
                          'text-rose-500'
                        }`}>
                          {delayRisk.riskLevel} ({delayRisk.probability}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 flex gap-2 items-start">
                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-400 leading-normal">
                  Values reflect diesel pricing ($1.35/L) and structural penalty variables (cargo tonnage offsets efficiency).
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Shipments;
