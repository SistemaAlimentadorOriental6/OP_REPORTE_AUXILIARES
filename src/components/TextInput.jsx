import React from 'react';

const TextInput = ({ placeholder, value, onChange, error, errorText, type, readOnly }) => {
  return (
    <div className="mb-4">
      <input
        type={type || 'text'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}  
        readOnly={readOnly}
        className={`shadow-sm border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500 ${error ? 'border-red-500' : ''}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{errorText}</p>}
    </div>
  );
};

export default TextInput;
