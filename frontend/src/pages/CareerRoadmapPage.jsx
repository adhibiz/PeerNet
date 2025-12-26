import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaLock, FaStar, FaTrophy } from 'react-icons/fa';

const CareerRoadmapPage = () => {
    const { userData } = useAuth();

    // Determine user level based on stats
    const sessionsCompleted = userData?.stats?.sessionsCompleted || 0;
    const contributionScore = userData?.stats?.contributionScore || 0;

    // Mock Roadmap Data - In a real app, this might come from a DB based on user's track (e.g., Frontend Dev)
    const roadmapSteps = [
        {
            id: 1,
            title: "Peer Initiate",
            description: "Complete your first 3 sessions to unlock.",
            threshold: 3,
            type: 'sessions',
            isUnlocked: sessionsCompleted >= 3,
            icon: <FaStar />
        },
        {
            id: 2,
            title: "Knowledge Sharer",
            description: "Host 1 session and earn 50 contribution points.",
            threshold: 50,
            type: 'contribution',
            isUnlocked: contributionScore >= 50,
            icon: <FaUsers />
        },
        {
            id: 3,
            title: "Intermediate Learner",
            description: "Complete 10 sessions total.",
            threshold: 10,
            type: 'sessions',
            isUnlocked: sessionsCompleted >= 10,
            icon: <FaBookOpen />
        },
        {
            id: 4,
            title: "Community Mentor",
            description: "Achieve 200 contribution points.",
            threshold: 200,
            type: 'contribution',
            isUnlocked: contributionScore >= 200,
            icon: <FaTrophy />
        },
        {
            id: 5,
            title: "Master Peer",
            description: "The ultimate status. 50+ sessions.",
            threshold: 50,
            type: 'sessions',
            isUnlocked: sessionsCompleted >= 50,
            icon: <FaCrown />
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Career Roadmap</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Track your journey from a beginner to a PeerNet Master. Unlock milestones by participating in sessions and helping others.
                </p>

                <div className="mt-8 inline-flex items-center bg-blue-50 px-6 py-3 rounded-full">
                    <span className="text-blue-800 font-medium">Current Progress: </span>
                    <span className="ml-2 font-bold text-blue-900">{sessionsCompleted} Sessions</span>
                    <span className="mx-3 text-gray-300">|</span>
                    <span className="font-bold text-green-700">{contributionScore} Points</span>
                </div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>

                {roadmapSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`relative flex items-center justify-between mb-12 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Empty side for layout balance */}
                        <div className="w-5/12"></div>

                        {/* Center Icon */}
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-4 flex items-center justify-center z-10 transition-colors duration-500
                            ${step.isUnlocked
                                ? 'bg-green-500 border-green-200 text-white'
                                : 'bg-white border-gray-300 text-gray-300'
                            }`}
                        >
                            {step.isUnlocked ? <FaCheckCircle className="text-xl" /> : <FaLock />}
                        </div>

                        {/* Content Card */}
                        <div className="w-5/12">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`p-6 rounded-2xl shadow-lg border-l-4 transition-all
                                    ${step.isUnlocked
                                        ? 'bg-white border-green-500 shadow-green-100'
                                        : 'bg-gray-50 border-gray-300 grayscale opacity-80'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-2xl ${step.isUnlocked ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {step.icon}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                                </div>
                                <p className="text-gray-600 mb-4 text-sm">{step.description}</p>

                                {step.isUnlocked ? (
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                        COMPLETED
                                    </span>
                                ) : (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${Math.min(100, Math.max(0,
                                                    (step.type === 'sessions'
                                                        ? (sessionsCompleted / step.threshold)
                                                        : (contributionScore / step.threshold)
                                                    ) * 100
                                                ))}%`
                                            }}
                                        ></div>
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {step.type === 'sessions' ? sessionsCompleted : contributionScore} / {step.threshold}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-12 mb-20">
                <Link to="/dashboard">
                    <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                        Continue Your Journey
                    </button>
                </Link>
            </div>
        </div>
    );
};

// Helper Icons (mock imports for standalone use, normally from react-icons/fa)
import { FaUsers, FaBookOpen, FaCrown } from 'react-icons/fa';

export default CareerRoadmapPage;
