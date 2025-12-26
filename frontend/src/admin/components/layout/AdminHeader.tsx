import React from 'react';
import { FaBell, FaSearch, FaUserCircle } from 'react-icons/fa';

const AdminHeader = ({ user, unreadNotifications, onToggleNotifications, onToggleSidebar }) => {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center w-1/3">
                <div className="relative w-full max-w-sm">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100" />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button onClick={onToggleNotifications} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <FaBell />
                    {unreadNotifications > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">{unreadNotifications}</span>
                    )}
                </button>
                <div className="h-8 w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                    <FaUserCircle className="text-2xl text-gray-400" />
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
