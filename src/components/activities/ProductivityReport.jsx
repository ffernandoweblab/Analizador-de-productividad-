// src/components/ProductivityReport.jsx

import React, { useState, useEffect } from 'react';
import { obtenerDatosPrediccion } from '../../../src/utils/productivityService';
import { generarReportePrediccion } from '../../../src/utils/productivityPredictor';
import { obtenerRangoSemanaActual, formatearFecha } from '../../../src/utils/timeUtils';

const ProductivityReport = () => {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaPrediccion, setFechaPrediccion] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener rango de la semana
      const { start, end } = obtenerRangoSemanaActual();
      
      // Calcular fecha de mañana para mostrar
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      setFechaPrediccion(formatearFecha(manana));

      // Obtener datos de la API
      const datos = await obtenerDatosPrediccion(start, end);

      if (!datos.success) {
        throw new Error(datos.error || 'Error al cargar datos');
      }

      // Generar reporte de predicción
      const reporteGenerado = generarReportePrediccion(datos.colaboradores);
      
      // Filtrar colaboradores sin nombre o sin actividad relevante
      const reporteFiltrado = reporteGenerado.filter(
        item => item.nombre && item.nombre !== 'Sin nombre'
      );

      setReporte(reporteFiltrado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando predicción de productividad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>❌ Error: {error}</p>
        <button onClick={cargarDatos}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="productivity-report">
      <header className="report-header">
        <h1>📊 Predicción de Productividad</h1>
        <p className="subtitle">
          Predicción para mañana: <strong>{fechaPrediccion}</strong>
        </p>
      </header>

      <div className="report-grid">
        {reporte.map((colaborador) => (
          <ColaboradorCard 
            key={colaborador.id} 
            datos={colaborador} 
          />
        ))}
      </div>

      {reporte.length === 0 && (
        <div className="empty-state">
          <p>No hay datos de colaboradores para mostrar</p>
        </div>
      )}
    </div>
  );
};

// Componente para cada tarjeta de colaborador
const ColaboradorCard = ({ datos }) => {
  const { nombre, metricas, prediccion } = datos;
  const [expandido, setExpandido] = useState(false);

  return (
    <div 
      className="colaborador-card"
      style={{ borderLeftColor: prediccion.color }}
    >
      <div className="card-header" onClick={() => setExpandido(!expandido)}>
        <div className="header-info">
          <span className="emoji">{prediccion.emoji}</span>
          <h3>{nombre}</h3>
        </div>
        <div className="score-badge" style={{ backgroundColor: prediccion.color }}>
          {prediccion.score}%
        </div>
      </div>

      <div className="card-body">
        <p className="nivel">{prediccion.nivel}</p>
        <p className="recomendacion">{prediccion.recomendacion}</p>

        <div className="metricas-resumen">
          <div className="metrica">
            <span className="valor">{metricas.totalPendientes}</span>
            <span className="label">Pendientes</span>
          </div>
          <div className="metrica">
            <span className="valor">{metricas.tareasConArrastre}</span>
            <span className="label">Con arrastre</span>
          </div>
          <div className="metrica">
            <span className="valor">{metricas.totalTerminadas}</span>
            <span className="label">Terminadas</span>
          </div>
        </div>

        {/* Tendencia */}
        <div className="tendencia">
          {prediccion.tendencia === 'mejorando' && <span>📈 Mejorando</span>}
          {prediccion.tendencia === 'empeorando' && <span>📉 Empeorando</span>}
          {prediccion.tendencia === 'estable' && <span>➡️ Estable</span>}
          {prediccion.tendencia === 'sin_datos' && <span>❓ Sin datos previos</span>}
        </div>
      </div>

      {/* Detalles expandibles */}
      {expandido && (
        <div className="card-details">
          <h4>Tareas con arrastre:</h4>
          {metricas.tareasPendientes
            .filter(t => t.diasArrastre >= 2)
            .slice(0, 5)
            .map(tarea => (
              <div key={tarea.id} className="tarea-arrastre">
                <span className="tarea-nombre">{tarea.nombre}</span>
                <span className="dias-arrastre">{tarea.diasArrastre} días</span>
              </div>
            ))
          }
          {metricas.tareasPendientes.filter(t => t.diasArrastre >= 2).length === 0 && (
            <p className="sin-arrastre">✅ No tiene tareas con arrastre</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductivityReport;