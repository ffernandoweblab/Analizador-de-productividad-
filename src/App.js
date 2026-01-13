import React, { useState } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Calendar from './pages/CalendarView';
import TeamView from './pages/TeamView';
// import DataExplorer from './components/activities/DataExplorer';
import ProductivityDashboard from './components/activities/ProductivityDashboard';
import ProductividadDiaria from './pages/ProductividadDiaria';


function App() {
  const [activeView, setActiveView] = useState('Dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'productividad':
        return <ProductivityDashboard />;
      case 'team':
        return <TeamView />;
      case 'activities':
        return <Activities />;
      case 'reportes':
        return <Reports />;
      case 'calendar':
        return <Calendar />;
      case 'Productividad':
        return <ProductividadDiaria/>;
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