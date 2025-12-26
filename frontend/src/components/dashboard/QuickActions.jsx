import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus, FaMapMarkedAlt, FaUserEdit } from 'react-icons/fa';

const QuickActions = ({ onCreateSession }) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateSession}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
            >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-lg">New Session</span>
                    <span className="text-blue-100 text-sm">Host a learning room</span>
                </div>
                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                    <FaPlus className="text-xl" />
                </div>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/career')}
                className="bg-white text-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all flex items-center justify-between group"
            >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-lg">My Roadmap</span>
                    <span className="text-gray-500 text-sm">Track your progress</span>
                </div>
                <div className="bg-purple-50 p-3 rounded-full text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <FaMapMarkedAlt className="text-xl" />
                </div>
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profile')}
                className="bg-white text-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all flex items-center justify-between group"
            >
                <div className="flex flex-col items-start">
                    <span className="font-bold text-lg">Edit Profile</span>
                    <span className="text-gray-500 text-sm">Update skills & bio</span>
                </div>
                <div className="bg-green-50 p-3 rounded-full text-green-600 group-hover:bg-green-100 transition-colors">
                    <FaUserEdit className="text-xl" />
                </div>
            </motion.button>
        </div>
    );
};

export default QuickActions;
