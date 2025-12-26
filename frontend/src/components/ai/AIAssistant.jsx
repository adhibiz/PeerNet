import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { db, callCloudFunction } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import {
    FaRobot,
    FaPaperPlane,
} from 'react-icons/fa';

const AIAssistant = ({ sessionId, topic = 'General Learning' }) => {
    const { userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initial greeting
        setMessages([{
            id: 'init',
            role: 'assistant',
            content: `Hello! I am your AI assistant for **${topic}**. Ask me anything!`
        }]);
    }, [topic]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Here we would call the actual Cloud Function
            // const result = await callCloudFunction('chatWithAI', { message: input, topic, sessionId });
            // Setting a mock response for frontend interactivity demonstration
            setTimeout(() => {
                const aiMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `I am an AI (simulated). You asked about "${userMsg.content}". In a real deployment, I would query OpenAI/Claude via Firebase Functions.`
                };
                setMessages(prev => [...prev, aiMsg]);
                setIsTyping(false);
            }, 1500);

        } catch (e) {
            console.error(e);
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l">
            <div className="p-4 bg-purple-600 text-white flex items-center gap-2">
                <FaRobot />
                <span className="font-bold">AI Assistant</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-gray-400 text-sm italic">AI is typing...</div>}
            </div>

            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        className="flex-1 border rounded px-3 py-2"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask AI..."
                    />
                    <button onClick={handleSendMessage} className="bg-purple-600 text-white p-2 rounded">
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
