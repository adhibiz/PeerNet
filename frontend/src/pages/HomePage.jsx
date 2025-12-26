import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaRocket, FaUserGraduate, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';

const HomePage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 z-0"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-32">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 tracking-tight">
                            Master Any Skill <br /> with Peer Power
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 mb-10">
                            PeerNet connects you with learning partners worldwide.
                            Real-time voice, collaborative whiteboards, and AI-driven matching
                            to accelerate your career growth.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/signup">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
                                >
                                    Get Started for Free
                                </motion.button>
                            </Link>
                            <Link to="/about">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl shadow border border-gray-100 hover:border-gray-300 transition-all"
                                >
                                    Learn More
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to exceed</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Our platform combines the best of peer learning with advanced technology.
                        </p>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {[
                            {
                                icon: <FaUsers className="text-3xl text-blue-600" />,
                                title: "Peer Matching",
                                desc: "Smart algorithms match you with peers at your exact skill level."
                            },
                            {
                                icon: <FaChalkboardTeacher className="text-3xl text-purple-600" />,
                                title: "Interactive Whiteboard",
                                desc: "Collaborate in real-time with drawing tools and sticky notes."
                            },
                            {
                                icon: <FaRocket className="text-3xl text-pink-600" />,
                                title: "Career Maps",
                                desc: "Visual roadmaps to track your progress from beginner to expert."
                            },
                            {
                                icon: <FaUserGraduate className="text-3xl text-green-600" />,
                                title: "AI Mentorship",
                                desc: "Get 24/7 assistance from our AI tutor when you're stuck."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100"
                            >
                                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <div className="bg-blue-900 py-20 text-white">
                <div className="max-w-7xl mx-auto px-4 flex justify-around text-center">
                    <div>
                        <div className="text-4xl font-bold mb-2">10k+</div>
                        <div className="text-blue-200">Active Learners</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">50k+</div>
                        <div className="text-blue-200">Sessions Hosted</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">95%</div>
                        <div className="text-blue-200">Success Rate</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
