import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    FaSearch,
    FaFilter,
    FaUserPlus,
    FaDownload,
    FaUpload,
    FaEdit,
    FaTrash,
    FaBan,
    FaCheck,
    FaTimes,
    FaEye,
    FaLock,
    FaUnlock,
    FaEnvelope,
    FaChartLine,
    FaCog,
    FaSort,
    FaSortUp,
    FaSortDown
} from 'react-icons/fa';
import { format, parseISO, differenceInDays } from 'date-fns';
import UserDetailsModal from '../components/users/UserDetailsModal';
import UserFilters from '../components/users/UserFilters';
import { adminService } from '../services/adminService';
import { debounce } from 'lodash';

// Interface inline as per providing code
interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'premium' | 'admin' | 'moderator';
    status: 'active' | 'inactive' | 'suspended' | 'banned';
    createdAt: string;
    lastLogin: string;
    sessions: number;
    country: string;
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    contributionScore: number;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortField, setSortField] = useState<keyof User>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState({
        status: 'all',
        role: 'all',
        plan: 'all',
        country: 'all',
        dateRange: 'all'
    });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [bulkAction, setBulkAction] = useState<string>('');

    const itemsPerPage = 20;

    // Fetch users
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery,
                filters,
                sortField,
                sortDirection
            });
            setUsers(response.users);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, filters, sortField, sortDirection]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            setSearchQuery(query);
            setCurrentPage(1);
        }, 500),
        []
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    };

    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedUsers.length === 0) {
            toast.error('Please select users');
            return;
        }

        try {
            switch (action) {
                case 'activate':
                    await adminService.bulkUpdateUserStatus(selectedUsers, 'active');
                    toast.success(`${selectedUsers.length} users activated`);
                    break;
                case 'suspend':
                    await adminService.bulkUpdateUserStatus(selectedUsers, 'suspended');
                    toast.success(`${selectedUsers.length} users suspended`);
                    break;
                case 'delete':
                    if (window.confirm(`Delete ${selectedUsers.length} users? This action cannot be undone.`)) {
                        await adminService.deleteUsers(selectedUsers); // Note: Need to add deleteUsers to service if missing
                        toast.success(`${selectedUsers.length} users deleted`);
                    }
                    break;
                case 'export':
                    //   const data = await adminService.exportUsers(selectedUsers);
                    //   downloadCSV(data, 'users.csv');
                    toast.success('Users exported');
                    break;
            }
            fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            toast.error(`Failed to perform ${action}`);
        }
    };


    const handleUserAction = async (userId: string, action: string) => {
        try {
            switch (action) {
                case 'view':
                    const user = await adminService.getUserDetails(userId);
                    setSelectedUser(user);
                    setShowDetailsModal(true);
                    break;
                case 'edit':
                    // Open edit modal
                    break;
                case 'suspend':
                    await adminService.updateUserStatus(userId, 'suspended');
                    toast.success('User suspended');
                    fetchUsers();
                    break;
                case 'activate':
                    await adminService.updateUserStatus(userId, 'active');
                    toast.success('User activated');
                    fetchUsers();
                    break;
                case 'delete':
                    if (window.confirm('Delete this user?')) {
                        await adminService.deleteUser(userId);
                        toast.success('User deleted');
                        fetchUsers();
                    }
                    break;
            }
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            suspended: 'bg-yellow-100 text-yellow-800',
            banned: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${styles[status] || 'bg-gray-100'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getPlanBadge = (plan: string) => {
        const styles = {
            free: 'bg-gray-100 text-gray-800',
            basic: 'bg-blue-100 text-blue-800',
            premium: 'bg-purple-100 text-purple-800',
            enterprise: 'bg-green-100 text-green-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs ${styles[plan] || 'bg-gray-100'}`}>
                {plan?.charAt(0).toUpperCase() + plan?.slice(1)}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Manage and monitor all platform users</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 border border-gray-300 rounded-lg flex items-center space-x-2"
                    >
                        <FaFilter />
                        <span>Filters</span>
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                        <FaUserPlus />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <UserFilters filters={filters} setFilters={setFilters} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Bulk Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or ID..."
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                            {selectedUsers.length} selected
                        </span>
                        <select
                            value={bulkAction}
                            onChange={(e) => {
                                setBulkAction(e.target.value);
                                if (e.target.value) handleBulkAction(e.target.value);
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">Bulk Actions</option>
                            <option value="activate">Activate</option>
                            <option value="suspend">Suspend</option>
                            <option value="export">Export</option>
                            <option value="delete">Delete</option>
                        </select>
                        <button
                            onClick={() => handleSelectAll()}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        User
                                        {sortField === 'name' && (
                                            sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('role')}
                                >
                                    <div className="flex items-center">
                                        Role
                                        {sortField === 'role' && (
                                            sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('status')}
                                >
                                    Status
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('plan')}
                                >
                                    Plan
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Joined
                                        {sortField === 'createdAt' && (
                                            sortDirection === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('lastLogin')}
                                >
                                    Last Login
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('sessions')}
                                >
                                    Sessions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                        <span className="text-white font-bold">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                    user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPlanBadge(user.plan)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {user.createdAt ? format(parseISO(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {user.lastLogin ? format(parseISO(user.lastLogin), 'MMM d, yyyy') : 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{user.sessions}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'view')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'edit')}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleUserAction(user.id, 'suspend')}
                                                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                                        title="Suspend"
                                                    >
                                                        <FaBan />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUserAction(user.id, 'activate')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Activate"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleUserAction(user.id, 'delete')}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                </div>
            </div>

            {/* User Details Modal */}
            <AnimatePresence>
                {showDetailsModal && selectedUser && (
                    <UserDetailsModal
                        user={selectedUser}
                        onClose={() => {
                            setShowDetailsModal(false);
                            setSelectedUser(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
