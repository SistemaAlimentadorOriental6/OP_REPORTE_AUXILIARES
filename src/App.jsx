// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginScreen from './pages/LoginScreen'; 
import Dashboard from './pages/Dashboard';
import MapaEmpleados from './pages/MapaScreen';
import DataVisualization from './pages/DatosScreen';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/maps" element={
          <ProtectedRoute>
            <MapaEmpleados />
          </ProtectedRoute>
        } />
        <Route path="/datos" element={
          <ProtectedRoute>
            <DataVisualization />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
