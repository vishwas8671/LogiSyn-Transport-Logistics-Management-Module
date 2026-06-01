import Shipment from '../models/Shipment.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
// @desc    Get dashboard aggregated analytics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const totalShipments = await Shipment.countDocuments();
    const inTransitShipments = await Shipment.countDocuments({ status: 'In Transit' });
    const delayedShipments = await Shipment.countDocuments({ status: 'Delayed' });
    const pendingShipments = await Shipment.countDocuments({ status: 'Pending' });
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: 'In Transit' });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'Maintenance' });

    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({ status: 'Available' });

    // 2. Status Distribution
    const statusCounts = await Shipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const formattedStatuses = {
      Pending: 0,
      Scheduled: 0,
      'In Transit': 0,
      Delivered: 0,
      Delayed: 0,
      Cancelled: 0,
    };
    statusCounts.forEach((item) => {
      if (item._id in formattedStatuses) {
        formattedStatuses[item._id] = item.count;
      }
    });

    // 3. Priority Distribution
    const priorityCounts = await Shipment.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    const formattedPriorities = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    priorityCounts.forEach((item) => {
      if (item._id in formattedPriorities) {
        formattedPriorities[item._id] = item.count;
      }
    });

    // 4. Financial Logistics Metrics (Fuel Costs & Billing Revenue)
    // Cargo billing: Let's charge $2.75 per km representing shipping revenue.
    const finances = await Shipment.aggregate([
      {
        $group: {
          _id: null,
          totalFuel: { $sum: '$estimatedFuelCost' },
          totalDistance: { $sum: '$distance' },
          totalWeight: { $sum: '$weight' },
        },
      },
    ]);

    const totalFuelCost = finances[0]?.totalFuel || 0;
    const totalDistance = finances[0]?.totalDistance || 0;
    // Freight Shipping Revenue = Distance * $2.75 + Cargo Weight * $0.05
    const totalRevenue = totalDistance * 2.75 + (finances[0]?.totalWeight || 0) * 0.05;

    // 5. Monthly Shipments Trend (last 6 months)
    const monthlyData = await Shipment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
          fuel: { $sum: '$estimatedFuelCost' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthlyData.map((item) => {
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        shipments: item.count,
        delivered: item.delivered,
        fuelCost: parseFloat(item.fuel.toFixed(2)),
        revenue: parseFloat((item.count * 1500).toFixed(2)), // Mock month revenue scaling
      };
    });

    // 6. Top Performing Drivers (rated by score)
    const topDrivers = await Driver.find()
      .populate('user', 'name')
      .sort({ performanceScore: -1 })
      .limit(5);

    const formattedDrivers = topDrivers.map(d => ({
      name: d.user?.name || 'Unknown Driver',
      score: d.performanceScore,
      trips: d.totalTrips,
      delayed: d.delayedTrips,
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalShipments,
          inTransitShipments,
          delayedShipments,
          pendingShipments,
          totalVehicles,
          activeVehicles,
          maintenanceVehicles,
          totalDrivers,
          availableDrivers,
          totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        },
        distributions: {
          status: formattedStatuses,
          priority: formattedPriorities,
        },
        monthlyTrends,
        topDrivers: formattedDrivers,
      },
    });
  } catch (error) {
    next(error);
  }
};
