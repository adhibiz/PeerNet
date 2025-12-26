import React from 'react';

const UserFilters = ({ filters, setFilters }) => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                    value={filters.plan}
                    onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Regions</option>
                    <option value="US">USA</option>
                    <option value="IN">India</option>
                </select>
            </div>
        </div>
    );
};

export default UserFilters;
