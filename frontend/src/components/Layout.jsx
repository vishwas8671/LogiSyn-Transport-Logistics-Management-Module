import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

import {
  LayoutDashboard,
  Truck,
  Users,
  Navigation,
  Package,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  FileText,
  User,
  Activity
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isManager, isDriver } = useAuth();
  const { notifications, markAllAsRead } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Dark mode initialization
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') !== 'false';
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('darkMode', nextDark);
    if (nextDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [];

  if (isManager || isAdmin) {
    menuItems.push(
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Shipments', path: '/shipments', icon: Package },
      { name: 'Fleet Manager', path: '/vehicles', icon: Truck },
      { name: 'Drivers', path: '/drivers', icon: Users },
      { name: 'Live Tracking', path: '/tracking', icon: Navigation }
    );
  }

  if (isDriver) {
    menuItems.push(
      { name: 'Driver Portal', path: '/driver-portal', icon: Truck },
      { name: 'Active Shipment Route', path: '/tracking', icon: Navigation }
    );
  }

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?._id)).length;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/30">
              L
            </div>
            <div>
              <span className="font-extrabold text-lg text-white leading-none block">LOGISYNC</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">MFG Logistics</span>
            </div>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
              {user?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm text-white truncate">{user?.name}</h4>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 z-10 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-500 dark:text-slate-400" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="hidden md:block font-bold text-lg text-slate-800 dark:text-white capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'} Overview
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification drop */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white flex items-center justify-center animate-status-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800 dark:text-white">Alerts Center</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-emerald-500 hover:underline">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">No alerts active</p>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <p className="font-semibold text-xs text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(n.createdAt || n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
