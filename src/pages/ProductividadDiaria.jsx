import { useState, useEffect } from 'react';
import './ProductividadDiaria.css';

export default function ProductividadDiaria() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://wlserver-production.up.railway.app/api/reportes/resumen?period=dia');
        if (!response.ok) throw new Error('Error al cargar los datos');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando productividad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  const getNombreUsuario = (email) => {
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

  const getCumplimientoBadge = (porcentaje) => {
    if (porcentaje >= 90) return { clase: 'badge-excelente', texto: 'EXCELENTE' };
    if (porcentaje >= 70) return { clase: 'badge-bueno', texto: 'BUENO' };
    if (porcentaje >= 50) return { clase: 'badge-aceptable', texto: 'ACEPTABLE' };
    return { clase: 'badge-bajo', texto: 'BAJO' };
  };

  const calcularPorcentajeCumplimiento = (usuario) => {
    // Calculamos el porcentaje basado en actividades completadas vs total de eventos
    if (usuario.eventos === 0) return 0;
    const porcentaje = Math.round((usuario.actividadesTerminadas / usuario.eventos) * 100);
    return porcentaje;
  };

  return (
    <div className="productividad-container">
      <div className="productividad-content">
        {/* Header */}
        <div className="productividad-header">
          <h1 className="productividad-title">
            Productividad Diaria
          </h1>
          <p className="productividad-date">
            {new Date(data.range.start).toLocaleDateString('es-MX', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Resumen General */}
        <div className="resumen-general">
          <h2 className="resumen-title">Resumen General del Equipo</h2>
          <div className="resumen-stats">
            <div className="resumen-stat">
              <p className="resumen-stat-label">Total Eventos</p>
              <p className="resumen-stat-value">{data.totales.eventos}</p>
            </div>
            <div className="resumen-stat">
              <p className="resumen-stat-label">Actividades Terminadas</p>
              <p className="resumen-stat-value">{data.totales.actividadesTerminadas}</p>
            </div>
            <div className="resumen-stat">
              <p className="resumen-stat-label">Revisiones Marcadas</p>
              <p className="resumen-stat-value">{data.totales.revisionesMarcadas}</p>
            </div>
          </div>
        </div>

        {/* Grid de Usuarios */}
        <div className="usuarios-grid">
          {data.porUsuario.map((usuario, index) => {
            const porcentaje = calcularPorcentajeCumplimiento(usuario);
            const badge = getCumplimientoBadge(porcentaje);
            
            return (
              <div key={index} className="usuario-card">
                {/* Header del usuario */}
                <div className="usuario-card-header">
                  <div className="usuario-avatar-large">
                    {getNombreUsuario(usuario.email).charAt(0)}
                  </div>
                  <div className="usuario-card-info">
                    <h3 className="usuario-card-name">
                      {getNombreUsuario(usuario.email)}
                    </h3>
                    <p className="usuario-card-email">{usuario.email}</p>
                    <span className="usuario-card-role">Desarrollo</span>
                  </div>
                </div>

                {/* Porcentaje de cumplimiento */}
                <div className="cumplimiento-section">
                  <p className="cumplimiento-label">Cumplimiento Semanal</p>
                  <div className="cumplimiento-percentage">{porcentaje}%</div>
                  <span className={`cumplimiento-badge ${badge.clase}`}>
                    {badge.texto}
                  </span>
                </div>

                {/* Métricas */}
                <div className="usuario-metricas">
                  <div className="metrica-item">
                    <span className="metrica-label">Actividades</span>
                    <span className="metrica-value">
                      {usuario.actividadesTerminadas}
                      <span className="metrica-value-small">/{usuario.eventos}</span>
                    </span>
                  </div>
                  <div className="metrica-item">
                    <span className="metrica-label">Revisiones</span>
                    <span className="metrica-value">{usuario.revisionesMarcadas}</span>
                  </div>
                  <div className="metrica-item">
                    <span className="metrica-label">Total Eventos</span>
                    <span className="metrica-value">{usuario.eventos}</span>
                  </div>
                  <div className="metrica-item">
                    <span className="metrica-label">Puntualidad</span>
                    <span className="metrica-value">{porcentaje}%</span>
                  </div>
                </div>

                {/* Botón ver detalles */}
                <button className="ver-detalles-btn">
                  Ver Detalles →
                </button>
              </div>
            );
          })}
        </div>

        {/* Proyectos */}
        <div className="proyectos-section">
          <h2 className="section-title">Proyectos Activos</h2>
          <div className="proyectos-list">
            {data.porProyecto.map((proyecto, index) => (
              <div key={index} className="proyecto-item">
                <h3 className="proyecto-name">
                  {proyecto.projectName || 'Sin nombre de proyecto'}
                </h3>
                <div className="proyecto-stats">
                  <div className="proyecto-stat">
                    <div className="proyecto-stat-value">
                      {proyecto.actividadesTerminadas}
                    </div>
                    <div className="proyecto-stat-label">Terminadas</div>
                  </div>
                  <div className="proyecto-stat">
                    <div className="proyecto-stat-value">
                      {proyecto.revisionesMarcadas}
                    </div>
                    <div className="proyecto-stat-label">Revisiones</div>
                  </div>
                  <div className="proyecto-stat">
                    <div className="proyecto-stat-value">
                      {proyecto.eventos}
                    </div>
                    <div className="proyecto-stat-label">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}