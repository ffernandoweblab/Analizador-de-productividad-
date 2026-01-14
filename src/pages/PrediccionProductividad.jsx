// src/pages/PrediccionProductividad.jsx

import React, { useState, useEffect } from 'react';
import { getRevisionesRango } from '../services/predictorService';
import { generarReporte } from '../utils/predictorEngine';
import { rangoSemanaActual, fechaManana } from '../utils/predictorDateUtils';
import './PrediccionProductividad.css';

const PrediccionProductividad = () => {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manana, setManana] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      setManana(fechaManana());

      const { start, end } = rangoSemanaActual();
      const response = await getRevisionesRango(start, end);

      if (!response.success) {
        throw new Error('Error al obtener datos');
      }

      const reporteGenerado = generarReporte(response.data.colaboradores);
      setReporte(reporteGenerado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prediccion-loading">
        <div className="prediccion-spinner"></div>
        <p>Calculando predicciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediccion-error">
        <p>❌ {error}</p>
        <button onClick={cargarDatos}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="prediccion-container">
      <header className="prediccion-header">
        <h1>📊 Predicción de Productividad</h1>
        <p>Pronóstico para mañana: <strong>{manana}</strong></p>
      </header>

      <div className="prediccion-grid">
        {reporte.map((col) => (
          <ColaboradorCard key={col.id} data={col} />
        ))}
      </div>

      {reporte.length === 0 && (
        <div className="prediccion-empty">
          <p>No hay colaboradores para mostrar</p>
        </div>
      )}
    </div>
  );
};

// Tarjeta individual de colaborador
const ColaboradorCard = ({ data }) => {
  const [expandido, setExpandido] = useState(false);
  const { nombre, prediccion, pendientes, terminadas, tareasPendientes } = data;
  const tareasArrastre = tareasPendientes.filter(t => t.diasArrastre >= 2);

  return (
    <div 
      className="prediccion-card"
      style={{ borderLeftColor: prediccion.color }}
    >
      {/* Header */}
      <div className="prediccion-card-header" onClick={() => setExpandido(!expandido)}>
        <div className="prediccion-card-info">
          <span className="prediccion-emoji">{prediccion.emoji}</span>
          <h3>{nombre}</h3>
        </div>
        <div 
          className="prediccion-score"
          style={{ backgroundColor: prediccion.color }}
        >
          {prediccion.score}%
        </div>
      </div>

      {/* Body */}
      <div className="prediccion-card-body">
        <p className="prediccion-nivel">{prediccion.nivel}</p>
        <p className="prediccion-mensaje">{prediccion.mensaje}</p>

        <div className="prediccion-metricas">
          <div className="prediccion-metrica">
            <span className="prediccion-metrica-valor">{pendientes}</span>
            <span className="prediccion-metrica-label">Pendientes</span>
          </div>
          <div className="prediccion-metrica">
            <span className="prediccion-metrica-valor">{tareasArrastre.length}</span>
            <span className="prediccion-metrica-label">Con arrastre</span>
          </div>
          <div className="prediccion-metrica">
            <span className="prediccion-metrica-valor">{terminadas}</span>
            <span className="prediccion-metrica-label">Terminadas</span>
          </div>
        </div>
      </div>

      {/* Expandible */}
      {expandido && (
        <div className="prediccion-card-details">
          <h4>⚠️ Tareas con arrastre (2+ días):</h4>
          {tareasArrastre.length > 0 ? (
            tareasArrastre.slice(0, 5).map(tarea => (
              <div key={tarea.id} className="prediccion-tarea">
                <span className="prediccion-tarea-nombre">{tarea.nombre}</span>
                <span className="prediccion-tarea-dias">{tarea.diasArrastre} días</span>
              </div>
            ))
          ) : (
            <p className="prediccion-sin-arrastre">✅ Sin tareas atrasadas</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PrediccionProductividad;