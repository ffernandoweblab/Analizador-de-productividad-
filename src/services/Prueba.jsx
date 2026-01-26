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
} from "recharts";
import './Prueba.css';

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

export default function Prueba() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().slice(0, 10)
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
      console.log(`[Prueba] Cargando datos desde ${fechaInicio} hasta ${fechaFin}...`);

      // ✅ NUEVA FORMA: Usar la ruta /rango que aplica el mismo modelo que /hoy
      const res = await fetch(
        `/api/productividad/rango?start=${fechaInicio}&end=${fechaFin}`
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const datosCompletos = await res.json();
      console.log(`[Prueba] Datos recibidos:`, datosCompletos);

      // Transformar datos al formato esperado
      const datosConsolidados = {
        daily_data: (datosCompletos.daily_data || []).map(day => ({
          date: day.date,
          usuarios: (day.users || []).map(user => ({
            user_id: user.user_id,
            colaborador: user.colaborador,
            actividades: user.actividades,
            revisiones: user.revisiones,
            revisiones_con_duracion: user.revisiones_con_duracion,
            revisiones_sin_duracion: user.revisiones_sin_duracion,
            tiempo_total: user.tiempo_total,
            prediccion: user.prediccion,
          })),
        })),
      };

      setData(datosConsolidados);

      // Extraer usuarios únicos
      const usuariosUnicos = [];
      const userIds = new Set();

      datosConsolidados.daily_data.forEach(day => {
        day.usuarios.forEach(user => {
          if (!userIds.has(user.user_id)) {
            userIds.add(user.user_id);
            usuariosUnicos.push({
              id: user.user_id,
              nombre: user.colaborador,
            });
          }
        });
      });

      setUsuarios(usuariosUnicos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      console.log(`[Prueba] Completado: ${datosConsolidados.daily_data.length} días, ${usuariosUnicos.length} colaboradores`);
    } catch (e) {
      setErr(e?.message || String(e));
      console.error("[Prueba] Error:", e);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Procesar tendencia general
  const procesarTendenciaGeneral = useCallback(() => {
    if (!data?.daily_data) return [];

    return data.daily_data.map(day => {
      let totalRevisiones = 0;
      let totalActividades = 0;
      let totalTiempo = 0;
      let totalUsuarios = 0;
      let productivos = 0;
      let regulares = 0;
      let noProductivos = 0;

      day.usuarios.forEach(user => {
        totalRevisiones += user.revisiones || 0;
        totalActividades += user.actividades || 0;
        totalTiempo += user.tiempo_total || 0;
        totalUsuarios += 1;

        // Contar por predicción
        const label = user.prediccion?.label || "regular";
        if (label === "productivo") productivos += 1;
        else if (label === "regular") regulares += 1;
        else if (label === "no_productivo") noProductivos += 1;
      });

      return {
        fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        fechaCompleta: day.date,
        revisiones: totalRevisiones,
        actividades: totalActividades,
        tiempo: totalTiempo,
        usuarios: totalUsuarios,
        productivos,
        regulares,
        noProductivos,
      };
    });
  }, [data]);

  // Procesar datos de usuario específico
  const procesarDatosUsuarioHistorico = useCallback(() => {
    if (!data?.daily_data || usuarioSeleccionado === "todos") return [];

    return data.daily_data
      .map(day => {
        const usuario = day.usuarios.find(u => u.user_id === usuarioSeleccionado);
        if (!usuario) return null;

        return {
          fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          fechaCompleta: day.date,
          revisiones: usuario.revisiones,
          tiempo: usuario.tiempo_total,
          actividades: usuario.actividades,
          label: usuario.prediccion?.label || "regular",
        };
      })
      .filter(Boolean);
  }, [data, usuarioSeleccionado]);

  // Procesar promedios por usuario
  const procesarPromediosUsuarios = useCallback(() => {
    if (!data?.daily_data) return [];

    const estadisticas = {};

    data.daily_data.forEach(day => {
      day.usuarios.forEach(user => {
        if (!estadisticas[user.user_id]) {
          estadisticas[user.user_id] = {
            nombre: user.colaborador,
            revisiones_total: 0,
            actividades_total: 0,
            tiempo_total: 0,
            dias: 0,
            productivo: 0,
            regular: 0,
            no_productivo: 0,
          };
        }
        estadisticas[user.user_id].revisiones_total += user.revisiones || 0;
        estadisticas[user.user_id].actividades_total += user.actividades || 0;
        estadisticas[user.user_id].tiempo_total += user.tiempo_total || 0;
        estadisticas[user.user_id].dias++;

        // Contar predicciones
        const label = user.prediccion?.label || "regular";
        if (label === "productivo") estadisticas[user.user_id].productivo++;
        else if (label === "regular") estadisticas[user.user_id].regular++;
        else if (label === "no_productivo") estadisticas[user.user_id].no_productivo++;
      });
    });

    return Object.values(estadisticas)
      .sort((a, b) => b.revisiones_total - a.revisiones_total)
      .slice(0, 10)
      .map(user => ({
        nombre: user.nombre?.split(' ')[0] || user.nombre || 'Usuario',
        revisiones: Math.round(user.revisiones_total / user.dias),
        actividades: Math.round(user.actividades_total / user.dias),
        tiempo: Math.round(user.tiempo_total / user.dias),
        porcentajeProductivo: ((user.productivo / user.dias) * 100).toFixed(1),
      }));
  }, [data]);

  const tendenciaGeneral = procesarTendenciaGeneral();
  const datosUsuarioHistorico = procesarDatosUsuarioHistorico();
  const promedios = procesarPromediosUsuarios();

  if (err) return <p className="error-message">{err}</p>;
  if (!data) return <div className="loading-container"><div className="loading-spinner"></div><p>Cargando datos históricos...</p></div>;

  return (
    <div className="prueba-container">
      <header className="prueba-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📊 Histórico de Productividad</h1>
            <p>Evolución con modelo ML aplicado</p>
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

      <div className="prueba-content">
        {/* Sección 1: Tendencia General */}
        <section className="prueba-section">
          <div className="section-title">
            <h2>📈 Tendencia General - Revisiones por Día</h2>
          </div>

          <div className="graphs-grid">
            <div className="graph-card">
              <h3>Revisiones Diarias</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={tendenciaGeneral}>
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
                  <Line
                    type="monotone"
                    dataKey="revisiones"
                    stroke={COLORS.productivo}
                    strokeWidth={3}
                    dot={{ fill: COLORS.productivo, r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="graph-card">
              <h3>Tiempo Total por Día</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={tendenciaGeneral}>
                  <defs>
                    <linearGradient id="colorTiempo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.productivo} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.productivo} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="tiempo" stroke={COLORS.productivo} fillOpacity={1} fill="url(#colorTiempo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sección 2: Análisis Individual */}
        <section className="prueba-section">
          <div className="section-title">
            <h2>👤 Análisis Individual</h2>
          </div>

          <div className="usuario-selector">
            <label>Seleccionar colaborador:</label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="select-usuario"
            >
              <option value="todos">Ver todos</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>

          {usuarioSeleccionado !== "todos" && datosUsuarioHistorico.length > 0 ? (
            <div className="graphs-grid">
              <div className="graph-card">
                <h3>⏱️ Evolución de Tiempo</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={datosUsuarioHistorico}>
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
                    <Bar dataKey="tiempo" fill={COLORS.productivo} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="graph-card">
                <h3>✅ Evolución de Revisiones</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={datosUsuarioHistorico}>
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
                    <Line
                      type="monotone"
                      dataKey="revisiones"
                      stroke={COLORS.regular}
                      strokeWidth={3}
                      dot={{ fill: COLORS.regular, r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : usuarioSeleccionado === "todos" ? (
            <div className="no-data-message">
              <p>Selecciona un colaborador para ver su evolución</p>
            </div>
          ) : (
            <div className="no-data-message">
              <p>No hay datos para este colaborador</p>
            </div>
          )}
        </section>

        {/* Sección 3: Tabla de Promedios */}
        <section className="prueba-section">
          <div className="section-title">
            <h2>🏆 Promedios por Colaborador (Último período)</h2>
          </div>

          <div className="promedios-table">
            <div className="table-header">
              <div className="table-cell">Colaborador</div>
              <div className="table-cell">Rev. Promedio</div>
              <div className="table-cell">Act. Promedio</div>
              <div className="table-cell">Tiempo Promedio</div>
              <div className="table-cell">% Productivo</div>
            </div>
            {promedios.map((user, idx) => (
              <div key={idx} className="table-row">
                <div className="table-cell">{user.nombre}</div>
                <div className="table-cell">{user.revisiones}</div>
                <div className="table-cell">{user.actividades}</div>
                <div className="table-cell">{formatearTiempo(user.tiempo)}</div>
                <div className="table-cell">
                  <span style={{ color: user.porcentajeProductivo > 50 ? COLORS.productivo : COLORS.regular }}>
                    {user.porcentajeProductivo}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Debug: Mostrar datos crudos */}
        <section className="prueba-section debug-section">
          <div className="section-title">
            <h2>🔍 Debug - Datos Procesados</h2>
          </div>
          <pre className="debug-content">
            {JSON.stringify({
              dias: data?.daily_data?.length,
              usuariosUnicos: usuarios.length,
              primerDia: data?.daily_data?.[0],
              ultimoDia: data?.daily_data?.[data.daily_data.length - 1],
            }, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}