'use client';

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
  productivo: "Fuiste muy productivo hoy. Excelente desempeno.",
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
  if (!data) return <div className="loading-container"><div className="loading-spinner"></div><p>Cargando datos...</p></div>;

  return (
    <div className="productividad-container">
      <div className="productividad-header">
        <div className="header-title">
          <h2>Panel de Productividad</h2>
          <p className="header-subtitle">Prediccion del dia: {data.date}</p>
        </div>

        <div className="header-controls">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="date-input"
          />
          <button onClick={cargar} disabled={loading} className="search-button">
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="productividad-grid">
        {data.users.map((u) => {
          const prediccion = u.prediccion?.label || "regular";
          const probabilities = u.prediccion?.probabilities || {};
          
          return (
            <div
              key={u.user_id}
              className={`productividad-card ${prediccion}`}
            >
              <div className="productividad-card-header">
                <div className="user-info">
                  <div className={`user-avatar ${prediccion}`}>
                    {u.colaborador?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3>{u.colaborador}</h3>
                    <small>{u.user_id}</small>
                  </div>
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
                  <div className="stat-icon actividades">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                      <path d="M12 11h4"/>
                      <path d="M12 16h4"/>
                      <path d="M8 11h.01"/>
                      <path d="M8 16h.01"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{u.actividades}</div>
                    <div className="stat-label">Actividades</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon revisiones">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{u.revisiones}</div>
                    <div className="stat-label">Revisiones</div>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon tiempo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{u.tiempo_total}<span className="stat-unit">min</span></div>
                    <div className="stat-label">Tiempo Total</div>
                  </div>
                </div>
              </div>

              <div className="productividad-card-progress">
                <h4 className="progress-title">Distribucion de Probabilidades</h4>
                <div className="progress-item">
                  <div className="progress-label">
                    <span className="progress-dot no-productivo"></span>
                    No Productivo
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar no-productivo" 
                      style={{ width: `${(probabilities.no_productivo || 0) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">{((probabilities.no_productivo || 0) * 100).toFixed(1)}%</div>
                </div>
                <div className="progress-item">
                  <div className="progress-label">
                    <span className="progress-dot regular"></span>
                    Regular
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar regular" 
                      style={{ width: `${(probabilities.regular || 0) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">{((probabilities.regular || 0) * 100).toFixed(1)}%</div>
                </div>
                <div className="progress-item">
                  <div className="progress-label">
                    <span className="progress-dot productivo"></span>
                    Productivo
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar productivo" 
                      style={{ width: `${(probabilities.productivo || 0) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">{((probabilities.productivo || 0) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
