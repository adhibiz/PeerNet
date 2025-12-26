import React from 'react';
import { motion } from 'framer-motion';

const AdminNotifications = ({ onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-white shadow-xl border-l border-gray-200 z-30 p-4"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Notifications</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-800 font-medium">New User Registration</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                ))}
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-sm text-gray-800 font-medium">System Update</p>
                    <p className="text-xs text-gray-500">Scheduled for tonight</p>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminNotifications;
