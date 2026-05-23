import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserPlus, Mail, Lock, User, Shield, BookOpen, Calendar, Phone } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager'); // default manager
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const driverData = role === 'driver' ? { licenseNumber, licenseExpiry, phone } : {};
      const user = await register(name, email, password, role, driverData);
      if (user.role === 'driver') {
        navigate('/driver-portal');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <div className="max-w-md w-full glass-panel dark:bg-slate-900/60 dark:border-slate-800 border-slate-200/20 shadow-2xl rounded-2xl p-8">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-emerald-500/30">
            L
          </div>
          <h2 className="text-2xl font-bold text-white mt-3">Create Control Profile</h2>
          <p className="text-xs text-slate-400 mt-1">MFG Logistics Control Center</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Role Assignment</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Shield size={16} />
              </span>
              <select
                className="w-full bg-slate-800 border border-slate-700/50 text-white rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="manager">Transport Manager</option>
                <option value="driver">Logistics Driver</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>

          {/* Dynamic Driver License Subform */}
          {role === 'driver' && (
            <div className="space-y-4 pt-3 border-t border-slate-800/60 animate-fade-in">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Driver Documentation</h4>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">License Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <BookOpen size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="DL-XXXXXXXXXX"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">License Expiry</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Calendar size={14} />
                    </span>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      value={licenseExpiry}
                      onChange={(e) => setLicenseExpiry(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Phone Contact</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Phone size={14} />
                    </span>
                    <input
                      type="tel"
                      required
                      className="w-full bg-slate-800/40 text-white border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                      placeholder="+91 99999 99999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-6 text-sm"
          >
            {loading ? (
              <span className="border-2 border-white/30 border-t-white h-4 w-4 rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus size={16} />
                Register Profile
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Already have an account? </span>
          <Link to="/login" className="text-emerald-400 hover:underline font-semibold">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
