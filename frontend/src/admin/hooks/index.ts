import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export const useAdminStats = (timeRange) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getDashboardStats(timeRange);
            setStats(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshStats();
    }, [timeRange]);

    return { stats, loading, error, refreshStats };
};

export const useRealTimeData = () => {
    const [realTimeData, setRealTimeData] = useState({ activeSessions: 0 });

    useEffect(() => {
        // Mock subscription
        const interval = setInterval(() => {
            setRealTimeData({
                activeSessions: 40 + Math.floor(Math.random() * 5),
                activeUsers: 120 + Math.floor(Math.random() * 10)
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return { realTimeData };
};

export const useAdminOperations = () => {
    return {
        // ... placeholders
    };
};
