import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SessionCard from '../components/dashboard/SessionCard';
import QuickActions from '../components/dashboard/QuickActions';
import { useNavigate } from 'react-router-dom';
import { simulationService } from '../services/simulationService';

const DashboardPage = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [matchStatus, setMatchStatus] = useState('');

    // ... (existing newSession state)
    const [newSession, setNewSession] = useState({
        topic: '',
        difficulty: 'beginner',
        maxParticipants: 4
    });

    const handleSmartMatch = async () => {
        setIsMatching(true);
        setMatchStatus('Analyzing your learning profile...');

        try {
            // Simulate processing time
            await new Promise(r => setTimeout(r, 1500));

            setMatchStatus('Scanning active sessions...');
            // Try to find a match for a generic topic or user's interest
            const bestTopic = userData?.learningGoals?.[0] || 'React';
            const match = await simulationService.findMatch(userData, bestTopic);

            if (match) {
                setMatchStatus('Match found! Redirecting...');
                setTimeout(() => navigate(`/session/${match.id}`), 1000);
            } else {
                setMatchStatus('No perfect match found. Starting a new optimized session...');
                // Create a session for them
                const sessionData = {
                    title: bestTopic, // Add title
                    topic: bestTopic,
                    difficulty: 'beginner',
                    participants: [userData.id],
                    maxParticipants: 2, // 1-on-1 for better focus
                    createdBy: userData.id,
                    createdAt: new Date(),
                    status: 'waiting',
                    isAiMatched: true,
                    chatMessages: [],
                    duration: 45,
                    hostName: userData.name || 'AI Match'
                };
                const docRef = await addDoc(collection(db, 'sessions'), sessionData);
                setTimeout(() => navigate(`/session/${docRef.id}`), 1000);
            }
        } catch (e) {
            console.error(e);
            setMatchStatus('Error finding match.');
            setIsMatching(false);
        }
    };

    // Fetch active sessions
    useEffect(() => {
        const q = query(
            collection(db, 'sessions'),
            where('status', 'in', ['waiting', 'active'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessionList = [];
            snapshot.forEach((doc) => {
                sessionList.push({ id: doc.id, ...doc.data() });
            });
            setSessions(sessionList);
        });

        return () => unsubscribe();
    }, []);

    const createSession = async () => {
        if (!userData) return;
        setIsCreatingSession(true); // Keep modal open or show loading state

        try {
            const sessionData = {
                title: newSession.topic, // Add title for CompleteLearningSession
                topic: newSession.topic,
                difficulty: newSession.difficulty,
                participants: [userData.id],
                maxParticipants: newSession.maxParticipants,
                createdBy: userData.id,
                createdAt: new Date(),
                status: 'waiting',
                chatMessages: [],
                duration: 60, // 60 minutes default
                hostName: userData.name || 'Host'
            };

            const docRef = await addDoc(collection(db, 'sessions'), sessionData);
            setNewSession({ topic: '', difficulty: 'beginner', maxParticipants: 4 });
            setIsCreatingSession(false);

            // Navigate to the new session
            navigate(`/session/${docRef.id}`);
        } catch (error) {
            console.error("Error creating session: ", error);
            // Optionally show an error toast here
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">
                    Welcome back, {userData?.name || 'User'}!
                </h1>
                <p className="text-gray-600 mb-4">
                    Ready to learn something new with peers today?
                </p>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-green-600 font-bold">★</span>
                        </div>
                        <span className="text-gray-700">
                            Contribution Score: <strong>{userData?.stats?.contributionScore || 0}</strong>
                        </span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-blue-600 font-bold">📚</span>
                        </div>
                        <span className="text-gray-700">
                            Sessions Completed: <strong>{userData?.stats?.sessionsCompleted || 0}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Smart Match Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">AI Smart Match</h2>
                    <p className="text-blue-100 mb-6 max-w-xl">
                        Let our algorithm find the perfect study peer for you based on your skills,
                        learning style, and current goals.
                    </p>
                    <button
                        onClick={handleSmartMatch}
                        disabled={isMatching}
                        className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                    >
                        {isMatching ? (
                            <>
                                <span className="animate-spin">🔄</span> Finding Best Match...
                            </>
                        ) : (
                            <>
                                <span>🚀</span> Find My Peer Now
                            </>
                        )}
                    </button>
                    {matchStatus && <p className="mt-4 font-medium text-yellow-300">{matchStatus}</p>}
                </div>
                {/* Decorative Pattern */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
            </div>

            {/* Quick Actions */}
            <QuickActions onCreateSession={() => setIsCreatingSession(true)} />

            {/* Create Session Modal */}
            {isCreatingSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold text-blue-900 mb-4">Create New Session</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Topic
                                </label>
                                <input
                                    type="text"
                                    value={newSession.topic}
                                    onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="What do you want to learn?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Difficulty Level
                                </label>
                                <select
                                    value={newSession.difficulty}
                                    onChange={(e) => setNewSession({ ...newSession, difficulty: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Peers
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    max="8"
                                    value={newSession.maxParticipants}
                                    onChange={(e) => setNewSession({ ...newSession, maxParticipants: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setIsCreatingSession(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createSession}
                                disabled={!newSession.topic.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Sessions */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Active Learning Sessions</h2>
                    <span className="text-sm text-gray-600">
                        {sessions.length} session{sessions.length !== 1 ? 's' : ''} available
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                    ))}
                    {sessions.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-medium text-gray-600 mb-2">
                                No active sessions
                            </h3>
                            <p className="text-gray-500">
                                Be the first to create a session and start learning with peers!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
