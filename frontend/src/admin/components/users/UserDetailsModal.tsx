import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUser, FaEnvelope, FaCalendar, FaHistory, FaEdit, FaSave } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const UserDetailsModal = ({ user, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUser, setEditedUser] = useState(user);
    const [saving, setSaving] = useState(false);

    if (!user) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminService.updateUser(user.id, editedUser);
            toast.success('User updated successfully');
            setIsEditing(false);
            // Ideally notify parent to refresh list, but for now just close or keep open
        } catch (error) {
            console.error(error);
            toast.error('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setEditedUser(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                    <div className="flex items-center space-x-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                title="Edit User"
                            >
                                <FaEdit />
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                title="Save Changes"
                            >
                                <FaSave />
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                            {editedUser.name?.[0]}
                        </div>
                        <div className="ml-6 flex-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        className="w-full text-2xl font-bold text-gray-900 border rounded p-1"
                                        value={editedUser.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                        placeholder="Name"
                                    />
                                    <input
                                        className="w-full text-gray-500 border rounded p-1"
                                        value={editedUser.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="Email"
                                    />
                                    <div className="flex space-x-2">
                                        <select
                                            value={editedUser.role}
                                            onChange={e => handleChange('role', e.target.value)}
                                            className="px-2 py-1 rounded text-xs border"
                                        >
                                            <option value="student">Student</option>
                                            <option value="tutor">Tutor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <select
                                            value={editedUser.status}
                                            onChange={e => handleChange('status', e.target.value)}
                                            className="px-2 py-1 rounded text-xs border"
                                        >
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
                                    <p className="text-gray-500">{user.email}</p>
                                    <div className="flex mt-2 space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800`}>{user.role}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs bg-green-100 text-green-800`}>{user.status}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-500 mb-2">
                                <FaCalendar className="mr-2" /> Joined
                            </div>
                            <div className="font-semibold">{user.createdAt ? format(parseISO(user.createdAt), 'PP') : 'N/A'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center text-gray-500 mb-2">
                                <FaHistory className="mr-2" /> Last Active
                            </div>
                            <div className="font-semibold">{user.lastLogin ? format(parseISO(user.lastLogin), 'PP p') : 'Never'}</div>
                        </div>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-4">Recent Sessions</h4>
                    <div className="space-y-3">
                        {user.sessions && user.sessions.length > 0 ? (
                            user.sessions.slice(0, 5).map((session, idx) => (
                                <div key={idx} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{session.topic || 'Untitled Session'}</div>
                                        <div className="text-xs text-gray-500">{session.startTime && format(parseISO(session.startTime), 'PP')}</div>
                                    </div>
                                    <span className="text-sm font-semibold">{session.duration || 0} min</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500">No recent sessions provided in details.</div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UserDetailsModal;
