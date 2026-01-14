import React, { useState } from 'react';
import './App.css';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
// import Activities from './pages/Activities';
// import Reports from './pages/Reports';
// import Calendar from './pages/CalendarView';
// import TeamView from './pages/TeamView';
// import DataExplorer from './components/activities/DataExplorer';


// //22
import ProductivityDashboard from './components/activities/ProductivityDashboard';
import ProductividadDiaria from './pages/ProductividadDiaria';
import ReportesDiarios from './pages/ReportesDiarios';
// //22
// import ProductivityReport from './components/activities/ProductivityReport';
import PrediccionProductividad from './pages/PrediccionProductividad';
function App() {
  const [activeView, setActiveView] = useState('Dashboard');

  const renderView = () => {  
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;



        case 'predicciondiaria':
        return <PrediccionProductividad />;
        

        
      case 'productividad':
        //https://wlserver-production.up.railway.app/api/actividades
        //
        return <ProductivityDashboard />;
           
      // case 'team':
      //   return <TeamView />;
      // case 'activities':
      //   return <Activities />;
  // //2
      case 'reportes':
        //proporciona cuantas actv se realizaron al dia cuantas se terminaron y revisiones
        //https://wlserver-production.up.railway.app/api/reportes/custom?start=${start}&end=${end}
        return <ReportesDiarios />;
  //       //2
      // case 'calendar':
      //   return <Calendar />;
      //3
      case 'Productividad':
        //productividad del dia sobre que realizo cada uno 
        //https://wlserver-production.up.railway.app/api/reportes/resumen?period=dia
        return <ProductividadDiaria/>;
      //   //3
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