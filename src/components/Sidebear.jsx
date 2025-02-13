import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-200 p-4 center">
      <ul>
        <li><a href="/dashboard" className="block p-2">Dashboard</a></li>
        {/* Add more links here */}
      </ul>
    </aside>
  );
};

export default Sidebar;
