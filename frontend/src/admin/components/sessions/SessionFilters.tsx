import React from 'react';

const SessionFilters = ({ filters, setFilters }) => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                >
                    <option value="all">All</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                >
                    <option value="all">All</option>
                    <option value="1-on-1">1-on-1</option>
                    <option value="group">Group</option>
                </select>
            </div>
        </div>
    );
};

export default SessionFilters;
