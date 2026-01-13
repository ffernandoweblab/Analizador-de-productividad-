import React, { useState, useEffect } from 'react';
import './ProductivityDashboard.css';

const ProductivityDashboard = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    proyecto: 'todos',
    estado: 'todos',
    prioridad: 'todas',
    fecha: 'hoy' // 'hoy', 'semana', 'mes', 'todos'
  });

  // Consumir API
  useEffect(() => {
    const fetchActividades = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://wlserver-production.up.railway.app/api/actividades');
        const data = await response.json();
        setActividades(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        setError(`Error al cargar: ${error.message}`);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActividades();
  }, []);

  // NUEVO: Función para determinar si una actividad está realmente completada
  const estaCompletada = (actividad) => {
    // Si tiene el status correcto
    if (actividad.status === 'TERMINADO REVISADO/COBRADO') {
      return true;
    }
    
    // Si tiene tiempoReal con valor significa que fue completada
    if (actividad.tiempoReal) {
      // Validar que sea string antes de usar trim()
      const tiempoStr = typeof actividad.tiempoReal === 'string' 
        ? actividad.tiempoReal.trim() 
        : String(actividad.tiempoReal).trim();
      
      // Si tiene algún valor de tiempo, está completada
      if (tiempoStr !== '' && tiempoStr !== '0' && tiempoStr !== 'null' && tiempoStr !== 'undefined') {
        return true;
      }
    }
    
    return false;
  };

  // Función para filtrar por fecha
  const filtrarPorFecha = (actividad) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaActividad = new Date(actividad.dueEnd);
    fechaActividad.setHours(0, 0, 0, 0);

    switch (filtros.fecha) {
      case 'hoy':
        return fechaActividad.getTime() === hoy.getTime();
      case 'semana':
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return fechaActividad >= hace7Dias && fechaActividad <= hoy;
      case 'mes':
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        return fechaActividad >= hace30Dias && fechaActividad <= hoy;
      case 'todos':
      default:
        return true;
    }
  };

  // Aplicar filtros
  const actividadesFiltradas = actividades.filter(act => {
    if (filtros.proyecto !== 'todos' && act.project?.id !== filtros.proyecto) return false;
    if (filtros.estado !== 'todos') {
      // Usar la lógica mejorada de completadas
      const completada = estaCompletada(act);
      if (filtros.estado === 'TERMINADO REVISADO/COBRADO' && !completada) return false;
      if (filtros.estado === 'PENDIENTE' && completada) return false;
    }
    if (filtros.prioridad !== 'todas' && act.prioridad !== filtros.prioridad) return false;
    if (!filtrarPorFecha(act)) return false;
    return true;
  });

  // Calcular estadísticas generales CON LA NUEVA LÓGICA
  const calcularEstadisticas = () => {
    const total = actividadesFiltradas.length;
    const completadas = actividadesFiltradas.filter(a => estaCompletada(a)).length;
    const pendientes = total - completadas;
    const porcentajeCompletadas = total > 0 ? ((completadas / total) * 100).toFixed(1) : 0;

    return { total, completadas, pendientes, porcentajeCompletadas };
  };

  // Obtener listas únicas
  const obtenerProyectosUnicos = () => {
    return [...new Set(actividades.map(a => a.project?.id))].filter(Boolean);
  };

  const obtenerPrioridadesUnicas = () => {
    return [...new Set(actividades.map(a => a.prioridad))].filter(Boolean);
  };

  // NUEVO: Calcular productividad por usuario/assignee CON LA NUEVA LÓGICA
  const calcularProductividadPorUsuario = () => {
    const porUsuario = {};

    actividadesFiltradas.forEach(act => {
      try {
        // Validar que assignees exista y sea un array
        const usuarios = (act.assignees && Array.isArray(act.assignees)) ? act.assignees : [];
        
        if (usuarios.length === 0) {
          return; // Si no hay usuarios, salta esta actividad
        }

        usuarios.forEach(usuario => {
          // Validar que usuario no sea null o undefined
          if (!usuario) return;
          
          const usuarioId = usuario.id || usuario;
          const usuarioNombre = usuario.name || usuario;

          if (!porUsuario[usuarioId]) {
            porUsuario[usuarioId] = {
              id: usuarioId,
              nombre: usuarioNombre,
              total: 0,
              completadas: 0,
              pendientes: 0
            };
          }

          porUsuario[usuarioId].total++;
          
          // USAR LA NUEVA LÓGICA DE COMPLETADAS
          if (estaCompletada(act)) {
            porUsuario[usuarioId].completadas++;
          } else {
            porUsuario[usuarioId].pendientes++;
          }
        });
      } catch (e) {
        console.warn('Error procesando usuario:', e);
      }
    });

    // Si no hay usuarios, retornar array vacío
    if (Object.keys(porUsuario).length === 0) {
      return [];
    }

    return Object.values(porUsuario)
      .map(usuario => ({
        ...usuario,
        porcentaje: usuario.total > 0 ? ((usuario.completadas / usuario.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.completadas - a.completadas);
  };

  // NUEVO: Calcular productividad por proyecto CON LA NUEVA LÓGICA
  const calcularProductividadPorProyecto = () => {
    const porProyecto = {};

    actividadesFiltradas.forEach(act => {
      try {
        const projectId = act.project?.id;
        const projectName = act.project?.name || 'Sin proyecto';

        if (!porProyecto[projectId]) {
          porProyecto[projectId] = {
            nombre: projectName,
            total: 0,
            completadas: 0
          };
        }

        porProyecto[projectId].total++;
        // USAR LA NUEVA LÓGICA DE COMPLETADAS
        if (estaCompletada(act)) {
          porProyecto[projectId].completadas++;
        }
      } catch (e) {
        console.warn('Error procesando proyecto:', e);
      }
    });

    return Object.values(porProyecto)
      .map(p => ({
        ...p,
        porcentaje: p.total > 0 ? ((p.completadas / p.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.completadas - a.completadas);
  };

  if (loading) {
    return (
      <div className="productivity-dashboard loading">
        <div className="spinner">⏳ Cargando actividades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="productivity-dashboard error">
        <div className="error-message">❌ {error}</div>
      </div>
    );
  }

  const stats = calcularEstadisticas();
  const productividadPorUsuario = calcularProductividadPorUsuario();
  const productividadPorProyecto = calcularProductividadPorProyecto();
  const proyectos = obtenerProyectosUnicos();
  const prioridades = obtenerPrioridadesUnicas();

  const getNombreFecha = () => {
    const hoy = new Date();
    switch (filtros.fecha) {
      case 'hoy':
        return `Hoy (${hoy.toLocaleDateString('es-ES')})`;
      case 'semana':
        return 'Últimos 7 días';
      case 'mes':
        return 'Últimos 30 días';
      case 'todos':
        return 'Todo el tiempo';
      default:
        return '';
    }
  };

  return (
    <div className="productivity-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <h1>📊 Dashboard de Productividad</h1>
        <p>Análisis en tiempo real de todas las actividades</p>
      </header>

      {/* FILTROS DE FECHA Y OTROS */}
      <section className="filtros-fecha-section">
        <div className="filtros-fecha">
          <label className="label-filtro">📅 Período:</label>
          <div className="fecha-buttons">
            <button 
              className={`fecha-btn ${filtros.fecha === 'hoy' ? 'active' : ''}`}
              onClick={() => setFiltros({...filtros, fecha: 'hoy'})}
            >
              📌 Hoy
            </button>
            <button 
              className={`fecha-btn ${filtros.fecha === 'semana' ? 'active' : ''}`}
              onClick={() => setFiltros({...filtros, fecha: 'semana'})}
            >
              📆 Esta Semana
            </button>
            <button 
              className={`fecha-btn ${filtros.fecha === 'mes' ? 'active' : ''}`}
              onClick={() => setFiltros({...filtros, fecha: 'mes'})}
            >
              📈 Este Mes
            </button>
            <button 
              className={`fecha-btn ${filtros.fecha === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltros({...filtros, fecha: 'todos'})}
            >
              ♾️ Todo
            </button>
          </div>
        </div>

        <div className="info-fecha">
          <span className="badge-periodo">{getNombreFecha()}</span>
          <span className="badge-cantidad">{actividadesFiltradas.length} actividades</span>
        </div>
      </section>

      {/* TARJETAS DE RESUMEN */}
      <section className="resumen-cards">
        <div className="card card-total">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <span className="card-label">Total de Tareas</span>
            <span className="card-value">{stats.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="card card-completadas">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <span className="card-label">Completadas</span>
            <div>
              <span className="card-value">{stats.completadas.toLocaleString()}</span>
              <span className="card-percentage">{stats.porcentajeCompletadas}%</span>
            </div>
          </div>
        </div>

        <div className="card card-pendientes">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <span className="card-label">Pendientes</span>
            <div>
              <span className="card-value">{stats.pendientes.toLocaleString()}</span>
              <span className="card-percentage">{(100 - stats.porcentajeCompletadas).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="card card-progreso">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">Productividad General</span>
            <div className="progress-bar-mini">
              <div 
                className="progress-fill"
                style={{ width: `${stats.porcentajeCompletadas}%` }}
              ></div>
            </div>
            <span className="card-percentage">{stats.porcentajeCompletadas}%</span>
          </div>
        </div>
      </section>

      {/* PRODUCTIVIDAD POR USUARIO */}
      {productividadPorUsuario.length > 0 && (
        <section className="usuarios-section">
          <h2>👥 Productividad por Trabajador</h2>
          <div className="usuarios-grid">
            {productividadPorUsuario.map((usuario, idx) => (
              <div key={idx} className="usuario-card">
                <div className="usuario-header">
                  <div className="usuario-avatar">
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="usuario-info">
                    <h3>{usuario.nombre}</h3>
                    <span className="badge-productividad">{usuario.porcentaje}%</span>
                  </div>
                </div>

                <div className="usuario-stats">
                  <div className="stat">
                    <span className="label">Completadas</span>
                    <span className="valor">{usuario.completadas}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Pendientes</span>
                    <span className="valor pendiente">{usuario.pendientes}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Total</span>
                    <span className="valor total">{usuario.total}</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${usuario.porcentaje}%` }}
                  ></div>
                </div>

                <div className="usuario-footer">
                  <span className="avance-text">
                    Avance: <strong>{usuario.porcentaje}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTIVIDAD POR PROYECTO */}
      <section className="productivity-section">
        <h2>🏢 Productividad por Proyecto</h2>
        {productividadPorProyecto.length > 0 ? (
          <div className="proyectos-grid">
            {productividadPorProyecto.map((proyecto, idx) => (
              <div key={idx} className="proyecto-card">
                <h3>{proyecto.nombre.substring(0, 50)}</h3>
                <div className="proyecto-stats">
                  <div className="stat">
                    <span className="label">Total</span>
                    <span className="valor">{proyecto.total}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Completadas</span>
                    <span className="valor">{proyecto.completadas}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${proyecto.porcentaje}%` }}
                  ></div>
                </div>
                <span className="porcentaje-badge">{proyecto.porcentaje}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="sin-datos">No hay proyectos con el filtro seleccionado</p>
        )}
      </section>

      {/* FILTROS ADICIONALES */}
      <section className="filtros-section">
        <h2>🔍 Filtros Adicionales</h2>
        <div className="filtros-container">
          <select 
            value={filtros.proyecto}
            onChange={(e) => setFiltros({...filtros, proyecto: e.target.value})}
            className="select-filter"
          >
            <option value="todos">📌 Todos los proyectos</option>
            {proyectos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select 
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
            className="select-filter"
          >
            <option value="todos">📊 Todos los estados</option>
            <option value="TERMINADO REVISADO/COBRADO">✅ Completadas</option>
            <option value="PENDIENTE">⏳ Pendientes</option>
          </select>

          <select 
            value={filtros.prioridad}
            onChange={(e) => setFiltros({...filtros, prioridad: e.target.value})}
            className="select-filter"
          >
            <option value="todas">⚡ Todas las prioridades</option>
            {prioridades.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <button 
            className="btn-reset"
            onClick={() => setFiltros({proyecto: 'todos', estado: 'todos', prioridad: 'todas', fecha: 'hoy'})}
          >
            🔄 Resetear Filtros
          </button>
        </div>
      </section>

      {/* TABLA DE ACTIVIDADES */}
      <section className="tabla-section">
        <h2>📋 Actividades ({actividadesFiltradas.length})</h2>
        {actividadesFiltradas.length > 0 ? (
          <div className="tabla-wrapper">
            <table className="tabla-actividades">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Vencimiento</th>
                  <th>Tiempo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {actividadesFiltradas.slice(0, 20).map(act => {
                  const completada = estaCompletada(act);
                  return (
                    <tr key={act.id} className={`row-${completada ? 'completada' : 'pendiente'}`}>
                      <td className="titulo-cell">
                        <span title={act.titulo}>{act.titulo.substring(0, 40)}</span>
                      </td>
                      <td>{act.project?.name || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${completada ? 'completada' : 'pendiente'}`}>
                          {completada ? '✅ Completada' : '⏳ Pendiente'}
                        </span>
                      </td>
                      <td>{act.prioridad || 'N/A'}</td>
                      <td>
                        {new Date(act.dueEnd).toLocaleDateString('es-ES')}
                      </td>
                      <td>{act.tiempoReal || 'N/A'}</td>
                      <td>
                        {act.url ? (
                          <a href={act.url} target="_blank" rel="noopener noreferrer" className="btn-link">
                            Ver →
                          </a>
                        ) : (
                          <span className="btn-link disabled">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {actividadesFiltradas.length > 20 && (
              <p className="tabla-info">
                Mostrando 20 de {actividadesFiltradas.length} actividades
              </p>
            )}
          </div>
        ) : (
          <p className="sin-datos">No hay actividades con el filtro seleccionado</p>
        )}
      </section>
    </div>
  );
};

export default ProductivityDashboard;