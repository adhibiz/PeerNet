import React, { useState } from 'react';
import { FaTimes, FaUser, FaClock, FaVideo, FaEdit, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/adminService';

const SessionDetailsModal = ({ session, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSession, setEditedSession] = useState(session);
    const [saving, setSaving] = useState(false);

    if (!session) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminService.updateSession(session.id, editedSession);
            toast.success('Session updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update session');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setEditedSession(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    {isEditing ? (
                        <input
                            className="text-xl font-bold border rounded p-1 w-full mr-2"
                            value={editedSession.topic}
                            onChange={(e) => handleChange('topic', e.target.value)}
                        />
                    ) : (
                        <h3 className="text-xl font-bold">{session.topic}</h3>
                    )}

                    <div className="flex items-center space-x-2">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><FaEdit /></button>
                        ) : (
                            <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-full"><FaSave /></button>
                        )}
                        <button onClick={onClose}><FaTimes /></button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <FaUser className="mr-2 text-gray-500" />
                        <span>Host: {session.hostName || session.hostId}</span>
                    </div>
                    <div className="flex items-center">
                        <FaClock className="mr-2 text-gray-500" />
                        {isEditing ? (
                            <select
                                value={editedSession.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="border rounded p-1"
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="ended">Ended</option>
                            </select>
                        ) : (
                            <span>Status: {session.status}</span>
                        )}
                    </div>
                    <div className="flex items-center">
                        <FaVideo className="mr-2 text-gray-500" />
                        {isEditing ? (
                            <select
                                value={editedSession.type || 'Standard'}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="border rounded p-1"
                            >
                                <option value="Standard">Standard</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Webinar">Webinar</option>
                            </select>
                        ) : (
                            <span>Type: {session.type || 'Standard'}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Participants</h4>
                        <ul className="list-disc pl-5">
                            {session.participants && session.participants.map((p, i) => (
                                <li key={i}>{p.name || p.id || p}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsModal;
