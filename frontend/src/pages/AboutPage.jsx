import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const AboutPage = () => {
    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        Democratizing Peer Learning
                    </motion.h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        We believe that everyone has something to teach and something to learn.
                        PeerNet connects learners globally to accelerate growth through collaboration.
                    </p>
                </div>
            </div>

            {/* Mission */}
            <div className="py-16 max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Traditional education is often isolated and linear. We're building a network where learning
                            is dynamic, interactive, and community-driven.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            By leveraging real-time WebRTC technology and AI-assisted matching, we ensure
                            that every interaction on PeerNet adds tangible value to your career journey.
                        </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
                        <span className="text-gray-400">Mission Image Placeholder</span>
                    </div>
                </div>
            </div>

            {/* Team */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet the Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Adhi", role: "Lead Developer", bio: "Full-stack wizard passionate about EdTech." },
                            { name: "Sarah", role: "Product Design", bio: "Crafting intuitive user experiences." },
                            { name: "Mike", role: "AI Engineer", bio: "Building the intelligence behind the match." }
                        ].map((member, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="bg-white p-6 rounded-xl shadow-lg text-center"
                            >
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                                    {member.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                <div className="text-blue-600 font-medium mb-3">{member.role}</div>
                                <p className="text-gray-500 mb-4">{member.bio}</p>
                                <div className="flex justify-center space-x-4 text-gray-400">
                                    <FaGithub className="hover:text-gray-900 cursor-pointer" />
                                    <FaLinkedin className="hover:text-blue-700 cursor-pointer" />
                                    <FaTwitter className="hover:text-blue-400 cursor-pointer" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
