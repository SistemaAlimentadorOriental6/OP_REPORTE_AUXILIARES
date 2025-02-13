// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StartScreen from './pages/StartScreen';
import LoginScreen from './pages/LoginScreen'; 
import Dashboard from './pages/Dashboard';
import MapaEmpleados from './pages/MapaScreen';
import DataVisualization from './pages/DatosScreen';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/maps" element={<MapaEmpleados/>}/>
        <Route path="/datos" element={<DataVisualization/>}/>
      </Routes>
    </Router>
  );
};

export default App;
