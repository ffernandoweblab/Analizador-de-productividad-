import React, { useState, useEffect } from 'react';
import './TeamView.css';
import { calculateProductivityMetrics, interpretProductivity } from '../utils/productivityCalculator';
import { minutesToTime } from '../utils/timeUtils';

function TeamView() {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    // Datos de ejemplo del equipo con casos variados
    const sampleTeamData = [
      {
        id: 1,
        name: 'Juan Pérez',
        position: 'Desarrollador Senior',
        department: 'Desarrollo',
        email: 'juan.perez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2400,
          totalCompleted: 2280,
          completionRate: 95,
          totalActivities: 42,
          completedActivities: 40,
          productivityLevel: 'excelente',
          onTimeRate: 95
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 95, activitiesCount: 8 },
          { day: 'Mar', completionRate: 96, activitiesCount: 9 },
          { day: 'Mié', completionRate: 94, activitiesCount: 8 },
          { day: 'Jue', completionRate: 95, activitiesCount: 9 },
          { day: 'Vie', completionRate: 95, activitiesCount: 8 }
        ]
      },
      {
        id: 2,
        name: 'María González',
        position: 'Diseñadora UX/UI',
        department: 'Diseño',
        email: 'maria.gonzalez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2200,
          totalCompleted: 2000,
          completionRate: 91,
          totalActivities: 38,
          completedActivities: 36,
          productivityLevel: 'excelente',
          onTimeRate: 92
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 92, activitiesCount: 7 },
          { day: 'Mar', completionRate: 90, activitiesCount: 8 },
          { day: 'Mié', completionRate: 91, activitiesCount: 8 },
          { day: 'Jue', completionRate: 90, activitiesCount: 8 },
          { day: 'Vie', completionRate: 92, activitiesCount: 7 }
        ]
      },
      {
        id: 3,
        name: 'Carlos Ramírez',
        position: 'Desarrollador Frontend',
        department: 'Desarrollo',
        email: 'carlos.ramirez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2300,
          totalCompleted: 1610,
          completionRate: 70,
          totalActivities: 40,
          completedActivities: 30,
          productivityLevel: 'regular',
          onTimeRate: 75
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 68, activitiesCount: 8 },
          { day: 'Mar', completionRate: 72, activitiesCount: 8 },
          { day: 'Mié', completionRate: 70, activitiesCount: 8 },
          { day: 'Jue', completionRate: 71, activitiesCount: 8 },
          { day: 'Vie', completionRate: 69, activitiesCount: 8 }
        ]
      },
      {
        id: 4,
        name: 'Ana Martínez',
        position: 'QA Tester',
        department: 'Testing',
        email: 'ana.martinez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2100,
          totalCompleted: 1050,
          completionRate: 50,
          totalActivities: 45,
          completedActivities: 23,
          productivityLevel: 'bajo',
          onTimeRate: 51
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 52, activitiesCount: 9 },
          { day: 'Mar', completionRate: 48, activitiesCount: 9 },
          { day: 'Mié', completionRate: 50, activitiesCount: 9 },
          { day: 'Jue', completionRate: 51, activitiesCount: 9 },
          { day: 'Vie', completionRate: 49, activitiesCount: 9 }
        ]
      },
      {
        id: 5,
        name: 'Luis Hernández',
        position: 'Desarrollador Backend',
        department: 'Desarrollo',
        email: 'luis.hernandez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2500,
          totalCompleted: 2200,
          completionRate: 88,
          totalActivities: 44,
          completedActivities: 40,
          productivityLevel: 'productivo',
          onTimeRate: 91
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 86, activitiesCount: 9 },
          { day: 'Mar', completionRate: 90, activitiesCount: 9 },
          { day: 'Mié', completionRate: 88, activitiesCount: 8 },
          { day: 'Jue', completionRate: 89, activitiesCount: 9 },
          { day: 'Vie', completionRate: 87, activitiesCount: 9 }
        ]
      },
      {
        id: 6,
        name: 'Sofía Torres',
        position: 'Product Manager',
        department: 'Producto',
        email: 'sofia.torres@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2000,
          totalCompleted: 600,
          completionRate: 30,
          totalActivities: 35,
          completedActivities: 11,
          productivityLevel: 'critico',
          onTimeRate: 31
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 32, activitiesCount: 7 },
          { day: 'Mar', completionRate: 28, activitiesCount: 7 },
          { day: 'Mié', completionRate: 30, activitiesCount: 7 },
          { day: 'Jue', completionRate: 31, activitiesCount: 7 },
          { day: 'Vie', completionRate: 29, activitiesCount: 7 }
        ]
      },
      {
        id: 7,
        name: 'Diego Vargas',
        position: 'DevOps Engineer',
        department: 'Infraestructura',
        email: 'diego.vargas@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2250,
          totalCompleted: 2100,
          completionRate: 93,
          totalActivities: 39,
          completedActivities: 37,
          productivityLevel: 'excelente',
          onTimeRate: 95
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 95, activitiesCount: 8 },
          { day: 'Mar', completionRate: 92, activitiesCount: 8 },
          { day: 'Mié', completionRate: 93, activitiesCount: 8 },
          { day: 'Jue', completionRate: 94, activitiesCount: 8 },
          { day: 'Vie', completionRate: 91, activitiesCount: 7 }
        ]
      },
      {
        id: 8,
        name: 'Laura Jiménez',
        position: 'Scrum Master',
        department: 'Gestión',
        email: 'laura.jimenez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 1900,
          totalCompleted: 1140,
          completionRate: 60,
          totalActivities: 36,
          completedActivities: 22,
          productivityLevel: 'bajo',
          onTimeRate: 61
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 61, activitiesCount: 7 },
          { day: 'Mar', completionRate: 59, activitiesCount: 7 },
          { day: 'Mié', completionRate: 60, activitiesCount: 7 },
          { day: 'Jue', completionRate: 62, activitiesCount: 8 },
          { day: 'Vie', completionRate: 58, activitiesCount: 7 }
        ]
      },
      {
        id: 9,
        name: 'Roberto Sánchez',
        position: 'Desarrollador Full Stack',
        department: 'Desarrollo',
        email: 'roberto.sanchez@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2350,
          totalCompleted: 1880,
          completionRate: 80,
          totalActivities: 41,
          completedActivities: 34,
          productivityLevel: 'regular',
          onTimeRate: 83
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 78, activitiesCount: 8 },
          { day: 'Mar', completionRate: 82, activitiesCount: 8 },
          { day: 'Mié', completionRate: 80, activitiesCount: 8 },
          { day: 'Jue', completionRate: 81, activitiesCount: 9 },
          { day: 'Vie', completionRate: 79, activitiesCount: 8 }
        ]
      },
      {
        id: 10,
        name: 'Patricia Morales',
        position: 'Analista de Datos',
        department: 'Análisis',
        email: 'patricia.morales@empresa.com',
        weeklyMetrics: {
          totalPlanned: 2150,
          totalCompleted: 430,
          completionRate: 20,
          totalActivities: 38,
          completedActivities: 8,
          productivityLevel: 'critico',
          onTimeRate: 21
        },
        dailyBreakdown: [
          { day: 'Lun', completionRate: 22, activitiesCount: 8 },
          { day: 'Mar', completionRate: 18, activitiesCount: 8 },
          { day: 'Mié', completionRate: 20, activitiesCount: 7 },
          { day: 'Jue', completionRate: 21, activitiesCount: 8 },
          { day: 'Vie', completionRate: 19, activitiesCount: 7 }
        ]
      }
    ];

    setTeamData(sampleTeamData);
  }, []);

  const departments = ['all', 'Desarrollo', 'Diseño', 'Testing', 'Producto', 'Infraestructura', 'Gestión', 'Análisis'];

  const filteredTeam = filterDepartment === 'all' 
    ? teamData 
    : teamData.filter(emp => emp.department === filterDepartment);

  const getProductivityColor = (rate) => {
    if (rate >= 90) return '#10b981'; // Verde - Excelente
    if (rate >= 85) return '#22c55e'; // Verde claro - Muy bueno
    if (rate >= 70) return '#f59e0b'; // Amarillo - Regular
    if (rate >= 50) return '#f97316'; // Naranja - Bajo
    return '#ef4444'; // Rojo - Crítico
  };

  const getProductivityLabel = (rate) => {
    if (rate >= 90) return 'Excelente';
    if (rate >= 85) return 'Muy Bueno';
    if (rate >= 70) return 'Aceptable';
    if (rate >= 50) return 'Bajo';
    return 'Crítico';
  };

  // Calcular estadísticas generales del equipo
  const teamStats = {
    totalEmployees: filteredTeam.length,
    avgCompletionRate: Math.round(
      filteredTeam.reduce((sum, emp) => sum + emp.weeklyMetrics.completionRate, 0) / filteredTeam.length
    ),
    highPerformers: filteredTeam.filter(emp => emp.weeklyMetrics.completionRate >= 85).length,
    needsAttention: filteredTeam.filter(emp => emp.weeklyMetrics.completionRate < 70).length,
    totalActivities: filteredTeam.reduce((sum, emp) => sum + emp.weeklyMetrics.totalActivities, 0),
    completedActivities: filteredTeam.reduce((sum, emp) => sum + emp.weeklyMetrics.completedActivities, 0)
  };

  return (
    <div className="team-view">
      {/* Header */}
      <div className="team-header">
        <div>
          <h2>Gestión de Equipo</h2>
          <p className="team-subtitle">Monitoreo de productividad del equipo</p>
        </div>
        <div className="team-actions">
          <select 
            className="department-filter"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'Todos los Departamentos' : dept}
              </option>
            ))}
          </select>
          <div className="view-toggle-buttons">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📊 Tarjetas
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📋 Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales del equipo */}
      <div className="team-stats-overview">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Total Empleados</span>
            <span className="stat-value">{teamStats.totalEmployees}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Promedio de Cumplimiento</span>
            <span className="stat-value">{teamStats.avgCompletionRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Alto Rendimiento</span>
            <span className="stat-value">{teamStats.highPerformers}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Necesita Atención</span>
            <span className="stat-value">{teamStats.needsAttention}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <span className="stat-label">Actividades Completadas</span>
            <span className="stat-value">{teamStats.completedActivities}/{teamStats.totalActivities}</span>
          </div>
        </div>
      </div>

      {/* Vista de tarjetas (Grid) */}
      {viewMode === 'grid' && (
        <div className="team-grid">
          {filteredTeam.map((employee) => (
            <div 
              key={employee.id} 
              className="employee-card"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="employee-card-header">
                <div className="employee-avatar">
                  <div className="avatar-placeholder"></div>
                </div>
                <div className="employee-info">
                  <h3>{employee.name}</h3>
                  <p className="employee-position">{employee.position}</p>
                  <span className="employee-department">{employee.department}</span>
                </div>
              </div>

              <div className="employee-metrics">
                <div className="metric-row">
                  <span className="metric-label">Cumplimiento Semanal</span>
                  <div className="metric-value-container">
                    <span 
                      className="metric-value-large"
                      style={{ color: getProductivityColor(employee.weeklyMetrics.completionRate) }}
                    >
                      {employee.weeklyMetrics.completionRate}%
                    </span>
                    <span 
                      className="productivity-badge"
                      style={{ background: getProductivityColor(employee.weeklyMetrics.completionRate) }}
                    >
                      {getProductivityLabel(employee.weeklyMetrics.completionRate)}
                    </span>
                  </div>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Actividades</span>
                  <span className="metric-value">
                    {employee.weeklyMetrics.completedActivities}/{employee.weeklyMetrics.totalActivities}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Tiempo Trabajado</span>
                  <span className="metric-value">
                    {minutesToTime(employee.weeklyMetrics.totalCompleted)}
                  </span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Puntualidad</span>
                  <span className="metric-value">
                    {employee.weeklyMetrics.onTimeRate}%
                  </span>
                </div>
              </div>

              {/* Mini gráfica de tendencia semanal */}
              <div className="weekly-trend">
                <span className="trend-label">Tendencia Semanal</span>
                <div className="trend-bars">
                  {employee.dailyBreakdown.map((day, index) => (
                    <div key={index} className="trend-bar-container">
                      <div 
                        className="trend-bar"
                        style={{ 
                          height: `${day.completionRate}%`,
                          background: getProductivityColor(day.completionRate)
                        }}
                        title={`${day.day}: ${day.completionRate}%`}
                      />
                      <span className="trend-day-label">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="view-details-btn">
                Ver Detalles →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vista de tabla */}
      {viewMode === 'table' && (
        <div className="team-table-container">
          <table className="team-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Actividades</th>
                <th>Completadas</th>
                <th>Tiempo Trabajado</th>
                <th>Cumplimiento</th>
                <th>Puntualidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="table-employee-cell">
                      <div className="table-avatar">
                        <div className="avatar-placeholder-small"></div>
                      </div>
                      <div>
                        <div className="table-employee-name">{employee.name}</div>
                        <div className="table-employee-position">{employee.position}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.department}</td>
                  <td>{employee.weeklyMetrics.totalActivities}</td>
                  <td>{employee.weeklyMetrics.completedActivities}</td>
                  <td>{minutesToTime(employee.weeklyMetrics.totalCompleted)}</td>
                  <td>
                    <div className="table-completion-cell">
                      <div className="completion-bar-container">
                        <div 
                          className="completion-bar"
                          style={{ 
                            width: `${employee.weeklyMetrics.completionRate}%`,
                            background: getProductivityColor(employee.weeklyMetrics.completionRate)
                          }}
                        />
                      </div>
                      <span className="completion-percentage">
                        {employee.weeklyMetrics.completionRate}%
                      </span>
                    </div>
                  </td>
                  <td>{employee.weeklyMetrics.onTimeRate}%</td>
                  <td>
                    <span 
                      className="table-status-badge"
                      style={{ background: getProductivityColor(employee.weeklyMetrics.completionRate) }}
                    >
                      {getProductivityLabel(employee.weeklyMetrics.completionRate)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="table-action-btn"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles del empleado */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-content employee-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="employee-modal-header">
                <div className="employee-avatar-large">
                  <div className="avatar-placeholder-large"></div>
                </div>
                <div>
                  <h3>{selectedEmployee.name}</h3>
                  <p>{selectedEmployee.position}</p>
                  <span className="modal-department">{selectedEmployee.department}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Métricas Semanales</h4>
                <div className="detail-metrics-grid">
                  <div className="detail-metric">
                    <span className="detail-metric-label">Cumplimiento</span>
                    <span className="detail-metric-value" style={{ color: getProductivityColor(selectedEmployee.weeklyMetrics.completionRate) }}>
                      {selectedEmployee.weeklyMetrics.completionRate}%
                    </span>
                  </div>
                  <div className="detail-metric">
                    <span className="detail-metric-label">Actividades Totales</span>
                    <span className="detail-metric-value">{selectedEmployee.weeklyMetrics.totalActivities}</span>
                  </div>
                  <div className="detail-metric">
                    <span className="detail-metric-label">Completadas</span>
                    <span className="detail-metric-value">{selectedEmployee.weeklyMetrics.completedActivities}</span>
                  </div>
                  <div className="detail-metric">
                    <span className="detail-metric-label">Puntualidad</span>
                    <span className="detail-metric-value">{selectedEmployee.weeklyMetrics.onTimeRate}%</span>
                  </div>
                  <div className="detail-metric">
                    <span className="detail-metric-label">Tiempo Planeado</span>
                    <span className="detail-metric-value">{minutesToTime(selectedEmployee.weeklyMetrics.totalPlanned)}</span>
                  </div>
                  <div className="detail-metric">
                    <span className="detail-metric-label">Tiempo Trabajado</span>
                    <span className="detail-metric-value">{minutesToTime(selectedEmployee.weeklyMetrics.totalCompleted)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Desglose Diario</h4>
                <div className="daily-breakdown-list">
                  {selectedEmployee.dailyBreakdown.map((day, index) => (
                    <div key={index} className="daily-item">
                      <span className="daily-day">{day.day}</span>
                      <div className="daily-bar-container">
                        <div 
                          className="daily-bar"
                          style={{ 
                            width: `${day.completionRate}%`,
                            background: getProductivityColor(day.completionRate)
                          }}
                        />
                      </div>
                      <span className="daily-percentage">{day.completionRate}%</span>
                      <span className="daily-activities">{day.activitiesCount} actividades</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Información de Contacto</h4>
                <p className="contact-info">📧 {selectedEmployee.email}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary-modal" onClick={() => setSelectedEmployee(null)}>
                Cerrar
              </button>
              <button className="btn-primary-modal">
                Ver Calendario Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamView;