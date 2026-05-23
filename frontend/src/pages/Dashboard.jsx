import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Package,
  Truck,
  AlertTriangle,
  Fuel,
  DollarSign,
  TrendingUp,
  Award,
  ListTodo
} from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#6b7280'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data.data);

        const logsRes = await api.get('/notifications/logs');
        setLogs(logsRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton /></div>
          <div><ChartSkeleton /></div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const { kpis, distributions, monthlyTrends, topDrivers } = stats;

  // Format Statuses for Pie Chart
  const statusChartData = Object.entries(distributions.status).map(([name, value]) => ({
    name,
    value,
  })).filter(item => item.value > 0);

  // Format Priorities for Bar Chart
  const priorityChartData = Object.entries(distributions.priority).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Shipments</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 block">{kpis.totalShipments}</span>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-500 font-semibold">
            <TrendingUp size={14} />
            <span>Active Operations</span>
          </div>
        </div>

        {/* Vehicles Transit */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Fleet</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 block">{kpis.activeVehicles} / {kpis.totalVehicles}</span>
            </div>
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-xl">
              <Truck size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-status-pulse"></span>
            <span>Vehicles In Transit</span>
          </div>
        </div>

        {/* Delay Warnings */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Delay Warnings</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 block">{kpis.delayedShipments}</span>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-amber-500 font-semibold">
            <span>Requires Dispatch Check</span>
          </div>
        </div>

        {/* Fuel Costs / Budget */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Fuel Spend</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 block">${kpis.totalFuelCost.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-xl">
              <Fuel size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-indigo-500 font-semibold">
            <span>Estimated Fleet Total</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Logistics Monthly Trend (Area Chart) */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Transit Logistics Value</h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical overview of shipment volume and simulated budget</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#f8fafc' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area name="Volume (Shipments)" type="monotone" dataKey="shipments" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorShipments)" />
                <Area name="Estimated Value ($)" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution (Pie Chart) */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-1">Fleet Operations States</h3>
          <p className="text-xs text-slate-400 mb-6">Real-time status breakdowns</p>
          <div className="h-56 relative flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <div className="text-xs text-slate-400">No active shipments</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active</span>
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white block leading-none mt-0.5">
                {kpis.totalShipments - kpis.pendingShipments}
              </span>
            </div>
          </div>
          {/* Custom Legend */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-semibold">
            {statusChartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub Grids Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Auditing Activity Logs */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="text-emerald-500" size={18} />
            <h3 className="font-bold text-slate-800 dark:text-white">Admin Activity Audits</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-16">No operations logged</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Operation</th>
                    <th className="py-2.5">Details</th>
                    <th className="py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {logs.slice(0, 7).map((log) => (
                    <tr key={log._id} className="text-slate-600 dark:text-slate-300">
                      <td className="py-3 font-semibold">{log.user?.name || 'System'}</td>
                      <td className="py-3 font-medium text-slate-800 dark:text-white">{log.action}</td>
                      <td className="py-3 max-w-[200px] truncate text-slate-400">{log.details}</td>
                      <td className="py-3 text-right text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Driver Leaderboard */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-amber-500" size={18} />
            <h3 className="font-bold text-slate-800 dark:text-white">Top Driver Ratings</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {topDrivers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-16">No drivers seeded</p>
            ) : (
              topDrivers.map((driver, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/25 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-white leading-none">{driver.name}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{driver.trips} Trips Completed</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-amber-500">{driver.score} / 5</span>
                    <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(driver.score / 5) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
