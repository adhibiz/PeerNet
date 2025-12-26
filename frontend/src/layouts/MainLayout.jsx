import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
            <Header />
            <main className="container mx-auto px-4 py-8 flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
