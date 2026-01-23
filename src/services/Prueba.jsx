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
      // ✅ PASO 1: Generar array de fechas
      const fechas = [];
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);

      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().slice(0, 10);
        fechas.push(fechaStr);
      }

      console.log(`[Prueba] Cargando ${fechas.length} días...`);

      // ✅ PASO 2: Obtener REVISIONES para cada día
      const revisionesPorDia = {};
      const actividadesIds = new Set();

      const promesasRevisiones = fechas.map(fecha =>
        fetch(`https://wlserver-production.up.railway.app/api/reportes/revisiones-por-fecha?date=${fecha}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.data?.colaboradores) {
              revisionesPorDia[fecha] = data.data.colaboradores;

              // Extraer IDs de actividades
              data.data.colaboradores.forEach(col => {
                const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];
                acts.forEach(act => {
                  if (act?.id) actividadesIds.add(act.id);
                });
              });
            }
            return null;
          })
          .catch(err => {
            console.warn(`[Prueba] Error cargando revisiones del ${fecha}:`, err);
            return null;
          })
      );

      await Promise.all(promesasRevisiones);
      console.log(`[Prueba] Se encontraron ${actividadesIds.size} actividades únicas`);

      // ✅ PASO 3: Obtener ACTIVIDADES del rango completo
      let actividadesPorId = {};
      try {
        const resAct = await fetch(
          `https://wlserver-production.up.railway.app/api/actividades/fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
        );
        if (resAct.ok) {
          const dataAct = await resAct.json();
          const acts = Array.isArray(dataAct?.data) ? dataAct.data : [];
          acts.forEach(act => {
            if (act?.id) {
              actividadesPorId[act.id] = act;
            }
          });
        }
      } catch (e) {
        console.warn("[Prueba] Error cargando actividades:", e);
      }

      // ✅ PASO 4: Consolidar datos por día y por usuario
      const datosConsolidados = {
        daily_data: fechas.map(fecha => {
          const colaboradores = revisionesPorDia[fecha] || [];

          return {
            date: fecha,
            usuarios: colaboradores.map(col => {
              const userId = col?.idAsignee;
              const nombreUsuario = col?.name || userId;

              // Contar revisiones de este colaborador en este día
              let revisiones = 0;
              let minutos = 0;
              const actividadesSet = new Set();

              const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];
              const buckets = ["terminadas", "confirmadas", "pendientes"];

              for (const a of acts) {
                const actId = a?.id;
                if (!actId) continue;

                actividadesSet.add(actId);

                for (const b of buckets) {
                  const revs = Array.isArray(a?.[b]) ? a[b] : [];
                  for (const r of revs) {
                    const dur = Number(r?.duracionMin ?? 0) || 0;
                    revisiones += 1;
                    if (dur > 0) minutos += dur;
                  }
                }
              }

              return {
                user_id: userId,
                colaborador: nombreUsuario,
                actividades: actividadesSet.size,
                revisiones,
                tiempo_total: minutos,
                fecha,
              };
            }).filter(u => u.revisiones > 0 || u.actividades > 0), // Solo usuarios con datos
          };
        }).filter(day => day.usuarios.length > 0), // Solo días con datos
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

      day.usuarios.forEach(user => {
        totalRevisiones += user.revisiones;
        totalActividades += user.actividades;
        totalTiempo += user.tiempo_total;
        totalUsuarios += 1;
      });

      return {
        fecha: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        fechaCompleta: day.date,
        revisiones: totalRevisiones,
        actividades: totalActividades,
        tiempo: totalTiempo,
        usuarios: totalUsuarios,
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
          };
        }
        estadisticas[user.user_id].revisiones_total += user.revisiones;
        estadisticas[user.user_id].actividades_total += user.actividades;
        estadisticas[user.user_id].tiempo_total += user.tiempo_total;
        estadisticas[user.user_id].dias++;
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
            <h1>📊 Histórico de Productividad (Prueba)</h1>
            <p>Evolución de revisiones y actividades en el tiempo</p>
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
            <h2>🏆 Promedios por Colaborador</h2>
          </div>

          <div className="promedios-table">
            <div className="table-header">
              <div className="table-cell">Colaborador</div>
              <div className="table-cell">Rev. Promedio</div>
              <div className="table-cell">Act. Promedio</div>
              <div className="table-cell">Tiempo Promedio</div>
            </div>
            {promedios.map((user, idx) => (
              <div key={idx} className="table-row">
                <div className="table-cell">{user.nombre}</div>
                <div className="table-cell">{user.revisiones}</div>
                <div className="table-cell">{user.actividades}</div>
                <div className="table-cell">{formatearTiempo(user.tiempo)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Debug: Mostrar datos crudos */}
        <section className="prueba-section debug-section">
          <div className="section-title">
            <h2>🔍 Debug - Datos Crudos</h2>
          </div>
          <pre className="debug-content">
            {JSON.stringify({
              dias: data?.daily_data?.length,
              usuariosUnicos: usuarios.length,
              dataPrueba: data?.daily_data?.slice(0, 2),
            }, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}