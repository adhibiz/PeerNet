import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaServer,
    FaMemory,
    FaMicrochip,
    FaHdd,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaSync,
    FaRocket,
    FaShieldAlt
} from 'react-icons/fa';
import { systemService } from '../../services/systemService';
import { toast } from 'react-hot-toast';

const SystemHealth = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchMetrics = async () => {
        try {
            const data = await systemService.getSystemMetrics();
            setMetrics(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch system metrics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
        let interval;
        if (autoRefresh) {
            interval = setInterval(fetchMetrics, 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const formatBytes = (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(2)} ${units[unitIndex]}`;
    };

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const getStatusColor = (usage) => {
        if (usage < 70) return 'text-green-500';
        if (usage < 85) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (loading && !metrics) {
        return <div className="p-6">Loading System Health...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <FaServer className="text-2xl text-blue-600 mr-3" />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">System Health</h3>
                            <p className="text-gray-600">Real-time system monitoring</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={fetchMetrics} className="p-2 text-gray-600 hover:text-gray-900"><FaSync /></button>
                        <label className="flex items-center space-x-2">
                            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded border-gray-300" />
                            <span className="text-sm text-gray-600">Auto-refresh</span>
                        </label>
                    </div>
                </div>
            </div>

            {metrics && (
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-xl flex items-center">
                            <FaRocket className="text-2xl text-blue-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold">{formatUptime(metrics.uptime)}</div>
                                <div className="text-sm text-gray-600">System Uptime</div>
                            </div>
                        </div>
                        {/* More metrics cards roughly implementing the style */}
                        <div className="bg-green-50 p-4 rounded-xl flex items-center">
                            <FaShieldAlt className="text-2xl text-green-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold">{metrics.processes}</div>
                                <div className="text-sm text-gray-600">Active Processes</div>
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl flex items-center">
                            <FaExclamationTriangle className="text-2xl text-red-600 mr-3" />
                            <div>
                                <div className="text-2xl font-bold">{metrics.alerts.length}</div>
                                <div className="text-sm text-gray-600">Alerts</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center mb-4">
                                <FaMicrochip className="text-xl text-purple-600 mr-2" />
                                <h4 className="font-semibold">CPU Usage</h4>
                                <span className={`ml-auto font-bold ${getStatusColor(metrics.cpu.usage)}`}>{metrics.cpu.usage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div className="bg-purple-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${metrics.cpu.usage}%` }} />
                            </div>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center mb-4">
                                <FaMemory className="text-xl text-blue-600 mr-2" />
                                <h4 className="font-semibold">Memory Usage</h4>
                                <span className={`ml-auto font-bold ${getStatusColor(metrics.memory.usage)}`}>{metrics.memory.usage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div className="bg-blue-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${metrics.memory.usage}%` }} />
                            </div>
                        </div>

                        <div className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center mb-4">
                                <FaHdd className="text-xl text-green-600 mr-2" />
                                <h4 className="font-semibold">Disk Usage</h4>
                                <span className={`ml-auto font-bold ${getStatusColor(metrics.disk.usage)}`}>{metrics.disk.usage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div className="bg-green-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${metrics.disk.usage}%` }} />
                            </div>
                            <div className="flex justify-between text-xs mt-2 text-gray-500">
                                <span>Free: {formatBytes(metrics.disk.free)}</span>
                                <span>Total: {formatBytes(metrics.disk.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemHealth;
