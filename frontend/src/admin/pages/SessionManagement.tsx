import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import SessionList from '../components/sessions/SessionList';
import SessionFilters from '../components/sessions/SessionFilters';
import SessionDetailsModal from '../components/sessions/SessionDetailsModal';
import { toast } from 'react-hot-toast';

const SessionManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'all', type: 'all' });
    const [selectedSession, setSelectedSession] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await adminService.getSessions({ filters });
            setSessions(data);
        } catch (error) {
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        // Setup real-time listener
        const unsubscribe = adminService.subscribeToSessionUpdates((update) => {
            // Simple implementation: refresh list or update specific item
            // For now, let's just refresh if an active session changes
            fetchSessions();
        });
        return () => unsubscribe && unsubscribe();
    }, [filters]);

    const handleAction = async (action, session) => {
        if (action === 'view') {
            setSelectedSession(session);
            setShowModal(true);
        } else if (action === 'end') {
            if (window.confirm('End this session?')) {
                await adminService.endSession(session.id);
                toast.success('Session ended');
                fetchSessions();
            }
        } else if (action === 'join') {
            window.open(`/session/${session.id}`, '_blank');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Session Management</h1>
            <SessionFilters filters={filters} setFilters={setFilters} />
            {loading ? <div>Loading...</div> : <SessionList sessions={sessions} onAction={handleAction} />}
            {showModal && (
                <SessionDetailsModal session={selectedSession} onClose={() => setShowModal(false)} />
            )}
        </div>
    );
};

export default SessionManagement;
