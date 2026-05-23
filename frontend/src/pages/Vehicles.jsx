import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Truck,
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  AlertOctagon,
  Wrench,
  CheckCircle,
  X,
  Gauge
} from 'lucide-react';

const Vehicles = () => {
  const { isAdmin, isManager } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Form fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState('Semi-Truck');
  const [capacity, setCapacity] = useState('');
  const [fuelEfficiency, setFuelEfficiency] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [driverId, setDriverId] = useState('');
  const [formError, setFormError] = useState('');

  const fetchVehiclesAndDrivers = async () => {
    try {
      setLoading(true);
      const vehicleRes = await api.get('/vehicles');
      setVehicles(vehicleRes.data.data || []);
      
      const driverRes = await api.get('/drivers?available=true');
      setDrivers(driverRes.data.data || []);
    } catch (err) {
      console.error('Error fetching fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesAndDrivers();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setType('Semi-Truck');
    setCapacity('');
    setFuelEfficiency('');
    setInsuranceExpiry('');
    setDriverId('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleNumber(vehicle.vehicleNumber);
    setType(vehicle.type);
    setCapacity(vehicle.capacity);
    setFuelEfficiency(vehicle.fuelEfficiency);
    setInsuranceExpiry(new Date(vehicle.insuranceExpiry).toISOString().split('T')[0]);
    setDriverId(vehicle.driver?._id || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      vehicleNumber,
      type,
      capacity: Number(capacity),
      fuelEfficiency: Number(fuelEfficiency),
      insuranceExpiry,
      driver: driverId || null
    };

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle._id}`, payload);
      } else {
        await api.post('/vehicles', payload);
      }
      setModalOpen(false);
      fetchVehiclesAndDrivers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save vehicle details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to retire this vehicle from active operations?')) {
      try {
        await api.delete(`/vehicles/${id}`);
        fetchVehiclesAndDrivers();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed.');
      }
    }
  };

  const toggleMaintenance = async (vehicle) => {
    const nextStatus = vehicle.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      await api.put(`/vehicles/${vehicle._id}`, { status: nextStatus });
      fetchVehiclesAndDrivers();
    } catch (err) {
      alert('Failed to update maintenance status.');
    }
  };

  // Filter and Search logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) || 
                          v.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    const matchesType = typeFilter ? v.type === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 w-full sm:w-80 shadow-sm">
          <Search className="text-slate-400 mt-0.5 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search fleet vehicle number..."
            className="bg-transparent border-0 text-xs text-slate-800 dark:text-white focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
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
            <option value="Available">Available</option>
            <option value="In Transit">In Transit</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>

          <select
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Semi-Truck">Semi-Truck</option>
            <option value="Box Truck">Box Truck</option>
            <option value="Flatbed">Flatbed</option>
            <option value="Cargo Van">Cargo Van</option>
            <option value="Reefer">Reefer</option>
          </select>

          {(isManager || isAdmin) && (
            <button
              onClick={openAddModal}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 shrink-0 ml-auto"
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Fleet Grid / Table */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Vehicle No</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Max Capacity</th>
                  <th className="p-4">Fuel Efficiency</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Current Location</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">No vehicles match filters</td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Truck size={16} className="text-slate-400" />
                        <span>{vehicle.vehicleNumber}</span>
                      </td>
                      <td className="p-4">{vehicle.type}</td>
                      <td className="p-4">{(vehicle.capacity / 1000).toFixed(1)} Metric Tons</td>
                      <td className="p-4">{vehicle.fuelEfficiency} km/L</td>
                      <td className="p-4">
                        {vehicle.driver ? (
                          <span className="font-semibold">{vehicle.driver.user?.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          vehicle.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                          vehicle.status === 'In Transit' ? 'bg-blue-500/10 text-blue-500' :
                          vehicle.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            vehicle.status === 'Available' ? 'bg-emerald-500' :
                            vehicle.status === 'In Transit' ? 'bg-blue-500 animate-status-pulse' :
                            vehicle.status === 'Maintenance' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="p-4 max-w-[200px] truncate" title={vehicle.currentLocation?.address}>
                        {vehicle.currentLocation?.address}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2.5">
                        {/* Maintenance trigger button */}
                        {(isManager || isAdmin) && (
                          <button
                            onClick={() => toggleMaintenance(vehicle)}
                            disabled={vehicle.status === 'In Transit'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              vehicle.status === 'Maintenance'
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/25'
                                : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-amber-500/10 hover:text-amber-500'
                            }`}
                            title={vehicle.status === 'Maintenance' ? 'Mark Operational' : 'Mark Under Maintenance'}
                          >
                            <Wrench size={14} />
                          </button>
                        )}

                        {/* Edit button */}
                        {(isManager || isAdmin) && (
                          <button
                            onClick={() => openEditModal(vehicle)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                            title="Edit fleet specs"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}

                        {/* Delete button */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(vehicle._id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            title="Retire vehicle"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/10">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingVehicle ? `Configure specs: ${editingVehicle.vehicleNumber}` : 'Register New Fleet Vehicle'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertOctagon size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Vehicle number</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white uppercase"
                    placeholder="MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Type</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Semi-Truck">Semi-Truck</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Cargo Van">Cargo Van</option>
                    <option value="Reefer">Reefer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    placeholder="e.g. 18000"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Fuel Efficiency (km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    placeholder="e.g. 5.5"
                    value={fuelEfficiency}
                    onChange={(e) => setFuelEfficiency(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Insurance Expiry Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Driver Assignment</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">-- No Driver Assigned --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.user?.name} (Lic: {d.licenseNumber})</option>
                  ))}
                </select>
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
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Vehicles;
