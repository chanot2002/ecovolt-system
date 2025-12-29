import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Siguraduhing naka-wrap ang provider

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import Agrowaste from './components/Agrowaste';
import Settings from './components/Settings';
import Reports from './components/Reports';
import EFOAnalysis from './components/EFOAnalysis';

function App() {
  return (
    <AuthProvider> {/* Napaka-importante na nakabalot ang Router dito */}
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          {/* Ang user ay pwedeng pumunta dito kahit hindi login */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<Login isForgotPassword={true} />} />

          {/* --- PROTECTED ROUTES --- */}
          {/* Dadaan muna sa ProtectedRoute check bago makita ang loob */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Kapag nag-type ang user ng "/" at login sila, Dashboard ang lalabas */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/agrowaste" element={<Agrowaste />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/efo-analysis" element={<EFOAnalysis />} />
            </Route>
          </Route>

          {/* --- CATCH-ALL --- */}
          {/* Kung may maling URL na tinype, ibabalik sa root (/). 
              Kung hindi login, automatic redirect ulit ito sa /login via ProtectedRoute */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;