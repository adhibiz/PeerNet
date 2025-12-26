import React from 'react';
import { FaUserPlus, FaEnvelope, FaFileExport, FaServer } from 'react-icons/fa';

const QuickActions = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-3">
                    <FaUserPlus />
                </div>
                <span className="font-medium text-gray-700">Add User</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mb-3">
                    <FaEnvelope />
                </div>
                <span className="font-medium text-gray-700">Broadcast</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mb-3">
                    <FaFileExport />
                </div>
                <span className="font-medium text-gray-700">Export Logs</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all">
                <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                    <FaServer />
                </div>
                <span className="font-medium text-gray-700">Maintenance</span>
            </button>
        </div>
    );
};

export default QuickActions;
