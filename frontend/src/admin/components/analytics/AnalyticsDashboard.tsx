import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import {
    FaFilter,
    FaDownload,
    FaUsers,
    FaClock,
    FaMoneyBillWave,
    FaBrain,
    FaGlobe
} from 'react-icons/fa';
import { analyticsService } from '../../services/analyticsService';
import { toast } from 'react-hot-toast';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [activeTab, setActiveTab] = useState('overview');

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const analyticsData = await analyticsService.getAdvancedAnalytics(timeRange);
            setData(analyticsData);
        } catch (error) {
            toast.error('Failed to fetch analytics data');
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) return <div>Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                    {['overview', 'users', 'sessions', 'revenue', 'devices'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center space-x-3">
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="border rounded px-3 py-2">
                        <option value="month">Month</option>
                        <option value="week">Week</option>
                    </select>
                    <button className="p-2 bg-gray-100 rounded hover:bg-gray-200"><FaDownload /></button>
                </div>
            </div>

            {activeTab === 'overview' && data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h3 className="text-lg font-semibold mb-4"><FaUsers className="inline mr-2" />User Growth</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="newUsers" stroke="#8884d8" fill="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Cards similar to dashboard proper, reusing layout */}
                        <div className="bg-blue-500 p-6 rounded-xl text-white">
                            <div className="text-3xl font-bold">12,458</div>
                            <div>Total Users</div>
                        </div>
                        <div className="bg-green-500 p-6 rounded-xl text-white">
                            <div className="text-3xl font-bold">42</div>
                            <div>Active Sessions</div>
                        </div>
                        <div className="bg-purple-500 p-6 rounded-xl text-white">
                            <div className="text-3xl font-bold">$24k</div>
                            <div>Revenue</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'devices' && data && (
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.deviceUsage} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="percentage" label>
                                    {data.deviceUsage.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
