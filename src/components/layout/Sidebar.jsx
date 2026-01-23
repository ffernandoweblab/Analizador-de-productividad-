import React from 'react';
import './Sidebar.css';

function Sidebar({ activeView, setActiveView }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'productividad', label: 'Productividad', icon: '📈' },
    // { id: 'team', label: 'Equipo', icon: '👥' },
    // { id: 'activities', label: 'Actividades', icon: '📋' },
    { id: 'reportes', label: 'Reportes', icon: '📊' },
    // { id: 'calenda r', label: 'Calendario', icon: '📅' },
    // { id: 'Productividad', label: 'Informe dia hoy ', icon: '📅' },

    // { id: 'pred  icciondiaria', label: 'Prediccion', icon: '📅' },
    // { id: "predicciondiaria1", label: "Predicción", icon: "🤖" },
    { id: "prediccionhoy", label: "Informe de hoy", icon: "🤖" },
    { id: "rodrigo", label: "Historico Productividad", icon: "🤖" },
    { id: "pruebadefecha", label: "prueba de fecha", icon: "🤖" },
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