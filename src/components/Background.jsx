// src/components/Background.jsx
import React from 'react';

const Background = ({ children, className }) => {
  return (
    <div className={`bg-gray-300 bg-white-100 text-gray-700 p-6 rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Background;
