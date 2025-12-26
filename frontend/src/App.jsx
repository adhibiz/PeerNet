import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
// AdminLayout needs to be lazy loaded too if possible, but layouts are often top-level. 
// However, since it's a specific route /admin, we can lazy load it for sure.
const AdminLayout = lazy(() => import('./admin/components/layout/AdminLayout'));

// Pages via Lazy Loading
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CompleteLearningSession = lazy(() => import('./pages/CompleteLearningSession'));
const CareerRoadmapPage = lazy(() => import('./pages/CareerRoadmapPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard'));
const UserManagement = lazy(() => import('./admin/pages/UserManagement'));
const SessionManagement = lazy(() => import('./admin/pages/SessionManagement'));
const AnalyticsDashboard = lazy(() => import('./admin/components/analytics/AnalyticsDashboard'));
const SystemHealth = lazy(() => import('./admin/components/system/SystemHealth'));

// Loading Component
const Loading = () => (
    <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <SessionProvider>
                    <Suspense fallback={<Loading />}>
                        <Routes>
                            {/* Standalone Session Route */}
                            <Route path="/session/:sessionId" element={
                                <ProtectedRoute>
                                    <CompleteLearningSession />
                                </ProtectedRoute>
                            } />

                            {/* Main App Routes */}
                            <Route element={<MainLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/contact" element={<ContactPage />} />

                                {/* Protected User Routes */}
                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/career" element={
                                    <ProtectedRoute>
                                        <CareerRoadmapPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } />
                            </Route>

                            {/* Admin Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<AdminDashboard />} />
                                <Route path="users" element={<UserManagement />} />
                                <Route path="sessions" element={<SessionManagement />} />
                                <Route path="analytics" element={<AnalyticsDashboard />} />
                                <Route path="system" element={<SystemHealth />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </Suspense>
                </SessionProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
