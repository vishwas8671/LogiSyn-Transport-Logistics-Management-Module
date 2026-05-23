import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { QRCodeSVG } from 'qrcode.react'; // Standard package from qrcode.react
import {
  Truck,
  Award,
  BookOpen,
  MapPin,
  Calendar,
  AlertTriangle,
  QrCode,
  CheckCircle,
  Play,
  Camera,
  X,
  Compass,
  AlertCircle
} from 'lucide-react';

const DriverPortal = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [driverProfile, setDriverProfile] = useState(null);
  const [assignedShipments, setAssignedShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scanner UI States
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [scannerSuccess, setScannerSuccess] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scanCodeText, setScanCodeText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      
      // Get driver profile details (scores, license)
      const profileRes = await api.get('/auth/profile');
      setDriverProfile(profileRes.data.driverProfile || null);

      // Get assigned shipments
      const shipmentsRes = await api.get('/shipments');
      setAssignedShipments(shipmentsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching driver portal info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleUpdateStatus = async (shipmentId, nextStatus, note = '') => {
    try {
      await api.put(`/shipments/${shipmentId}/status`, { status: nextStatus, note });
      fetchDriverData();
    } catch (err) {
      alert('Failed to update status. ' + (err.response?.data?.message || ''));
    }
  };

  const openQRScanner = (shipment) => {
    setSelectedShipment(shipment);
    setScannerOpen(true);
    setScannerSuccess(false);
    setScannerError('');
    setScanCodeText('');
  };

  const handleVerifyQR = async () => {
    if (!selectedShipment) return;
    setIsVerifying(true);
    setScannerError('');

    try {
      // Post validation credentials
      await api.post(`/shipments/${selectedShipment._id}/verify-qr`, {
        qrCodeData: selectedShipment.qrCodeData,
      });

      setScannerSuccess(true);
      setTimeout(() => {
        setScannerOpen(false);
        fetchDriverData();
      }, 2000);
    } catch (err) {
      setScannerError(err.response?.data?.message || 'QR Code signature check failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={4} />;
  }

  // Active Shipment (Scheduled or In Transit)
  const activeShipment = assignedShipments.find(s => ['Scheduled', 'In Transit', 'Delayed'].includes(s.status));
  const historicalShipments = assignedShipments.filter(s => ['Delivered', 'Cancelled'].includes(s.status));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Profile summary card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-extrabold text-lg">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white leading-tight">{user?.name}</h3>
            <span className="text-xs text-slate-400 mt-1 block">Commercial Driver Profile</span>
          </div>
        </div>

        {driverProfile && (
          <div className="flex gap-6 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800/80 w-full md:w-auto">
            <div>
              <span className="text-slate-400 block">Performance rating</span>
              <div className="flex items-center gap-1 mt-1">
                <Award className="text-amber-500" size={14} />
                <span className="font-bold text-slate-800 dark:text-white">{driverProfile.performanceScore} / 5</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">License specs</span>
              <div className="flex items-center gap-1 mt-1 text-slate-700 dark:text-slate-300">
                <BookOpen size={14} className="text-slate-400" />
                <span className="font-bold">{driverProfile.licenseNumber}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block">Current status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 uppercase mt-1">
                {driverProfile.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Active Trip panel */}
      {activeShipment ? (
        <div className="glass-panel rounded-2xl border-l-4 border-indigo-600 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Current Assigned Duty</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">Shipment {activeShipment.shipmentId}</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              activeShipment.status === 'In Transit' ? 'bg-blue-500/10 text-blue-500 animate-status-pulse' :
              activeShipment.status === 'Delayed' ? 'bg-amber-500/10 text-amber-500' :
              'bg-slate-500/10 text-slate-400'
            }`}>
              {activeShipment.status}
            </span>
          </div>

          {/* Logistics specs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Origin & Destination */}
            <div className="flex gap-2.5 items-start">
              <MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} />
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Route specs</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {activeShipment.origin.address.split(' ')[0]} ➔ {activeShipment.destination.address.split(' ')[0]}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{activeShipment.distance} km total</p>
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="flex gap-2.5 items-start">
              <Truck className="text-slate-400 mt-0.5 shrink-0" size={16} />
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Assigned Fleet</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {activeShipment.vehicle?.vehicleNumber}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{activeShipment.vehicle?.type} (Capacity: {(activeShipment.weight/1000).toFixed(1)}T)</p>
              </div>
            </div>

            {/* Delivery Deadline */}
            <div className="flex gap-2.5 items-start">
              <Calendar className="text-slate-400 mt-0.5 shrink-0" size={16} />
              <div>
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Delivery Deadline</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                  {new Date(activeShipment.eta).toLocaleDateString()}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(activeShipment.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          {/* Workflow Action Triggers */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            {activeShipment.status === 'Scheduled' && (
              <button
                onClick={() => handleUpdateStatus(activeShipment._id, 'In Transit', 'Driver accepted vehicle key and started dispatch run')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
              >
                <Play size={14} />
                Start Transit Run
              </button>
            )}

            {activeShipment.status === 'In Transit' && (
              <>
                <button
                  onClick={() => openQRScanner(activeShipment)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <QrCode size={14} />
                  Complete Delivery (QR Scan)
                </button>

                <button
                  onClick={() => {
                    const reason = window.prompt('Report delays (road blockade, engine checks, weather):');
                    if (reason) {
                      handleUpdateStatus(activeShipment._id, 'Delayed', `Traffic disruption reported: ${reason}`);
                    }
                  }}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-500 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-transparent transition-colors"
                >
                  Report Delay
                </button>
              </>
            )}

            {activeShipment.status === 'Delayed' && (
              <button
                onClick={() => handleUpdateStatus(activeShipment._id, 'In Transit', 'Traffic delays resolved, resuming route')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
              >
                Resume Transit Run
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-slate-400">
          <CheckCircle size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold">No active shipments scheduled. All duties clear!</p>
        </div>
      )}

      {/* Historical Shipments Log */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Compass className="text-slate-400" size={16} />
          Completed Duties History
        </h3>
        
        {historicalShipments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No historical shipments log</p>
        ) : (
          <div className="overflow-x-auto text-xs text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Shipment ID</th>
                  <th className="py-2.5">Origin ➔ Destination</th>
                  <th className="py-2.5">Date Completed</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {historicalShipments.map((s) => (
                  <tr key={s._id} className="text-slate-600 dark:text-slate-300">
                    <td className="py-3 font-bold">{s.shipmentId}</td>
                    <td className="py-3">{s.origin.address.split(' ')[0]} ➔ {s.destination.address.split(' ')[0]}</td>
                    <td className="py-3">{new Date(s.actualDeliveryTime || s.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        s.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulated Camera QR Scanner Modal */}
      {scannerOpen && selectedShipment && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setScannerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-500"
            >
              <X size={18} />
            </button>

            {scannerSuccess ? (
              <div className="text-center py-8 space-y-4 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle size={36} />
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Delivery Verified!</h4>
                <p className="text-xs text-slate-400">QR Code cryptographic key matching was successful.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Verify Package Code</h4>
                  <p className="text-xs text-slate-400 mt-1">Simulated camera sign-off portal.</p>
                </div>

                {/* Simulated Camera Viewport containing the QR Code itself! */}
                {/* This allows the driver to "read" the QR code directly on their screen to complete the loop! */}
                <div className="relative aspect-square w-full max-w-[240px] mx-auto bg-slate-950 border-4 border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                  {/* Scan overlay guidelines */}
                  <div className="absolute inset-4 border-2 border-emerald-500/30 border-dashed rounded-lg pointer-events-none"></div>
                  {/* Laser line animation */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 shadow-md shadow-emerald-500/50 animate-bounce" style={{ animationDuration: '3.5s' }}></div>

                  {/* Render the actual SVG code for validation! */}
                  <div className="p-3 bg-white rounded-lg shadow-xl">
                    <QRCodeSVG value={selectedShipment.qrCodeData} size={150} />
                  </div>
                </div>

                {scannerError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{scannerError}</span>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-[10px] text-slate-400 text-center leading-normal">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Package Token:</span>
                  <p className="font-mono mt-1 break-all bg-slate-100 dark:bg-slate-950/40 rounded p-1.5 text-[9px]">{selectedShipment.qrCodeData}</p>
                </div>

                <button
                  onClick={handleVerifyQR}
                  disabled={isVerifying}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  {isVerifying ? (
                    <span className="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Camera size={14} />
                      Verify QR Signature
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverPortal;
