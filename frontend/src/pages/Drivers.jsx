import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TableSkeleton } from '../components/LoadingSkeleton';
import {
  Users,
  Search,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Phone,
  BookOpen,
  Star,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldAlert
} from 'lucide-react';

const Drivers = () => {
  const { isAdmin, isManager } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Available');
  const [performanceScore, setPerformanceScore] = useState(5.0);
  const [formError, setFormError] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drivers');
      setDrivers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching driver list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setName(driver.user?.name || '');
    setEmail(driver.user?.email || '');
    setLicenseNumber(driver.licenseNumber);
    setLicenseExpiry(new Date(driver.licenseExpiry).toISOString().split('T')[0]);
    setPhone(driver.phone);
    setStatus(driver.status);
    setPerformanceScore(driver.performanceScore);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      name,
      email,
      licenseNumber,
      licenseExpiry,
      phone,
      status,
      performanceScore: Number(performanceScore),
    };

    try {
      await api.put(`/drivers/${editingDriver._id}`, payload);
      setModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update driver');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this driver profile and login credentials?')) {
      try {
        await api.delete(`/drivers/${id}`);
        fetchDrivers();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed.');
      }
    }
  };

  // Filter & Search
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 w-full sm:w-80 shadow-sm">
          <Search className="text-slate-400 mt-0.5 shrink-0" size={16} />
          <input
            type="text"
            placeholder="Search drivers by name or license..."
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
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="On Leave">On Leave</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Driver Grid Cards */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 glass-panel rounded-2xl">
              No drivers profile found matching search
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const successRate = driver.totalTrips > 0 
                ? ((driver.totalTrips - driver.delayedTrips) / driver.totalTrips * 100).toFixed(0) 
                : '100';

              return (
                <div key={driver._id} className="glass-panel rounded-2xl p-6 flex flex-col justify-between relative shadow-sm">
                  {/* Status Tag */}
                  <span className={`absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                    driver.status === 'Available' ? 'bg-emerald-500/10 text-emerald-500' :
                    driver.status === 'On Trip' ? 'bg-blue-500/10 text-blue-500 animate-status-pulse' :
                    driver.status === 'On Leave' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {driver.status}
                  </span>

                  {/* Body Info */}
                  <div>
                    <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">{driver.user?.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{driver.user?.email}</p>

                    {/* Contacts info */}
                    <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-slate-400" />
                        <span>Lic: {driver.licenseNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Trips</span>
                      <span className="font-bold text-sm text-slate-700 dark:text-white">{driver.totalTrips}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Late Trips</span>
                      <span className="font-bold text-sm text-rose-400">{driver.delayedTrips}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">On-Time %</span>
                      <span className="font-bold text-sm text-emerald-500">{successRate}%</span>
                    </div>
                  </div>

                  {/* Footer Rating */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-amber-400 stroke-amber-400" />
                      <span className="font-extrabold text-sm text-amber-500">{driver.performanceScore}</span>
                      <span className="text-[10px] text-slate-400">/ 5.0</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {(isManager || isAdmin) && (
                        <button
                          onClick={() => openEditModal(driver)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                          title="Edit driver"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(driver._id)}
                          disabled={driver.status === 'On Trip'}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-50"
                          title="Delete driver profile"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Driver Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/10">
              <h3 className="font-bold text-slate-800 dark:text-white">Configure Profile: {name}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Driver Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">License Number</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">License Expiry</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Phone number</label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Availability status</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Performance Rating (0.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                  value={performanceScore}
                  onChange={(e) => setPerformanceScore(e.target.value)}
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
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Drivers;
