import React, { useState } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Calendar from './pages/CalendarView';
import TeamView from './pages/TeamView';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'team':
        return <TeamView />;
      case 'activities':
            return <Activities />;
      case 'reportes':
        return <Reports />;
      case 'calendar':
        return <Calendar/>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </Layout>
  );
}

export default App;