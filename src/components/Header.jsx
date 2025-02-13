// src/components/Header.jsx
import React from 'react';

const Header = ({ children }) => {
  return (
    <h1 className="text-3xl font-bold mb-4 text-center">{children}</h1>
  );
};

export default Header;
