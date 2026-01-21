// src/components/Productividad/ProductividadCards.jsx
import React, { useCallback, useEffect, useState } from "react";
import './ProductividadCards.css';

const LABEL_PRETTY = {
  no_productivo: "No productivo",
  regular: "Regular",
  productivo: "Productivo",
};

const DESCRIPTIONS = {
  no_productivo: "Tuviste una productividad baja. Puedes mejorar.",
  regular: "Tuviste una productividad regular. Puedes mejorar.",
  productivo: "¡Fuste muy productivo hoy! Excelente desempeño.",
};

function prettyLabel(label) {
  if (!label) return "";
  return (
    LABEL_PRETTY[label] ??
    String(label)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export default function ProductividadCards() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  );


  const cargar = useCallback(async () => {
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
    cargar();
    const id = setInterval(cargar, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [cargar]);


  if (err) return <p className="error-message">{err}</p>;
  if (!data) return <p className="loading-message">Cargando...</p>;

  return (
    <div className="productividad-container">
      <div className="productividad-header">
        <h2>Predicción del día: {data.date}</h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button onClick={cargar} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>


      <div className="productividad-grid">
        {data.users.map((u) => {
          const prediccion = u.prediccion?.label || "regular";
          return (
            <div
              key={u.user_id}
              className={`productividad-card ${prediccion}`}
            >
              <div className="productividad-card-header">
                <div>
                  <h3>{u.colaborador}</h3>
                  <small>{u.user_id}</small>
                </div>
                <span className={`productividad-badge ${prediccion}`}>
                  {prettyLabel(prediccion)}
                </span>
              </div>

              <p className="productividad-card-description">
                {DESCRIPTIONS[prediccion]}
              </p>

              <div className="productividad-card-stats">
                <div className="stat-item">
                  <div className="stat-label">📋 Actividades</div>
                  <div className="stat-value">{u.actividades}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">✓ Revisiones</div>
                  <div className="stat-value">{u.revisiones}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">⏱ Tiempo</div>
                  <div className="stat-value">{u.tiempo_total}</div>
                  <div className="stat-unit">min</div>
                </div>
              </div>

              <div className="productividad-card-progress">
                <div className="progress-item">
                  <div className="progress-label">No Productivo</div>
                  <div className="progress-bar-container">
                    <div className="progress-bar no-productivo" style={{ width: "0%" }}></div>
                  </div>
                  <div className="progress-percentage">0.0%</div>
                </div>
                <div className="progress-item">
                  <div className="progress-label">Regular</div>
                  <div className="progress-bar-container">
                    <div className="progress-bar regular" style={{ width: "74.5%" }}></div>
                  </div>
                  <div className="progress-percentage">74.5%</div>
                </div>
                <div className="progress-item">
                  <div className="progress-label">Productivo</div>
                  <div className="progress-bar-container">
                    <div className="progress-bar productivo" style={{ width: "25.5%" }}></div>
                  </div>
                  <div className="progress-percentage">25.5%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}