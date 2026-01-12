import React from 'react';
import './Sidebar.css';

function Sidebar({ activeView, setActiveView }) {
  const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'team', label: 'Equipo', icon: '👥' },
  { id: 'activities', label: 'Actividades', icon: '📋' },
  { id: 'reports', label: 'Reportes', icon: '📈' },
  { id: 'calendar', label: 'Calendario', icon: '📅' },
];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;