// src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ goBack }) => {
  const navigate = useNavigate();
  return (
    <button onClick={goBack} className="text-green-500">
      &larr; Volver
    </button>
  );
};

export default BackButton;
