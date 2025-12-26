import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChevronRight } from 'react-icons/fa';

const AdminSidebar = ({ navItems, collapsed, onToggle, user }) => {
    return (
        <motion.div
            animate={{ width: collapsed ? 80 : 256 }}
            className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 flex flex-col transition-all duration-300"
        >
            <div className="p-6 flex items-center justify-between">
                {!collapsed && <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PeerNet Admin</span>}
                <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100">
                    {collapsed ? '>' : '<'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {navItems.map((item, index) => (
                    <div key={index}>
                        {item.children ? (
                            <div className="px-4 py-2">
                                {!collapsed && <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{item.title}</h4>}
                                {item.children.map((child, idx) => (
                                    <NavLink
                                        key={idx}
                                        to={child.path}
                                        className={({ isActive }) => `flex items-center px-4 py-2 my-1 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span className="ml-8">{child.title}</span>
                                    </NavLink>
                                ))}
                            </div>
                        ) : (
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `flex items-center px-6 py-3 border-l-4 transition-all ${isActive ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <item.icon className="text-lg" />
                                {!collapsed && <span className="ml-4 font-medium">{item.title}</span>}
                                {item.badge && !collapsed && (
                                    <span className="ml-auto px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">{item.badge}</span>
                                )}
                            </NavLink>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user?.name?.[0] || 'A'}
                    </div>
                    {!collapsed && (
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdminSidebar;
