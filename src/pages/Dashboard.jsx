import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { calculateProductivityMetrics, interpretProductivity, identifyPatterns } from '../utils/productivityCalculator';
import { minutesToTime } from '../utils/timeUtils';

function Dashboard() {
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [patterns, setPatterns] = useState([]);

  // Datos de ejemplo para probar
  useEffect(() => {
    const sampleActivities = [
      {
        id: 1,
        title: 'Reunión de equipo',
        startTime: '2024-01-12T09:00:00',
        endTime: '2024-01-12T10:00:00',
        plannedDuration: 60,
        actualDuration: 65,
        completed: true,
      },
      {
        id: 2,
        title: 'Desarrollo de funcionalidad',
        startTime: '2024-01-12T10:15:00',
        endTime: '2024-01-12T12:00:00',
        plannedDuration: 105,
        actualDuration: 105,
        completed: true,
      },
      {
        id: 3,
        title: 'Revisión de código',
        startTime: '2024-01-12T13:00:00',
        endTime: '2024-01-12T14:30:00',
        plannedDuration: 90,
        actualDuration: 0,
        completed: false,
      },
      {
        id: 4,
        title: 'Documentación',
        startTime: '2024-01-12T14:30:00',
        endTime: '2024-01-12T15:00:00',
        plannedDuration: 30,
        actualDuration: 30,
        completed: true,
      },
    ];

    setActivities(sampleActivities);

    const calculatedMetrics = calculateProductivityMetrics(sampleActivities);
    setMetrics(calculatedMetrics);

    const productivityLevel = interpretProductivity(calculatedMetrics);
    setProductivity(productivityLevel);

    const detectedPatterns = identifyPatterns(sampleActivities);
    setPatterns(detectedPatterns);
  }, []);

  if (!metrics || !productivity) {
    return <div className="loading">Cargando métricas...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard de Productividad</h2>
        <p className="dashboard-date">
          {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"></div>
          <div className="metric-content">
            <h3>Tiempo Planeado</h3>
            <p className="metric-value">{minutesToTime(metrics.totalPlanned)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"></div>
          <div className="metric-content">
            <h3>Tiempo Completado</h3>
            <p className="metric-value">{minutesToTime(metrics.totalCompleted)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
          </div>
          <div className="metric-content">
            <h3>Tasa de Cumplimiento</h3>
            <p className="metric-value">{metrics.completionRate}%</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"></div>
          <div className="metric-content">
            <h3>Tareas a Tiempo</h3>
            <p className="metric-value">{metrics.onTimeRate}%</p>
          </div>
        </div>
      </div>

      {/* Evaluación de productividad */}
      <div className="productivity-summary" style={{ borderLeft: `4px solid ${productivity.color}` }}>
        <div className="productivity-header">
          <h3>Evaluación del Día</h3>
          <span className="productivity-badge" style={{ background: productivity.color }}>
            {productivity.level.toUpperCase()}
          </span>
        </div>
        <p className="productivity-message">{productivity.message}</p>
        <div className="productivity-stats">
          <span>📋 {metrics.totalActivities} actividades totales</span>
          <span>✅ {metrics.completedActivities} completadas</span>
        </div>
      </div>

      {/* Patrones detectados */}
      {patterns.length > 0 && (
        <div className="patterns-section">
          <h3>Patrones Detectados</h3>
          <div className="patterns-list">
            {patterns.map((pattern, index) => (
              <div key={index} className={`pattern-item pattern-${pattern.severity}`}>
                <span className="pattern-icon">
                  {pattern.severity === 'alert' && '⚠️'}
                  {pattern.severity === 'warning' && '⚡'}
                  {pattern.severity === 'info' && 'ℹ️'}
                </span>
                <p className="pattern-message">{pattern.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de actividades */}
      <div className="activities-section">
        <h3>Actividades del Día</h3>
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-time">
                {new Date(activity.startTime).toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <div className="activity-meta">
                  <span>Planeado: {minutesToTime(activity.plannedDuration)}</span>
                  {activity.completed && (
                    <span>Real: {minutesToTime(activity.actualDuration)}</span>
                  )}
                  <span className={`activity-status ${activity.completed ? 'completed' : 'pending'}`}>
                    {activity.completed ? '✅ Completada' : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;