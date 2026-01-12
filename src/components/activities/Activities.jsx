import React, { useState, useEffect } from 'react';
import './Activities.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { classifyActivity } from '../utils/productivityCalculator';
import { minutesToTime } from '../utils/timeUtils';

function Activities() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'timeline'

  // Datos de ejemplo (más adelante esto vendrá de una API)
  useEffect(() => {
    const sampleActivities = [
      {
        id: 1,
        title: 'Reunión de equipo',
        description: 'Planificación del sprint',
        startTime: '2024-01-12T09:00:00',
        endTime: '2024-01-12T10:00:00',
        plannedDuration: 60,
        actualDuration: 65,
        completed: true,
        category: 'reunion',
        priority: 'alta'
      },
      {
        id: 2,
        title: 'Desarrollo de funcionalidad',
        description: 'Implementar sistema de análisis',
        startTime: '2024-01-12T10:15:00',
        endTime: '2024-01-12T12:00:00',
        plannedDuration: 105,
        actualDuration: 105,
        completed: true,
        category: 'desarrollo',
        priority: 'alta'
      },
      {
        id: 3,
        title: 'Revisión de código',
        description: 'Code review del módulo de reportes',
        startTime: '2024-01-12T13:00:00',
        endTime: '2024-01-12T14:30:00',
        plannedDuration: 90,
        actualDuration: 0,
        completed: false,
        category: 'revision',
        priority: 'media'
      },
      {
        id: 4,
        title: 'Documentación',
        description: 'Actualizar README del proyecto',
        startTime: '2024-01-12T14:30:00',
        endTime: '2024-01-12T15:00:00',
        plannedDuration: 30,
        actualDuration: 30,
        completed: true,
        category: 'documentacion',
        priority: 'baja'
      },
      {
        id: 5,
        title: 'Testing',
        description: 'Pruebas unitarias del módulo',
        startTime: '2024-01-12T15:30:00',
        endTime: '2024-01-12T16:30:00',
        plannedDuration: 60,
        actualDuration: 0,
        completed: false,
        category: 'testing',
        priority: 'media'
      }
    ];
    setActivities(sampleActivities);
  }, [selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Aquí cargarías las actividades de esa fecha
  };

  const filteredActivities = activities.filter(activity => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return activity.completed;
    if (filterStatus === 'pending') return !activity.completed;
    return true;
  });

  const getCategoryColor = (category) => {
    const colors = {
      reunion: '#3b82f6',
      desarrollo: '#10b981',
      revision: '#f59e0b',
      documentacion: '#8b5cf6',
      testing: '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      alta: { text: 'Alta', color: '#ef4444' },
      media: { text: 'Media', color: '#f59e0b' },
      baja: { text: 'Baja', color: '#10b981' }
    };
    return badges[priority] || badges.media;
  };

  return (
    <div className="activities-page">
      <div className="activities-header">
        <div>
          <h2>Actividades</h2>
          <p className="activities-subtitle">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <button className="btn-primary">+ Nueva Actividad</button>
      </div>

      <div className="activities-layout">
        {/* Sidebar con calendario */}
        <aside className="activities-sidebar">
          <div className="calendar-container">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              locale="es-ES"
            />
          </div>

          <div className="quick-stats">
            <h3>Resumen</h3>
            <div className="stat-item">
              <span className="stat-label">Total</span>
              <span className="stat-value">{activities.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completadas</span>
              <span className="stat-value">
                {activities.filter(a => a.completed).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">
                {activities.filter(a => !a.completed).length}
              </span>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="activities-main">
          {/* Controles de filtro y vista */}
          <div className="activities-controls">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Todas ({activities.length})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completadas ({activities.filter(a => a.completed).length})
              </button>
              <button
                className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pendientes ({activities.filter(a => !a.completed).length})
              </button>
            </div>

            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista de lista"
              >
                📋
              </button>
              <button
                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title="Vista de línea de tiempo"
              >
                📅
              </button>
            </div>
          </div>

          {/* Lista o Timeline de actividades */}
          {viewMode === 'list' ? (
            <div className="activities-list-view">
              {filteredActivities.length === 0 ? (
                <div className="empty-state">
                  <p>No hay actividades para mostrar</p>
                </div>
              ) : (
                filteredActivities.map((activity) => {
                  const classification = classifyActivity(activity);
                  const priorityBadge = getPriorityBadge(activity.priority);
                  
                  return (
                    <div key={activity.id} className="activity-card">
                      <div
                        className="activity-indicator"
                        style={{ background: getCategoryColor(activity.category) }}
                      />
                      
                      <div className="activity-card-content">
                        <div className="activity-card-header">
                          <div>
                            <h3 className="activity-card-title">{activity.title}</h3>
                            <p className="activity-card-description">
                              {activity.description}
                            </p>
                          </div>
                          <div className="activity-card-badges">
                            <span
                              className="priority-badge"
                              style={{ background: priorityBadge.color }}
                            >
                              {priorityBadge.text}
                            </span>
                            <span className={`status-badge status-${classification}`}>
                              {classification}
                            </span>
                          </div>
                        </div>

                        <div className="activity-card-details">
                          <div className="detail-item">
                            <span className="detail-icon">🕐</span>
                            <span className="detail-text">
                              {new Date(activity.startTime).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {' - '}
                              {new Date(activity.endTime).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="detail-item">
                            <span className="detail-icon">⏱️</span>
                            <span className="detail-text">
                              Planeado: {minutesToTime(activity.plannedDuration)}
                            </span>
                          </div>

                          {activity.completed && (
                            <div className="detail-item">
                              <span className="detail-icon">✅</span>
                              <span className="detail-text">
                                Real: {minutesToTime(activity.actualDuration)}
                              </span>
                            </div>
                          )}

                          <div className="detail-item">
                            <span className="detail-icon">🏷️</span>
                            <span className="detail-text">{activity.category}</span>
                          </div>
                        </div>

                        <div className="activity-card-actions">
                          <button className="action-btn">Editar</button>
                          <button className="action-btn">Eliminar</button>
                          {!activity.completed && (
                            <button className="action-btn action-btn-primary">
                              Marcar como completada
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="activities-timeline-view">
              <div className="timeline">
                {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => (
                  <div key={hour} className="timeline-hour">
                    <div className="timeline-hour-label">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="timeline-hour-content">
                      {filteredActivities
                        .filter(activity => 
                          new Date(activity.startTime).getHours() === hour
                        )
                        .map(activity => (
                          <div
                            key={activity.id}
                            className="timeline-activity"
                            style={{
                              background: getCategoryColor(activity.category),
                              height: `${(activity.plannedDuration / 60) * 60}px`
                            }}
                          >
                            <span className="timeline-activity-title">
                              {activity.title}
                            </span>
                            <span className="timeline-activity-time">
                              {minutesToTime(activity.plannedDuration)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Activities;