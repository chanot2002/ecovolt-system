import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    // I-assume na mayroong AuthContext Provider
    const { currentUser } = useAuth();
    
    // If the user is authenticated, render the children (Outlet)
    // Otherwise, redirect to the login page
    return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;