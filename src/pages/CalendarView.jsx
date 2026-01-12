import React, { useState, useEffect } from 'react';
import './CalendarView.css';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { minutesToTime } from '../utils/timeUtils';
import { calculateProductivityMetrics } from '../utils/productivityCalculator';

function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState({});
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedDayActivities, setSelectedDayActivities] = useState([]);

  // Datos de ejemplo por fecha
  useEffect(() => {
    const sampleActivities = {
      '2024-01-08': [
        { id: 1, title: 'Reunión de equipo', startTime: '09:00', endTime: '10:00', category: 'reunion', completed: true },
        { id: 2, title: 'Desarrollo', startTime: '10:30', endTime: '12:00', category: 'desarrollo', completed: true },
        { id: 3, title: 'Code Review', startTime: '14:00', endTime: '15:00', category: 'revision', completed: true },
      ],
      '2024-01-09': [
        { id: 4, title: 'Planning Sprint', startTime: '09:00', endTime: '11:00', category: 'reunion', completed: true },
        { id: 5, title: 'Implementación', startTime: '11:30', endTime: '13:00', category: 'desarrollo', completed: true },
        { id: 6, title: 'Testing', startTime: '15:00', endTime: '16:30', category: 'testing', completed: false },
      ],
      '2024-01-10': [
        { id: 7, title: 'Documentación', startTime: '09:00', endTime: '10:30', category: 'documentacion', completed: true },
        { id: 8, title: 'Desarrollo feature', startTime: '11:00', endTime: '13:00', category: 'desarrollo', completed: true },
      ],
      '2024-01-11': [
        { id: 9, title: 'Reunión cliente', startTime: '10:00', endTime: '11:00', category: 'reunion', completed: true },
        { id: 10, title: 'Implementación API', startTime: '11:30', endTime: '14:00', category: 'desarrollo', completed: true },
        { id: 11, title: 'Testing integración', startTime: '14:30', endTime: '16:00', category: 'testing', completed: true },
      ],
      '2024-01-12': [
        { id: 12, title: 'Standup diario', startTime: '09:00', endTime: '09:30', category: 'reunion', completed: true },
        { id: 13, title: 'Desarrollo UI', startTime: '10:00', endTime: '12:00', category: 'desarrollo', completed: true },
        { id: 14, title: 'Code Review', startTime: '14:00', endTime: '15:00', category: 'revision', completed: false },
      ],
      '2024-01-15': [
        { id: 15, title: 'Reunión de arquitectura', startTime: '09:00', endTime: '10:30', category: 'reunion', completed: false },
        { id: 16, title: 'Refactoring', startTime: '11:00', endTime: '13:00', category: 'desarrollo', completed: false },
      ],
    };
    setActivities(sampleActivities);
  }, []);

  // Navegación de meses
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Generar días del calendario
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Obtener actividades de un día
  const getActivitiesForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return activities[dateKey] || [];
  };

  // Calcular métricas del día
  const getDayMetrics = (day) => {
    const dayActivities = getActivitiesForDay(day);
    if (dayActivities.length === 0) return null;

    const completed = dayActivities.filter(a => a.completed).length;
    const total = dayActivities.length;
    const completionRate = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      completionRate,
      hasActivities: true
    };
  };

  // Manejar click en día
  const handleDayClick = (day) => {
    setSelectedDate(day);
    const dayActivities = getActivitiesForDay(day);
    setSelectedDayActivities(dayActivities);
    if (dayActivities.length > 0) {
      setShowActivityModal(true);
    }
  };

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

  return (
    <div className="calendar-view">
      {/* Header del calendario */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>Calendario de Actividades</h2>
          <p className="calendar-subtitle">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="calendar-controls">
          <button className="btn-today" onClick={goToToday}>Hoy</button>
          <div className="month-navigation">
            <button className="nav-btn" onClick={prevMonth}>◀</button>
            <button className="nav-btn" onClick={nextMonth}>▶</button>
          </div>
          <button className="btn-primary">+ Nueva Actividad</button>
        </div>
      </div>

      {/* Leyenda de categorías */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }}></span>
          <span>Reuniones</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#10b981' }}></span>
          <span>Desarrollo</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }}></span>
          <span>Revisión</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#8b5cf6' }}></span>
          <span>Documentación</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ef4444' }}></span>
          <span>Testing</span>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="calendar-grid-container">
        {/* Días de la semana */}
        <div className="calendar-weekdays">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="weekday-label">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const dayActivities = getActivitiesForDay(day);
            const metrics = getDayMetrics(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayActivities.length > 0 ? 'has-activities' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="day-header">
                  <span className="day-number">{format(day, 'd')}</span>
                  {metrics && (
                    <span className={`day-badge ${metrics.completionRate >= 80 ? 'badge-success' : metrics.completionRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                      {metrics.completionRate}%
                    </span>
                  )}
                </div>

                <div className="day-activities">
                  {dayActivities.slice(0, 3).map((activity, idx) => (
                    <div
                      key={activity.id}
                      className="day-activity-item"
                      style={{ borderLeft: `3px solid ${getCategoryColor(activity.category)}` }}
                    >
                      <span className="activity-time">{activity.startTime}</span>
                      <span className="activity-title">{activity.title}</span>
                      {activity.completed && <span className="activity-check">✓</span>}
                    </div>
                  ))}
                  {dayActivities.length > 3 && (
                    <div className="more-activities">
                      +{dayActivities.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de actividades del día */}
      {showActivityModal && (
        <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Actividades del {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
              <button className="modal-close" onClick={() => setShowActivityModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedDayActivities.length === 0 ? (
                <p className="no-activities">No hay actividades programadas para este día</p>
              ) : (
                <div className="modal-activities-list">
                  {selectedDayActivities.map((activity) => (
                    <div key={activity.id} className="modal-activity-item">
                      <div
                        className="activity-indicator"
                        style={{ background: getCategoryColor(activity.category) }}
                      />
                      <div className="activity-details">
                        <div className="activity-header-row">
                          <h4>{activity.title}</h4>
                          <span className={`status-badge ${activity.completed ? 'completed' : 'pending'}`}>
                            {activity.completed ? '✅ Completada' : '⏳ Pendiente'}
                          </span>
                        </div>
                        <div className="activity-meta-row">
                          <span className="activity-time-range">
                            🕐 {activity.startTime} - {activity.endTime}
                          </span>
                          <span className="activity-category">
                            🏷️ {activity.category}
                          </span>
                        </div>
                      </div>
                      <div className="activity-actions">
                        <button className="action-btn-small">Editar</button>
                        <button className="action-btn-small">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary-modal" onClick={() => setShowActivityModal(false)}>
                Cerrar
              </button>
              <button className="btn-primary-modal">
                + Agregar Actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral con resumen */}
      <div className="calendar-sidebar">
        <div className="sidebar-section">
          <h3>Día Seleccionado</h3>
          <p className="selected-date-text">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          {(() => {
            const metrics = getDayMetrics(selectedDate);
            return metrics ? (
              <div className="day-summary">
                <div className="summary-stat">
                  <span className="stat-label">Actividades</span>
                  <span className="stat-value">{metrics.total}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Completadas</span>
                  <span className="stat-value">{metrics.completed}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Cumplimiento</span>
                  <span className="stat-value">{metrics.completionRate}%</span>
                </div>
              </div>
            ) : (
              <p className="no-data">Sin actividades programadas</p>
            );
          })()}
        </div>

        <div className="sidebar-section">
          <h3>Resumen del Mes</h3>
          <div className="month-summary">
            <div className="summary-stat">
              <span className="stat-label">Total de días con actividades</span>
              <span className="stat-value">{Object.keys(activities).length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total de actividades</span>
              <span className="stat-value">
                {Object.values(activities).reduce((sum, acts) => sum + acts.length, 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Próximas Actividades</h3>
          <div className="upcoming-activities">
            {Object.entries(activities)
              .filter(([date]) => new Date(date) >= new Date())
              .slice(0, 5)
              .map(([date, dayActivities]) => (
                <div key={date} className="upcoming-day">
                  <div className="upcoming-date">{format(new Date(date), 'd MMM', { locale: es })}</div>
                  <div className="upcoming-count">{dayActivities.length} actividades</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;