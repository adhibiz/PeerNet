import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to log in: ' + err.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input
                        type="email"
                        className="w-full p-2 border rounded"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700">Password</label>
                    <input
                        type="password"
                        className="w-full p-2 border rounded"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200">
                    Login
                </button>
                <div className="mt-4 text-center">
                    <span className="text-gray-600">Don't have an account? </span>
                    <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">Sign Up</Link>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
