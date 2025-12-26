import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStats, useRealTimeData } from '../hooks';
import { adminService } from '../services/adminService';
import { toast } from 'react-hot-toast';
import {
    FaUsers,
    FaChalkboardTeacher,
    FaComments,
    FaBrain,
    FaChartLine,
    FaExclamationTriangle,
    FaDatabase,
    FaServer,
    FaMoneyBillWave,
    FaUserCheck,
    FaClock,
    FaRegCalendarAlt,
    FaCog,
    FaSync,
    FaDownload,
    FaFilter,
    FaSearch
} from 'react-icons/fa';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import RealTimeStats from '../components/analytics/RealTimeStats';
import SystemHealth from '../components/system/SystemHealth';
import AdminNotifications from '../components/layout/AdminNotifications';
import AIInsightsPanel from '../components/analytics/AIInsightsPanel';
import QuickActions from '../components/layout/QuickActions';

const AdminDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [activeTab, setActiveTab] = useState('overview');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filters, setFilters] = useState({
        userType: 'all',
        sessionType: 'all',
        region: 'all'
    });

    const { stats, loading, error, refreshStats } = useAdminStats(timeRange);
    const { realTimeData } = useRealTimeData();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshStats();
        setIsRefreshing(false);
        toast.success('Dashboard refreshed');
    };

    const exportData = async (format) => {
        try {
            const data = await adminService.exportDashboardData(timeRange, format);
            // Implementation of download logic would go here
            toast.success(`Data exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Export failed');
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <FaExclamationTriangle className="text-red-600 text-2xl mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
                            <p className="text-red-600">{error.message}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Real-time monitoring and analytics</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex bg-white rounded-lg border border-gray-300">
                        {['today', 'week', 'month', 'year'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 capitalize ${timeRange === range ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        <FaDownload />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100">Total Users</p>
                            <h3 className="text-3xl font-bold mt-2">
                                {stats?.userStats.totalUsers.toLocaleString() || '0'}
                            </h3>
                            <div className="flex items-center mt-2">
                                <FaChartLine className="mr-2" />
                                <span className="text-sm">
                                    +{stats?.userStats.newUsersToday || 0} today
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FaUsers className="text-2xl" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100">Active Sessions</p>
                            <h3 className="text-3xl font-bold mt-2">
                                {realTimeData?.activeSessions || '0'}
                            </h3>
                            <div className="flex items-center mt-2">
                                <FaClock className="mr-2" />
                                <span className="text-sm">
                                    {stats?.sessionStats.avgDuration || 0} min avg
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FaChalkboardTeacher className="text-2xl" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-purple-100">AI Requests</p>
                            <h3 className="text-3xl font-bold mt-2">
                                {stats?.aiStats.totalRequests.toLocaleString() || '0'}
                            </h3>
                            <div className="flex items-center mt-2">
                                <FaBrain className="mr-2" />
                                <span className="text-sm">
                                    ${(stats?.aiStats.totalCost || 0).toFixed(2)} cost
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FaBrain className="text-2xl" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-orange-100">Revenue</p>
                            <h3 className="text-3xl font-bold mt-2">
                                ${stats?.revenueStats.mrr?.toLocaleString() || '0'}
                            </h3>
                            <div className="flex items-center mt-2">
                                <FaMoneyBillWave className="mr-2" />
                                <span className="text-sm">
                                    {stats?.revenueStats.growth || 0}% growth
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <FaMoneyBillWave className="text-2xl" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {[
                            { id: 'overview', label: 'Overview', icon: FaChartLine },
                            { id: 'analytics', label: 'Analytics', icon: FaDatabase },
                            { id: 'insights', label: 'AI Insights', icon: FaBrain },
                            { id: 'system', label: 'System', icon: FaServer }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon className="mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* User Growth Chart */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">User Growth</h3>
                                        </div>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stats?.userGrowthData || []}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="users"
                                                        stroke="#3b82f6"
                                                        fill="#93c5fd"
                                                        strokeWidth={2}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Real-time Stats */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="text-lg font-semibold mb-4">Real-time Monitoring</h3>
                                        <RealTimeStats data={realTimeData} />
                                    </div>
                                </div>

                                {/* System Health */}
                                <SystemHealth />
                            </motion.div>
                        )}

                        {activeTab === 'insights' && (
                            <motion.div
                                key="insights"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <AIInsightsPanel />
                            </motion.div>
                        )}

                        {activeTab === 'system' && (
                            <motion.div
                                key="system"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <SystemHealth />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
