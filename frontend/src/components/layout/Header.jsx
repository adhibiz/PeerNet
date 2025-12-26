import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600">
                    PeerNet
                </Link>
                <nav className="space-x-4">
                    <Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link>
                    {currentUser ? (
                        <>
                            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                            <Link to="/profile" className="text-gray-600 hover:text-blue-600">Profile</Link>
                            {location.pathname === '/profile' && (
                                <button
                                    onClick={handleLogout}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Logout
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
                            <Link to="/signup" className="text-gray-600 hover:text-blue-600">Signup</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
