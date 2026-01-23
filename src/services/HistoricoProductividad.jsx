'use client';

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import './HistoricoProductividad.css';

const COLORS = {
  productivo: "#10b981",
  regular: "#f59e0b",
  no_productivo: "#ef4444",
};

function formatearTiempo(minutos) {
  if (!minutos || minutos === 0) return "0 min";
  if (minutos >= 60) {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    if (minutosRestantes === 0) return `${horas}h`;
    return `${horas}h ${minutosRestantes}min`;
  }
  return `${minutos} min`;
}

export default function HistoricoProductividad() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10)
  );
  const [fechaFin, setFechaFin] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("todos");
  const [usuarios, setUsuarios] = useState([]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      // Generar array de fechas entre inicio y fin
      const fechas = [];
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
        
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().slice(0, 10);
        fechas.push(fechaStr);
      }

      // Hacer llamadas en paralelo para cada fecha
      const promesas = fechas.map(fecha =>
        fetch(`/api/productividad/hoy?date=${fecha}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );

      const resultados = await Promise.all(promesas);

      // Consolidar datos
      const datosConsolidados = {
        daily_data: resultados
          .filter(Boolean)
          .map((data, idx) => ({
            date: fechas[idx],
            users: data.users || [],
          })),
      };

      setData(datosConsolidados);

      // Extraer usuarios únicos
      const usuariosUnicos = [];
      const userIds = new Set();
      if (datosConsolidados.daily_data) {
        datosConsolidados.daily_data.forEach(day => {
          if (day.users) {
            day.users.forEach(user => {
              if (!userIds.has(user.user_id)) {
                userIds.add(user.user_id);
                usuariosUnicos.push({
                  id: user.user_id,
                  nombre: user.colaborador || user.user_id,
                });
              }
            });
          }
        });
      }
      setUsuarios(usuariosUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Procesar datos generales por día
  const procesarTendenciaGeneral = useCallback(() => {
    if (!data?.daily_data) return [];

    return data.daily_data
      .filter(day => day.users && day.users.length > 0)
      .map(day => {
        const contadores = {
          productivo: 0,
          regular: 0,
          no_productivo: 0,
        };

        day.users.forEach(user => {
          const label = user.prediccion?.label || "regular";
          contadores[label]++;
        });

        return {
          fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          fechaCompleta: day.date,
          productivo: contadores.productivo,
          regular: contadores.regular,
          no_productivo: contadores.no_productivo,
          total: day.users?.length || 0,
        };
      });
  }, [data]);

  // Procesar datos de usuario específico
  const procesarDatosUsuarioHistorico = useCallback(() => {
    if (!data?.daily_data || usuarioSeleccionado === "todos") return [];

    return data.daily_data
      .map(day => {
        const usuario = day.users?.find(u => u.user_id === usuarioSeleccionado);
        if (!usuario) return null;

        const label = usuario.prediccion?.label || "regular";
        return {
          fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          fechaCompleta: day.date,
          tiempo: usuario.tiempo_total || 0,
          actividades: usuario.actividades || 0,
          revisiones: usuario.revisiones || 0,
          estado: label,
        };
      })
      .filter(Boolean);
  }, [data, usuarioSeleccionado]);

  // Procesar promedios por usuario en el rango
  const procesarPromediosUsuarios = useCallback(() => {
    if (!data?.daily_data) return [];

    const estadisticas = {};

    data.daily_data.forEach(day => {
      if (day.users) {
        day.users.forEach(user => {
          if (!estadisticas[user.user_id]) {
            estadisticas[user.user_id] = {
              nombre: user.colaborador,
              tiempo_total: 0,
              actividades_total: 0,
              revisiones_total: 0,
              dias: 0,
              productivo: 0,
              regular: 0,
              no_productivo: 0,
            };
          }
          estadisticas[user.user_id].tiempo_total += user.tiempo_total || 0;
          estadisticas[user.user_id].actividades_total += user.actividades || 0;
          estadisticas[user.user_id].revisiones_total += user.revisiones || 0;
          estadisticas[user.user_id].dias++;

          const label = user.prediccion?.label || "regular";
          estadisticas[user.user_id][label]++;
        });
      }
    });

    return Object.values(estadisticas)
      .sort((a, b) => b.tiempo_total - a.tiempo_total)
      .slice(0, 10)
      .map(user => ({
        nombre: user.nombre?.split(' ')[0] || user.nombre || 'Usuario',
        tiempo: Math.round(user.tiempo_total / user.dias),
        actividades: Math.round(user.actividades_total / user.dias),
        revisiones: Math.round(user.revisiones_total / user.dias),
        porcentajeProductivo: ((user.productivo / user.dias) * 100).toFixed(1),
      }));
  }, [data]);

  // Procesar datos para gráfica de comparativa semanal
  const procesarComparativaColaboradores = useCallback(() => {
    if (!data?.daily_data) return [];

    const colaboradores = {};

    data.daily_data.forEach(day => {
      if (day.users) {
        day.users.forEach(user => {
          if (!colaboradores[user.user_id]) {
            colaboradores[user.user_id] = {
              nombre: user.colaborador?.split(' ')[0] || user.user_id,
              datos: [],
            };
          }

          const label = user.prediccion?.label || "regular";
          colaboradores[user.user_id].datos.push({
            fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            tiempo: user.tiempo_total || 0,
            estado: label,
          });
        });
      }
    });

    return Object.values(colaboradores).slice(0, 5);
  }, [data]);

  const tendenciaGeneral = procesarTendenciaGeneral();
  const datosUsuarioHistorico = procesarDatosUsuarioHistorico();
  const promedios = procesarPromediosUsuarios();
  const comparativaColaboradores = procesarComparativaColaboradores();

  if (err) return <p className="error-message">{err}</p>;
  if (!data) return <div className="loading-container"><div className="loading-spinner"></div><p>Cargando datos históricos...</p></div>;

  return (
    <div className="historico-container">
      <header className="historico-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📈 Histórico de Productividad</h1>
            <p>Evolución y tendencias de productividad en el tiempo</p>
          </div>
          <div className="header-controls">
            <div className="control-group">
              <label>Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="control-group">
              <label>Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="date-input"
              />
            </div>
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="btn-actualizar"
            >
              {loading ? "⏳ Cargando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </header>

      <div className="historico-content">
        {/* Sección 1: Tendencia General */}
        <section className="historico-section">
          <div className="section-title">
            <h2>📊 Tendencia General de Productividad</h2>
          </div>

          <div className="graphs-grid">
            {/* Gráfica de Barras Apiladas */}
            <div className="graph-card">
              <h3>Distribución Diaria</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={tendenciaGeneral}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="productivo" stackId="a" fill={COLORS.productivo} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="regular" stackId="a" fill={COLORS.regular} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="no_productivo" stackId="a" fill={COLORS.no_productivo} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Área - Total de Usuarios */}
            <div className="graph-card">
              <h3>Total de Usuarios por Día</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={tendenciaGeneral}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.productivo} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.productivo} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke={COLORS.productivo} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sección 2: Análisis por Usuario */}
        <section className="historico-section">
          <div className="section-title">
            <h2>👤 Análisis Individual de Colaborador</h2>
          </div>

          <div className="usuario-selector">
            <label>Seleccionar colaborador:</label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="select-usuario"
            >
              <option value="todos">Ver todos los colaboradores</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>

          {usuarioSeleccionado !== "todos" && datosUsuarioHistorico.length > 0 ? (
            <div className="graphs-grid">
              {/* Gráfica de Línea - Evolución de Tiempo */}
              <div className="graph-card">
                <h3>⏱️ Evolución de Tiempo de Trabajo</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={datosUsuarioHistorico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => formatearTiempo(value)}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tiempo"
                      stroke={COLORS.productivo}
                      strokeWidth={3}
                      dot={{ fill: COLORS.productivo, r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfica de Barras - Actividades y Revisiones */}
              <div className="graph-card">
                <h3>📋 Actividades vs Revisiones</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={datosUsuarioHistorico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="actividades" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="revisiones" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : usuarioSeleccionado === "todos" ? (
            <div className="no-data-message">
              <p>Selecciona un colaborador para ver su evolución detallada</p>
            </div>
          ) : (
            <div className="no-data-message">
              <p>No hay datos disponibles para este colaborador en el período seleccionado.</p>
            </div>
          )}
        </section>

        {/* Sección 3: Comparativa de Top Colaboradores */}
        <section className="historico-section">
          <div className="section-title">
            <h2>🏆 Top Colaboradores - Promedios del Período</h2>
          </div>

          <div className="graphs-grid-single">
            <div className="graph-card">
              <h3>Tiempo Promedio por Día</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={promedios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatearTiempo(value)}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="tiempo" fill={COLORS.productivo} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sección 4: Tabla de Resumen */}
        <section className="historico-section">
          <div className="section-title">
            <h2>📊 Resumen por Colaborador</h2>
          </div>

          <div className="resumen-table">
            <div className="table-header">
              <div className="table-cell">Colaborador</div>
              <div className="table-cell">Tiempo Promedio</div>
              <div className="table-cell">Act. Promedio</div>
              <div className="table-cell">Rev. Promedio</div>
              <div className="table-cell">% Productivo</div>
            </div>
            {promedios.map((user, idx) => (
              <div key={idx} className="table-row">
                <div className="table-cell">
                  <span className="user-badge">{user.nombre}</span>
                </div>
                <div className="table-cell">{formatearTiempo(user.tiempo)}</div>
                <div className="table-cell">{user.actividades}</div>
                <div className="table-cell">{user.revisiones}</div>
                <div className="table-cell">
                  <span className="percentage-badge" style={{ backgroundColor: COLORS.productivo }}>
                    {user.porcentajeProductivo}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}