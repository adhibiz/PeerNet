import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionCard = ({ session }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 
            ${session.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            session.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'}`}>
                        {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800">{session.topic}</h3>
                </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                <span>👥 {session.participants.length} / {session.maxParticipants} Peers</span>
                <span>⏱️ {session.duration} min</span>
            </div>

            <button
                onClick={() => navigate(`/session/${session.id}`)}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
            >
                Join Session
            </button>
        </div>
    );
};

export default SessionCard;
