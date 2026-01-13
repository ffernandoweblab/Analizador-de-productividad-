import React, { useState, useEffect } from 'react';
import './ReportesDiarios.css';

function ReportesDiarios() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Función para formatear fecha a ISO string para la API
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const start = `${year}-${month}-${day}T00:00:00.000Z`;
    const end = `${year}-${month}-${day}T23:59:59.999Z`;
    
    return { start, end };
  };

  // Función para obtener datos de la API
  const fetchReporte = async (date) => {
    try {
      setLoading(true);
      setError(null);
      
      const { start, end } = formatDateForAPI(date);
      const url = `https://wlserver-production.up.railway.app/api/reportes/custom?start=${start}&end=${end}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar el reporte');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia la fecha
  useEffect(() => {
    fetchReporte(selectedDate);
  }, [selectedDate]);

  // Manejador para cambio de fecha
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value + 'T12:00:00');
    setSelectedDate(newDate);
  };

  // Función para ir al día anterior
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Función para ir al día siguiente
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Función para ir a hoy
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Formatear fecha para el input
  const getDateInputValue = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular porcentaje de completitud
  const calcularPorcentaje = () => {
    if (!data || data.totales.eventos === 0) return 0;
    return Math.round((data.totales.actividadesTerminadas / data.totales.eventos) * 100);
  };

  if (loading) {
    return (
      <div className="reportes-loading">
        <div className="loading-spinner"></div>
        <p>Cargando reporte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reportes-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">Error: {error}</p>
        <button onClick={() => fetchReporte(selectedDate)} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  const porcentajeCompletitud = calcularPorcentaje();
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="reportes-container">
      <div className="reportes-content">
        {/* Header con selector de fecha */}
        <div className="reportes-header">
          <div className="header-top">
            <h1 className="reportes-title">Reporte Diario</h1>
            <div className="date-controls">
              <button onClick={goToPreviousDay} className="nav-button" title="Día anterior">
                ◀
              </button>
              <input
                type="date"
                value={getDateInputValue()}
                onChange={handleDateChange}
                className="date-input"
                max={getDateInputValue()}
              />
              <button onClick={goToNextDay} className="nav-button" title="Día siguiente" disabled={isToday}>
                ▶
              </button>
              {!isToday && (
                <button onClick={goToToday} className="today-button">
                  Hoy
                </button>
              )}
            </div>
          </div>
          <p className="reportes-date">
            {selectedDate.toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Resumen general con porcentaje */}
        <div className="reporte-summary">
          <div className="summary-main">
            <div className="porcentaje-section">
              <div className="porcentaje-circle">
                <svg viewBox="0 0 100 100" className="porcentaje-svg">
                  <circle cx="50" cy="50" r="45" className="porcentaje-bg" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    className="porcentaje-fill"
                    style={{
                      strokeDasharray: `${porcentajeCompletitud * 2.827}, 282.7`
                    }}
                  />
                </svg>
                <div className="porcentaje-text">
                  <span className="porcentaje-number">{porcentajeCompletitud}%</span>
                  <span className="porcentaje-label">Completitud</span>
                </div>
              </div>
            </div>
            
            <div className="summary-stats">
              <div className="stat-card stat-total">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <span className="stat-value">{data.totales.eventos}</span>
                  <span className="stat-label">Total Eventos</span>
                </div>
              </div>
              
              <div className="stat-card stat-completadas">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <span className="stat-value">{data.totales.actividadesTerminadas}</span>
                  <span className="stat-label">Actividades Terminadas</span>
                </div>
              </div>
              
              <div className="stat-card stat-revisiones">
                <div className="stat-icon">👁️</div>
                <div className="stat-info">
                  <span className="stat-value">{data.totales.revisionesMarcadas}</span>
                  <span className="stat-label">Revisiones Marcadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown diario */}
        {data.breakdownDiario && data.breakdownDiario.length > 0 && (
          <div className="breakdown-section">
            <h2 className="section-title">Desglose del Día</h2>
            <div className="breakdown-grid">
              {data.breakdownDiario.map((dia, index) => (
                <div key={index} className="breakdown-card">
                  <div className="breakdown-header">
                    <h3 className="breakdown-date">
                      {new Date(dia.date + 'T12:00:00').toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </h3>
                  </div>
                  
                  <div className="breakdown-metrics">
                    <div className="breakdown-metric">
                      <span className="metric-icon">📋</span>
                      <div className="metric-data">
                        <span className="metric-number">{dia.eventos}</span>
                        <span className="metric-text">Eventos</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-divider"></div>
                    
                    <div className="breakdown-metric">
                      <span className="metric-icon">✔️</span>
                      <div className="metric-data">
                        <span className="metric-number">{dia.actividadesTerminadas}</span>
                        <span className="metric-text">Terminadas</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-divider"></div>
                    
                    <div className="breakdown-metric">
                      <span className="metric-icon">👀</span>
                      <div className="metric-data">
                        <span className="metric-number">{dia.revisionesMarcadas}</span>
                        <span className="metric-text">Revisiones</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="breakdown-progress">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ 
                          width: `${dia.eventos > 0 ? (dia.actividadesTerminadas / dia.eventos) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {dia.eventos > 0 ? Math.round((dia.actividadesTerminadas / dia.eventos) * 100) : 0}% completado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje informativo si no hay datos */}
        {data.totales.eventos === 0 && (
          <div className="no-data-message">
            <div className="no-data-icon">📭</div>
            <h3>No hay eventos registrados</h3>
            <p>No se encontraron eventos para el día seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportesDiarios;