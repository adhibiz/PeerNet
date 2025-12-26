import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    FaChalkboardTeacher,
    FaComments,
    FaMicrophone,
    FaVideo,
    FaCog,
    FaUsers,
    FaExpand,
    FaCompress,
    FaShareAlt,
    FaClock,
    FaRobot,
    FaChevronRight,
    FaChevronLeft,
    FaSignOutAlt,
    FaUserPlus,
    FaTimes,
    FaExclamationTriangle,
    FaTrash,
    FaPlus,
    FaHashtag
} from 'react-icons/fa';
import { deleteDoc, collection, setDoc } from 'firebase/firestore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AdvancedChatSystem from '../components/chat/AdvancedChatSystem';
import CompleteWhiteboardSystem from '../components/whiteboard/CompleteWhiteboardSystem';
import CompleteVoiceSystem from '../components/voice/CompleteVoiceSystem';
import AIAssistant from '../components/ai/AIAssistant';

interface SessionState {
    id: string;
    title: string;
    hostId: string;
    status: 'scheduled' | 'active' | 'completed';
    startedAt: any;
    participants: string[];
    layout: 'balanced' | 'chat-focused' | 'whiteboard-focused' | 'voice-focused';
}

interface VoiceChannel {
    id: string;
    name: string;
    type: 'general' | 'breakout';
    participants: string[];
}

interface UserProfile {
    displayName: string;
    email: string;
    photoURL?: string;
    about?: string;
    skills?: string[];
    joinedAt?: any; // Firestore Timestamp
}

type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

