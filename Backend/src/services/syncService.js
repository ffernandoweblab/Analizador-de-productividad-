const axios = require("axios");
const { pool } = require("../db");
const { buildDailyFeatures } = require("../utils/transform");

async function fetchActividades(start, end) {
  const { data } = await axios.get(process.env.WL_ACTIVIDADES_URL, { params: { start, end } });
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchRevisiones(start, end) {
  const { data } = await axios.get(process.env.WL_REVISIONES_URL, { params: { start, end } });
  return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
}

async function upsertDailyFeatures(rows) {
  const sql = `
    INSERT INTO daily_user_features
      (user_id, date, minutos_planeados, actividades_planeadas, pendientes_unchecked,
       minutos_trabajados, revisiones_terminadas, revisiones_confirmadas,
       dia_semana, productivo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      minutos_planeados = VALUES(minutos_planeados),
      actividades_planeadas = VALUES(actividades_planeadas),
      pendientes_unchecked = VALUES(pendientes_unchecked),
      minutos_trabajados = VALUES(minutos_trabajados),
      revisiones_terminadas = VALUES(revisiones_terminadas),
      revisiones_confirmadas = VALUES(revisiones_confirmadas),
      dia_semana = VALUES(dia_semana),
      productivo = VALUES(productivo),
      updated_at = CURRENT_TIMESTAMP
  `;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const r of rows) {
      await conn.execute(sql, [
        r.user_id, r.date,
        r.minutos_planeados, r.actividades_planeadas, r.pendientes_unchecked,
        r.minutos_trabajados, r.revisiones_terminadas, r.revisiones_confirmadas,
        r.dia_semana, r.productivo
      ]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function syncRange(start, end) {
  const [actividades, revisiones] = await Promise.all([
    fetchActividades(start, end),
    fetchRevisiones(start, end),
  ]);

  const dailyRows = buildDailyFeatures({ actividades, revisiones });

  // ✅ FILTRO CRÍTICO para que MySQL no truene con user_id null
  const validRows = dailyRows.filter(r => r.user_id && r.date);
  const invalid = dailyRows.length - validRows.length;

  if (invalid > 0) {
    console.warn(`[sync] Ignoring ${invalid} rows with missing user_id/date`);
  }

  await upsertDailyFeatures(validRows);

  return {
    start, end,
    actividades: actividades.length,
    revisiones: revisiones.length,
    dailyRows: validRows.length,
    ignored: invalid
  };
}

module.exports = { syncRange };
