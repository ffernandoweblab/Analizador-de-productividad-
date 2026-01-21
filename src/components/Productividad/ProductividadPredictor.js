// src/components/Productividad/ProductividadCards.jsx
import React, { useCallback, useEffect, useState } from "react";

const LABEL_PRETTY = {
  no_productivo: "No productivo",
  regular: "Regular",
  productivo: "Productivo",
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

  const cargarHoy = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/productividad/hoy");
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHoy();
    const id = setInterval(cargarHoy, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(id);
  }, [cargarHoy]);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!data) return <p>Cargando...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Predicción del día: {data.date}</h2>
        <button onClick={cargarHoy} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {data.users.map((u) => (
          <div
            key={u.user_id}
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
          >
            <h3 style={{ margin: 0 }}>{u.colaborador}</h3>
            <small>{u.user_id}</small>

            <div style={{ marginTop: 8 }}>
              <div>
                Actividades: <b>{u.actividades}</b>
              </div>
              <div>
                Revisiones: <b>{u.revisiones}</b>
              </div>
              <div>
                Minutos: <b>{u.tiempo_total}</b>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              Predicción: <b>{prettyLabel(u.prediccion?.label)}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
