import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaPaperPlane, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success('Message sent! We will get back to you soon.');
        setFormData({ name: '', email: '', message: '' });
        setSending(false);
    };

    return (
        <div className="bg-white min-h-[calc(100vh-80px)]">
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                    <p className="text-xl text-gray-600">
                        Have questions about PeerNet? We're here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <motion.div
                            whileHover={{ x: 10 }}
                            className="bg-blue-50 p-8 rounded-2xl flex items-start space-x-6"
                        >
                            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                                <FaEnvelope className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
                                <p className="text-gray-600">support@peernet.com</p>
                                <p className="text-gray-600">partnerships@peernet.com</p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ x: 10 }}
                            className="bg-purple-50 p-8 rounded-2xl flex items-start space-x-6"
                        >
                            <div className="bg-purple-100 p-4 rounded-full text-purple-600">
                                <FaMapMarkerAlt className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
                                <p className="text-gray-600">
                                    123 Innovation Drive<br />
                                    Tech Valley, CA 94025
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                            >
                                {sending ? (
                                    <span>Sending...</span>
                                ) : (
                                    <>
                                        <FaPaperPlane />
                                        <span>Send Message</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
