'use client';

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import './ReportesDiarios.css';

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

export default function ReportesDiarios() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/productividad/hoy?date=${fecha}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Procesar datos para gráficas
  const procesarDatosGenerales = useCallback(() => {
    if (!data?.users) return [];

    const contadores = {
      productivo: 0,
      regular: 0,
      no_productivo: 0,
    };

    data.users.forEach(user => {
      const label = user.prediccion?.label || "regular";
      contadores[label]++;
    });

    return [
      { name: "Productivo", count: contadores.productivo, fill: COLORS.productivo },
      { name: "Regular", count: contadores.regular, fill: COLORS.regular },
      { name: "No Productivo", count: contadores.no_productivo, fill: COLORS.no_productivo },
    ].filter(item => item.count > 0);
  }, [data]);

  const procesarPromediosUsuarios = useCallback(() => {
    if (!data?.users) return [];

    return data.users
      .sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0))
      .slice(0, 8)
      .map(user => {
        const label = user.prediccion?.label || "regular";
        const productivo = label === "productivo" ? 100 : label === "regular" ? 50 : 0;
        const regular = label === "regular" ? 100 : label === "productivo" ? 50 : 50;
        const no_productivo = label === "no_productivo" ? 100 : label === "regular" ? 50 : 0;

        return {
          nombre: user.colaborador?.split(' ')[0] || user.user_id,
          productivo: productivo,
          regular: regular,
          no_productivo: no_productivo,
        };
      });
  }, [data]);

  const distribucion = procesarDatosGenerales();
  const promedios = procesarPromediosUsuarios();
  const usuarios = data?.users || [];

  // Datos para gráfica de barras horizontal de usuarios
  const datosUsuarios = usuarios
    .sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0))
    .slice(0, 10)
    .map(user => ({
      nombre: user.colaborador,
      tiempo: user.tiempo_total || 0,
      actividades: user.actividades || 0,
      revisiones: user.revisiones || 0,
      estado: user.prediccion?.label || "regular",
    }));

  if (err) return <p className="error-message">{err}</p>;
  if (!data) return <div className="loading-container"><div className="loading-spinner"></div><p>Cargando datos...</p></div>;

  return (
    <div className="reportes-container">
      <header className="reportes-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📊 Reporte de Productividad - Hoy</h1>
            <p>Análisis detallado del desempeño de hoy</p>
          </div>
          <div className="header-controls">
            <div className="control-group">
              <label>Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
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

      <div className="reportes-content">
        {/* Sección 1: Gráficas Principales */}
        <section className="reportes-section">
          <div className="section-title">
            <h2>Vista General del Día</h2>
          </div>

          <div className="graphs-grid">
            {/* Gráfica Circular - Distribución */}
            <div className="graph-card">
              <h3>🎯 Distribución de Productividad</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribucion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) =>
                      `${name}: ${count} usuarios`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {distribucion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Barras Verticales - Top Usuarios por Tiempo */}
            <div className="graph-card">
              <h3>⏱️ Top Usuarios por Tiempo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={datosUsuarios}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={(value) => formatearTiempo(value)}
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="tiempo" fill={COLORS.productivo} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="graphs-grid">
            {/* Gráfica de Barras - Actividades y Revisiones */}
            <div className="graph-card">
              <h3>📋 Actividades vs Revisiones</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={datosUsuarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
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

            {/* Gráfica Radar - Comparativa de Top Usuarios */}
            <div className="graph-card">
              <h3>⭐ Comparativa de Usuarios</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={promedios}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Radar
                    name="Productivo"
                    dataKey="productivo"
                    stroke={COLORS.productivo}
                    fill={COLORS.productivo}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Regular"
                    dataKey="regular"
                    stroke={COLORS.regular}
                    fill={COLORS.regular}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="No Productivo"
                    dataKey="no_productivo"
                    stroke={COLORS.no_productivo}
                    fill={COLORS.no_productivo}
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sección 2: Estadísticas Clave */}
        <section className="reportes-section">
          <div className="section-title">
            <h2>Estadísticas Clave</h2>
          </div>

          <div className="stats-grid">
            {distribucion.length > 0 && (
              <>
                {distribucion.map((item) => {
                  const total = distribucion.reduce((sum, d) => sum + d.count, 0);
                  const porcentaje = ((item.count / total) * 100).toFixed(1);
                  return (
                    <div key={item.name} className="stat-card">
                      <div className="stat-icon" style={{ backgroundColor: item.fill }}>
                        {item.name === "Productivo" && "✓"}
                        {item.name === "Regular" && "→"}
                        {item.name === "No Productivo" && "✗"}
                      </div>
                      <div className="stat-info">
                        <h4>{item.name}</h4>
                        <p className="stat-value">{item.count} usuarios</p>
                        <p className="stat-percentage">{porcentaje}%</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>

        {/* Sección 3: Resumen de Usuarios */}
        <section className="reportes-section">
          <div className="section-title">
            <h2>Detalle de Usuarios</h2>
          </div>

          <div className="usuarios-table">
            <div className="table-header">
              <div className="table-cell">Usuario</div>
              <div className="table-cell">Estado</div>
              <div className="table-cell">Tiempo</div>
              <div className="table-cell">Actividades</div>
              <div className="table-cell">Revisiones</div>
            </div>
            {usuarios.map((user) => {
              const estado = user.prediccion?.label || "regular";
              const colorEstado = COLORS[estado];
              return (
                <div key={user.user_id} className="table-row">
                  <div className="table-cell">
                    <span className="user-name">{user.colaborador}</span>
                  </div>
                  <div className="table-cell">
                    <span className="badge" style={{ backgroundColor: colorEstado }}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </span>
                  </div>
                  <div className="table-cell">{formatearTiempo(user.tiempo_total)}</div>
                  <div className="table-cell">{user.actividades}</div>
                  <div className="table-cell">{user.revisiones}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
} 