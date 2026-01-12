import React from 'react';
import './Header.css';
import { useTheme } from '../../context/ThemeContext';

function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">📊 Analizador de Productividad</h1>
        <div className="header-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn-secondary">Configuración</button>
          <div className="user-info">
            <span className="user-name">Usuario</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;