import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children, activeView, setActiveView }) {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;