import React, { useState, useEffect } from 'react';
import './Reports.css';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { calculateProductivityMetrics, interpretProductivity } from '../utils/productivityCalculator';
import { minutesToTime } from '../utils/timeUtils';

function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week', 'month', 'custom'
  const [comparisonMode, setComparisonMode] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Datos de ejemplo para reportes
    const generateReportData = () => {
      // Datos por día de la semana
      const weeklyData = [
        {
          day: 'Lun',
          date: '2024-01-08',
          totalPlanned: 480,
          totalCompleted: 420,
          completionRate: 87,
          activitiesCount: 8,
          productivityLevel: 'productivo'
        },
        {
          day: 'Mar',
          date: '2024-01-09',
          totalPlanned: 450,
          totalCompleted: 380,
          completionRate: 84,
          activitiesCount: 7,
          productivityLevel: 'productivo'
        },
        {
          day: 'Mié',
          date: '2024-01-10',
          totalPlanned: 420,
          totalCompleted: 280,
          completionRate: 67,
          activitiesCount: 6,
          productivityLevel: 'regular'
        },
        {
          day: 'Jue',
          date: '2024-01-11',
          totalPlanned: 510,
          totalCompleted: 460,
          completionRate: 90,
          activitiesCount: 9,
          productivityLevel: 'productivo'
        },
        {
          day: 'Vie',
          date: '2024-01-12',
          totalPlanned: 390,
          totalCompleted: 320,
          completionRate: 82,
          activitiesCount: 7,
          productivityLevel: 'productivo'
        }
      ];

      // Distribución por categoría
      const categoryData = [
        { name: 'Reuniones', value: 25, minutes: 600 },
        { name: 'Desarrollo', value: 40, minutes: 960 },
        { name: 'Revisión', value: 15, minutes: 360 },
        { name: 'Documentación', value: 10, minutes: 240 },
        { name: 'Testing', value: 10, minutes: 240 }
      ];

      // Productividad por hora del día
      const hourlyData = [
        { hour: '08:00', productivity: 65 },
        { hour: '09:00', productivity: 78 },
        { hour: '10:00', productivity: 85 },
        { hour: '11:00', productivity: 82 },
        { hour: '12:00', productivity: 70 },
        { hour: '13:00', productivity: 60 },
        { hour: '14:00', productivity: 75 },
        { hour: '15:00', productivity: 88 },
        { hour: '16:00', productivity: 90 },
        { hour: '17:00', productivity: 80 }
      ];

      // Resumen general
      const summary = {
        totalDays: 5,
        avgCompletionRate: 82,
        totalActivities: 37,
        completedActivities: 31,
        totalPlannedMinutes: 2250,
        totalCompletedMinutes: 1860,
        bestDay: 'Jueves',
        worstDay: 'Miércoles',
        mostProductiveHour: '16:00',
        recommendations: [
          'Tu mejor horario es entre 15:00 y 17:00. Considera programar tareas importantes en este rango.',
          'Los miércoles muestran menor productividad. Revisa si hay interrupciones recurrentes.',
          'Excelente tasa de cumplimiento general (82%). Mantén este ritmo.'
        ]
      };

      return {
        weeklyData,
        categoryData,
        hourlyData,
        summary
      };
    };

    setReportData(generateReportData());
  }, [selectedPeriod]);

  if (!reportData) {
    return <div className="loading">Generando reporte...</div>;
  }

  const COLORS = ['#667eea', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h2>Reportes y Análisis</h2>
          <p className="reports-subtitle">Análisis detallado de tu productividad</p>
        </div>
        <div className="reports-actions">
          <select 
            className="period-selector"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="custom">Personalizado</option>
          </select>
          <button className="btn-export">📥 Exportar PDF</button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="executive-summary">
        <h3>Resumen Ejecutivo</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-label">Tasa de Cumplimiento</span>
              <span className="summary-value">{reportData.summary.avgCompletionRate}%</span>
              <span className="summary-trend positive">+5% vs semana anterior</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <span className="summary-label">Actividades Completadas</span>
              <span className="summary-value">
                {reportData.summary.completedActivities}/{reportData.summary.totalActivities}
              </span>
              <span className="summary-trend positive">
                {Math.round((reportData.summary.completedActivities / reportData.summary.totalActivities) * 100)}% del total
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⏱️</div>
            <div className="summary-content">
              <span className="summary-label">Tiempo Total Trabajado</span>
              <span className="summary-value">
                {minutesToTime(reportData.summary.totalCompletedMinutes)}
              </span>
              <span className="summary-trend neutral">
                de {minutesToTime(reportData.summary.totalPlannedMinutes)} planeados
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">🎯</div>
            <div className="summary-content">
              <span className="summary-label">Mejor Hora</span>
              <span className="summary-value">{reportData.summary.mostProductiveHour}</span>
              <span className="summary-trend positive">90% productividad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="charts-grid">
        {/* Gráfica de productividad semanal */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Productividad Diaria</h3>
            <p className="chart-description">Tasa de cumplimiento por día</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="completionRate" fill="#667eea" name="Cumplimiento %" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de distribución por categoría */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Distribución del Tiempo</h3>
            <p className="chart-description">Por tipo de actividad</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value, name, props) => [minutesToTime(props.payload.minutes), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de tiempo planeado vs real */}
        <div className="chart-container chart-full-width">
          <div className="chart-header">
            <h3>Tiempo Planeado vs Real</h3>
            <p className="chart-description">Comparación por día (en minutos)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => minutesToTime(value)}
              />
              <Legend />
              <Bar dataKey="totalPlanned" fill="#cbd5e0" name="Planeado" radius={[8, 8, 0, 0]} />
              <Bar dataKey="totalCompleted" fill="#10b981" name="Completado" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de productividad por hora */}
        <div className="chart-container chart-full-width">
          <div className="chart-header">
            <h3>Productividad por Hora del Día</h3>
            <p className="chart-description">Identifica tus horas más productivas</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="productivity" 
                stroke="#667eea" 
                strokeWidth={3}
                name="Productividad %"
                dot={{ fill: '#667eea', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights y recomendaciones */}
      <div className="insights-section">
        <h3>💡 Insights y Recomendaciones</h3>
        <div className="insights-grid">
          <div className="insight-card insight-success">
            <div className="insight-icon">🎉</div>
            <div className="insight-content">
              <h4>Mejor Día</h4>
              <p>{reportData.summary.bestDay} fue tu día más productivo con 90% de cumplimiento.</p>
            </div>
          </div>

          <div className="insight-card insight-warning">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Área de Mejora</h4>
              <p>{reportData.summary.worstDay} mostró menor productividad. Identifica posibles distracciones.</p>
            </div>
          </div>

          <div className="insight-card insight-info">
            <div className="insight-icon">⏰</div>
            <div className="insight-content">
              <h4>Horario Óptimo</h4>
              <p>Tu mejor rendimiento es entre las {reportData.summary.mostProductiveHour} y las 17:00.</p>
            </div>
          </div>
        </div>

        <div className="recommendations-list">
          <h4>Recomendaciones Personalizadas</h4>
          {reportData.summary.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-number">{index + 1}</span>
              <p>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="detailed-table">
        <h3>Detalle por Día</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Día</th>
              <th>Fecha</th>
              <th>Actividades</th>
              <th>Tiempo Planeado</th>
              <th>Tiempo Real</th>
              <th>Cumplimiento</th>
              <th>Nivel</th>
            </tr>
          </thead>
          <tbody>
            {reportData.weeklyData.map((day, index) => (
              <tr key={index}>
                <td className="table-day">{day.day}</td>
                <td>{day.date}</td>
                <td>{day.activitiesCount}</td>
                <td>{minutesToTime(day.totalPlanned)}</td>
                <td>{minutesToTime(day.totalCompleted)}</td>
                <td>
                  <span className={`table-badge ${day.completionRate >= 80 ? 'badge-success' : 'badge-warning'}`}>
                    {day.completionRate}%
                  </span>
                </td>
                <td>
                  <span className={`table-badge badge-${day.productivityLevel}`}>
                    {day.productivityLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reports;