const CompleteLearningSession = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const [session, setSession] = useState<SessionState | null>(null);
    const [activeTab, setActiveTab] = useState<'whiteboard' | 'chat'>('whiteboard');
    const [showVoice, setShowVoice] = useState(true);
    const [showAI, setShowAI] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [layout, setLayout] = useState<'balanced' | 'focused'>('balanced');
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [channels, setChannels] = useState<VoiceChannel[]>([]);
    const [activeChannel, setActiveChannel] = useState('general');

    // Profile & Connection State
    const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [participantsData, setParticipantsData] = useState<Record<string, UserProfile>>({});

    const prevParticipantsRef = useRef<string[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            if (doc.exists()) {
                const data = doc.data() as SessionState;
                setSession({ ...data, id: doc.id });

                // Update timer if session is active
                if (data.status === 'active' && data.startedAt) {
                    // Logic handled by interval below
                }
            } else {
                toast.error('Session not found');
                navigate('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [sessionId, navigate]);

    // Fetch Participants Data (Names/Avatars)
    useEffect(() => {
        const fetchParticipantsData = async () => {
            if (!session?.participants) return;
            const newData: Record<string, UserProfile> = {};
            // Identify missing IDs to fetch
            const idsToFetch = session.participants.filter(id => !participantsData[id] && id !== currentUser?.uid);

            if (currentUser && !participantsData[currentUser.uid]) {
                // Ensure we have current user data immediately if possible, or fetch it
                if (userProfile) newData[currentUser.uid] = userProfile as any;
            }

            // We can batch fetch or just Promise.all. 
            // Ideally we shouldn't re-fetch known ones.
            await Promise.all(idsToFetch.map(async (uid) => {
                try {
                    const snap = await getDoc(doc(db, 'users', uid));
                    if (snap.exists()) {
                        newData[uid] = snap.data() as UserProfile;
                    }
                } catch (e) {
                    console.error(`Failed to fetch user ${uid}`, e);
                }
            }));

            if (Object.keys(newData).length > 0) {
                setParticipantsData(prev => ({ ...prev, ...newData }));
            }
        };
        fetchParticipantsData();
    }, [session?.participants, currentUser?.uid]);

    // Listen for Voice Channels
    useEffect(() => {
        if (!sessionId) return;
        const q = collection(db, 'sessions', sessionId, 'voice_channels');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chans: VoiceChannel[] = [];
            snapshot.forEach(doc => {
                chans.push({ id: doc.id, ...doc.data() } as VoiceChannel);
            });
            // Ensure at least General exists locally for internal consistency if not yet fetched
            setChannels(chans.sort((a, b) => a.name === 'General' ? -1 : 1));
        });
        return () => unsubscribe();
    }, [sessionId]);

    // Monitor participants for Join/Leave toasts
    useEffect(() => {
        if (!session?.participants) return;

        const current = session.participants;
        const prev = prevParticipantsRef.current;

        // Joined
        const joined = current.filter(p => !prev.includes(p));
        joined.forEach(p => {
            if (p !== currentUser?.uid) toast.success(`User ${p.slice(0, 4)} joined the session`);
        });

        // Left
        const left = prev.filter(p => !current.includes(p));
        left.forEach(p => {
            if (p !== currentUser?.uid) toast.error(`User ${p.slice(0, 4)} left the session`);
        });

        prevParticipantsRef.current = current;
    }, [session?.participants, currentUser?.uid]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (session?.status === 'active' && session.startedAt) {
                const start = session.startedAt.toDate();
                const now = new Date();
                const diff = now.getTime() - start.getTime();

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [session]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Session link copied!');
    };

    const updateLayout = (newLayout: 'balanced' | 'focused') => {
        setLayout(newLayout);
        // Could also save preference to user settings or session state
    };

    const handleLeaveSession = () => {
        setShowLeaveConfirm(true);
    };

    const confirmLeave = () => {
        navigate('/dashboard');
        // Logic to remove user from participants list in DB should happen here or via backend trigger
    };

    const handleDeleteSession = async () => {
        if (!session || !sessionId) return;
        if (session.hostId !== currentUser.uid) {
            toast.error("Only the host can delete the session");
            return;
        }

        if (window.confirm("Are you sure you want to permanently delete this session?")) {
            try {
                await deleteDoc(doc(db, 'sessions', sessionId));
                toast.success('Session deleted');
                navigate('/dashboard');
            } catch (err) {
                console.error(err);
                toast.error('Failed to delete session');
            }
        }
    };

    const handleAddChannel = async () => {
        const name = prompt("Enter channel name:");
        if (!name || !sessionId) return;
        const id = name.toLowerCase().replace(/\s+/g, '-');
        try {
            await setDoc(doc(db, 'sessions', sessionId, 'voice_channels', id), {
                name,
                type: 'breakout',
                participants: [],
                maxParticipants: 50
            });
            toast.success(`Channel ${name} created`);
        } catch (e) {
            console.error(e);
            toast.error("Failed to create channel");
        }
    };

    // --- Friend System Logic ---

    // Fetch Profile & Status when selectedUser changes
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!selectedUser || !currentUser) return;
            setIsLoadingProfile(true);
            try {
                // 1. Fetch Profile
                const userDoc = await getDoc(doc(db, 'users', selectedUser));
                if (userDoc.exists()) {
                    setSelectedUserProfile(userDoc.data() as UserProfile);
                } else {
                    setSelectedUserProfile(null);
                }

                // 2. Fetch Connection Status
                // We check users/{me}/connections/{them}
                const connDoc = await getDoc(doc(db, 'users', currentUser.uid, 'connections', selectedUser));
                if (connDoc.exists()) {
                    setConnectionStatus(connDoc.data().status as ConnectionStatus);
                } else {
                    setConnectionStatus('none');
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load user profile");
            } finally {
                setIsLoadingProfile(false);
            }
        };

        if (selectedUser) {
            fetchProfileData();
        } else {
            setSelectedUserProfile(null);
            setConnectionStatus('none');
        }
    }, [selectedUser, currentUser]);

    const handleSendRequest = async () => {
        if (!selectedUser || !currentUser) return;
        try {
            // Write to My Connections (Sent)
            await setDoc(doc(db, 'users', currentUser.uid, 'connections', selectedUser), {
                status: 'pending_sent',
                updatedAt: new Date()
            });
            // Write to Their Connections (Received)
            await setDoc(doc(db, 'users', selectedUser, 'connections', currentUser.uid), {
                status: 'pending_received',
                updatedAt: new Date()
            });
            setConnectionStatus('pending_sent');
            toast.success("Friend request sent!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to send request");
        }
    };

    const handleAcceptRequest = async () => {
        if (!selectedUser || !currentUser) return;
        try {
            // Update My Connections
            await setDoc(doc(db, 'users', currentUser.uid, 'connections', selectedUser), {
                status: 'accepted',
                updatedAt: new Date()
            });
            // Update Their Connections
            await setDoc(doc(db, 'users', selectedUser, 'connections', currentUser.uid), {
                status: 'accepted',
                updatedAt: new Date()
            });
            setConnectionStatus('accepted');
            toast.success("Friend request accepted!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to accept request");
        }
    };

    const handleDeclineRequest = async () => {
        // Same as remove/cancel - delete docs
        await handleRemoveFriend();
    };

    const handleRemoveFriend = async () => {
        if (!selectedUser || !currentUser) return;
        try {
            // Delete My Doc
            await deleteDoc(doc(db, 'users', currentUser.uid, 'connections', selectedUser));
            // Delete Their Doc
            await deleteDoc(doc(db, 'users', selectedUser, 'connections', currentUser.uid));
            setConnectionStatus('none');
            toast.success("Updated connection status");
        } catch (e) {
            console.error(e);
            toast.error("Failed to update status");
        }
    };

    if (!session || !currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-5 overflow-hidden font-sans">
            <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Main Content */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Left Panel */}
                    {showLeftSidebar && (
                        <aside className="w-[280px] bg-[#f9fafb] border-r border-[#e5e7eb] flex flex-col flex-shrink-0">
                            {/* Participants Section */}
                            <div className="p-6 border-b border-[#e5e7eb]">
                                <div className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <FaUsers />
                                    Participants ({Array.isArray(session.participants) ? session.participants.length : 0})
                                </div>
                                <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto">
                                    {(Array.isArray(session.participants) ? session.participants : []).map((participantId, idx) => {
                                        const pData = participantsData[participantId];
                                        const name = participantId === currentUser.uid ? 'You' : (pData?.displayName || `User ${participantId.slice(0, 4)}`);
                                        const initial = pData?.displayName ? pData.displayName.charAt(0).toUpperCase() : participantId.slice(0, 2).toUpperCase();

                                        return (
                                            <div key={idx} onClick={() => setSelectedUser(participantId)} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer transition-all hover:bg-[#f3f4f6] hover:translate-x-1 border border-transparent hover:border-gray-200">
                                                <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#93c5fd] to-[#a78bfa] text-white flex items-center justify-center font-semibold text-sm">
                                                    {initial}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 text-sm truncate w-32">
                                                        {name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {participantId === session.hostId ? 'Host' : 'Participant'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Voice Channels Section */}
                            <div className="p-6 flex-1 overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="font-semibold text-gray-700 flex items-center gap-2">
                                        <FaHashtag />
                                        Channels
                                    </div>
                                    {session.hostId === currentUser.uid && (
                                        <button
                                            onClick={handleAddChannel}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                            title="Add Channel"
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 cursor-pointer">
                                    {channels.map((channel) => (
                                        <div
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel.id)}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-[#f3f4f6] ${activeChannel === channel.id ? 'bg-[#eef2ff] border-l-4 border-[#4f46e5]' : 'bg-white'}`}
                                        >
                                            <span className={`${activeChannel === channel.id ? 'text-[#4f46e5]' : 'text-gray-400'}`}>#</span>
                                            <div className={`flex-1 font-medium ${activeChannel === channel.id ? 'text-[#4f46e5]' : 'text-gray-900'}`}>
                                                {channel.name}
                                            </div>
                                            {/* We could show participant count here if we track distinct voice participants per channel */}
                                        </div>
                                    ))}
                                    {channels.length === 0 && (
                                        <div className="text-sm text-gray-400 italic p-2">Loading channels...</div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-[#e5e7eb] bg-white flex flex-col gap-2">
                                <button
                                    onClick={handleLeaveSession}
                                    className="w-full flex items-center justify-center gap-2 bg-[#fee2e2] text-[#dc2626] py-3 rounded-xl font-medium transition-all hover:bg-[#fecaca] hover:shadow-sm"
                                >
                                    <FaSignOutAlt />
                                    Leave Session
                                </button>
                                {session.hostId === currentUser.uid && (
                                    <button
                                        onClick={handleDeleteSession}
                                        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-50"
                                    >
                                        <FaTrash />
                                        Delete Session
                                    </button>
                                )}
                            </div>
                        </aside>
                    )}

                    {/* Toggle Button for Left Sidebar */}
                    <button
                        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 p-1 rounded-r-md shadow-md z-20 hover:bg-gray-50"
                        style={{ left: showLeftSidebar ? '280px' : '0' }}
                        title={showLeftSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {showLeftSidebar ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
                    </button>

                    {/* Center Panel */}
                    <section className="flex-1 flex flex-col bg-white overflow-hidden relative">
                        {/* Board Header / Tabs */}
                        <div className="h-[60px] px-6 border-b border-[#e5e7eb] flex items-center justify-between flex-shrink-0 z-10 bg-white">
                            <div className="flex gap-1 bg-[#f3f4f6] p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('whiteboard')}
                                    className={`px-5 py-2.5 border-none rounded-lg font-medium cursor-pointer transition-all flex items-center gap-2 text-sm ${activeTab === 'whiteboard' ? 'bg-white text-[#4f46e5] shadow-sm' : 'bg-transparent text-gray-500 hover:text-[#4f46e5]'
                                        }`}
                                >
                                    <FaChalkboardTeacher />
                                    Whiteboard
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`px-5 py-2.5 border-none rounded-lg font-medium cursor-pointer transition-all flex items-center gap-2 text-sm ${activeTab === 'chat' ? 'bg-white text-[#4f46e5] shadow-sm' : 'bg-transparent text-gray-500 hover:text-[#4f46e5]'
                                        }`}
                                >
                                    <FaComments />
                                    Chat
                                </button>
                            </div>

                            {activeTab === 'whiteboard' && (
                                <div className="flex items-center gap-3">
                                    {/*  Tools are handled inside CompleteWhiteboardSystem usually, 
                                        but design shows them here. We can either:
                                        1. Move tool state up (big refactor).
                                        2. Render them here visually only (confusing).
                                        3. Let WhiteboardSystem render its own tools.
                                        
                                        For now, we'll let existing WhiteboardSystem render its tools 
                                        to ensure functionality works, but we wrap it to fit layout.
                                    */}
                                    <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold mr-2">Tools Active</span>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-[#f9fafb] relative overflow-hidden">
                            <div className={`absolute inset-0 flex flex-col ${activeTab === 'whiteboard' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
                                <CompleteWhiteboardSystem sessionId={sessionId!} userId={currentUser.uid} />
                            </div>

                            <div className={`absolute inset-0 flex flex-col ${activeTab === 'chat' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
                                <AdvancedChatSystem
                                    sessionId={sessionId!}
                                    userId={currentUser.uid}
                                    onUserClick={(uid) => setSelectedUser(uid)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Right Panel */}
                    {showRightSidebar && (
                        <aside className="w-[320px] bg-[#f9fafb] border-l border-[#e5e7eb] flex flex-col flex-shrink-0">
                            {/* Voice Controls */}
                            <div className="p-6 border-b border-[#e5e7eb]">
                                <div className="mb-5">
                                    <div className="font-semibold text-gray-900 mb-1">Voice Channel</div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Connected to {channels.find(c => c.id === activeChannel)?.name || activeChannel}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <CompleteVoiceSystem
                                        sessionId={sessionId!}
                                        userId={currentUser.uid}
                                        userName={userProfile?.name || 'User'}
                                        currentChannel={activeChannel}
                                    />
                                </div>
                            </div>

                            {/* AI Assistant */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-[#e5e7eb] bg-white">
                                    <div className="flex items-center gap-3 text-[#7c3aed] font-semibold">
                                        <FaRobot />
                                        AI Assistant
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <AIAssistant sessionId={sessionId!} />
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Toggle Button for Right Sidebar */}
                    <button
                        onClick={() => setShowRightSidebar(!showRightSidebar)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 p-1 rounded-l-md shadow-md z-20 hover:bg-gray-50"
                        style={{ right: showRightSidebar ? '320px' : '0' }}
                        title={showRightSidebar ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {showRightSidebar ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
                    </button>
                </main>
            </div>

            {/* Profile User Modal */}
            {
                selectedUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
                        <div className="bg-white rounded-2xl shadow-xl w-[320px] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                                <button onClick={() => setSelectedUser(null)} className="absolute top-3 right-3 text-white/80 hover:text-white">
                                    <FaTimes />
                                </button>
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                    <div className="w-16 h-16 rounded-full bg-white p-1 shadow-md">
                                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                                            {selectedUser.slice(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-10 pb-6 px-6 text-center">
                                {isLoadingProfile ? (
                                    <div className="py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                                            {selectedUserProfile?.displayName || (selectedUser === currentUser.uid ? "You" : `User ${selectedUser.slice(0, 6)}`)}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-3">{selectedUser === session.hostId ? "Session Host" : "Participant"}</p>

                                        {/* Status / Role */}
                                        {selectedUserProfile?.about && (
                                            <p className="text-gray-600 text-sm mb-4 px-2 italic">
                                                "{selectedUserProfile.about}"
                                            </p>
                                        )}

                                        {/* Skills */}
                                        {selectedUserProfile?.skills && selectedUserProfile.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 justify-center mb-5">
                                                {selectedUserProfile.skills.map((skill, i) => (
                                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Joined Date */}
                                        {selectedUserProfile?.joinedAt && (
                                            <div className="text-xs text-gray-400 mb-6">
                                                Member since: {new Date(selectedUserProfile.joinedAt.seconds * 1000).toLocaleDateString()}
                                            </div>
                                        )}

                                        <div className="flex gap-2 justify-center">
                                            {selectedUser !== currentUser.uid && (
                                                <>
                                                    {connectionStatus === 'none' && (
                                                        <button
                                                            onClick={handleSendRequest}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                                        >
                                                            <FaUserPlus />
                                                            Add Friend
                                                        </button>
                                                    )}

                                                    {connectionStatus === 'pending_sent' && (
                                                        <button
                                                            onClick={handleRemoveFriend}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors shadow-sm"
                                                        >
                                                            <FaTimes />
                                                            Cancel Request
                                                        </button>
                                                    )}

                                                    {connectionStatus === 'pending_received' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleAcceptRequest}
                                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                                                            >
                                                                <FaUserPlus />
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={handleDeclineRequest}
                                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors shadow-sm"
                                                            >
                                                                <FaTimes />
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}

                                                    {connectionStatus === 'accepted' && (
                                                        <button
                                                            onClick={handleRemoveFriend}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm"
                                                        >
                                                            <FaTimes />
                                                            Remove Friend
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Leave Confirmation Modal */}
            {
                showLeaveConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-[400px] p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaExclamationTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Leave Session?</h3>
                            <p className="text-gray-500 mb-6">Are you sure you want to leave? You can rejoin later if the session is still active.</p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLeave}
                                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Yes, Leave
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CompleteLearningSession;
