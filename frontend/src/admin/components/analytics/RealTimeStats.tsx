import React from 'react';
import { FaUser, FaChalkboardTeacher, FaBolt } from 'react-icons/fa';

const RealTimeStats = ({ data }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
                <FaUser className="mx-auto text-blue-500 mb-2" />
                <div className="text-2xl font-bold text-blue-700">{data?.activeUsers || 0}</div>
                <div className="text-xs text-blue-600">Active Users</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
                <FaChalkboardTeacher className="mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold text-green-700">{data?.activeSessions || 0}</div>
                <div className="text-xs text-green-600">Active Sessions</div>
            </div>
        </div>
    );
};

export default RealTimeStats;
