// /**
//  * GET /api/productividad/hoy?date=YYYY-MM-DD (opcional)
//  * - Consulta revisiones por fecha (API externa)
//  * - Calcula actividades/revisiones/minutos por usuario
//  * - Llama al microservicio ML (/predict) por usuario
//  * - Devuelve array listo para cards en React
//  */
// require("dotenv").config();
// const express = require("express");
// const axios = require("axios");

// const router = express.Router();

// const DEFAULT_REV_URL =
//   "https://wlserver-production.up.railway.app/api/reportes/revisiones-por-fecha";

// const TZ = "America/Mexico_City";
// const START_HOUR = 9;
// const END_HOUR = 17; // exclusivo

// // Si quieres contar solo revisiones hechas 9-5
// const FILTRAR_POR_HORA_REVISION = true;

// function getTodayISOInTZ(timeZone) {
//   const now = new Date();
//   const fmt = new Intl.DateTimeFormat("en-CA", {
//     timeZone,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });
//   return fmt.format(now);
// }

// function getLocalParts(dateObj, timeZone) {
//   if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return null;
//   const fmt = new Intl.DateTimeFormat("en-CA", {
//     timeZone,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//     hourCycle: "h23",
//   });
//   const parts = fmt.formatToParts(dateObj);
//   const get = (type) => parts.find((p) => p.type === type)?.value;

//   const y = get("year");
//   const m = get("month");
//   const d = get("day");
//   const h = get("hour");
//   const min = get("minute");
//   if (!y || !m || !d || h == null || min == null) return null;

//   return { date: `${y}-${m}-${d}`, hour: Number(h), minute: Number(min) };
// }

// function revisionEnVentana9a5(rev, day) {
//   const ts = rev?.fechaFinTerminada || rev?.fechaCreacion;
//   if (!ts) return false;

//   const dt = new Date(ts);
//   const local = getLocalParts(dt, TZ);
//   if (!local) return false;
//   if (local.date !== day) return false;

//   const mins = local.hour * 60 + local.minute;
//   return mins >= START_HOUR * 60 && mins < END_HOUR * 60;
// }

// function esFtf00secPorTitulo(titulo) {
//   const t = String(titulo ?? "").toLowerCase();
//   return t.includes("ftf") || t.includes("00sec");
// }

// function resolveUserName(col) {
//   if (col?.name) return col.name;

//   const userId = col?.idAsignee;
//   const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];

//   for (const a of acts) {
//     for (const bucket of ["terminadas", "confirmadas", "pendientes"]) {
//       const revs = Array.isArray(a?.[bucket]) ? a[bucket] : [];
//       for (const r of revs) {
//         const asg = Array.isArray(r?.assignees) ? r.assignees : [];
//         const hit = asg.find((x) => x?.id === userId && x?.name);
//         if (hit?.name) return hit.name;
//       }
//     }
//   }
//   return userId || "unknown";
// }

// async function fetchColaboradores(day) {
//   const revUrl = process.env.WL_REVISIONES_POR_FECHA_URL || DEFAULT_REV_URL;
//   const { data } = await axios.get(revUrl, { params: { date: day } });
//   return Array.isArray(data?.data?.colaboradores) ? data.data.colaboradores : [];
// }

// function procesarColaboradorDia(col, day) {
//   const userId = col?.idAsignee;
//   if (!userId) return null;

//   const userName = resolveUserName(col);

//   let revisiones = 0;
//   let minutos = 0;
//   const actividadesSet = new Set();

//   const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];
//   const buckets = ["terminadas", "confirmadas", "pendientes"];

//   for (const a of acts) {
//     const actId = a?.id;
//     const actTitulo = a?.titulo;
//     if (!actId) continue;

//     if (esFtf00secPorTitulo(actTitulo)) continue;

//     for (const b of buckets) {
//       const revs = Array.isArray(a?.[b]) ? a[b] : [];
//       for (const r of revs) {
//         const dur = Number(r?.duracionMin ?? 0) || 0;
//         if (dur <= 0) continue;

//         if (FILTRAR_POR_HORA_REVISION) {
//           if (!revisionEnVentana9a5(r, day)) continue;
//         }

//         revisiones += 1;
//         minutos += dur;
//         actividadesSet.add(actId);
//       }
//     }
//   }

//   return {
//     date: day,
//     user_id: userId,
//     colaborador: userName,
//     actividades: actividadesSet.size,
//     revisiones,
//     tiempo_total: minutos,
//   };
// }

// async function predecirConModelo(features) {
//   const mlBase = process.env.ML_API_BASE || "http://127.0.0.1:8000";
//   const url = `${mlBase}/predict`;
//   const { data } = await axios.post(url, {
//     actividades: features.actividades,
//     revisiones: features.revisiones,
//     tiempo_total: features.tiempo_total,
//   });
//   return data;
// }

// // router.get("/hoy", async (req, res) => {
// //   try {
// //     const day = String(req.query.date || "").trim() || getTodayISOInTZ(TZ);

// //     const colaboradores = await fetchColaboradores(day);

// //     const rows = colaboradores
// //       .map((c) => procesarColaboradorDia(c, day))
// //       .filter(Boolean);

// //     // Predicción por usuario (paralelo)
// //     const users = await Promise.all(
// //       rows.map(async (r) => ({
// //         ...r,
// //         prediccion: await predecirConModelo(r),
// //       }))
// //     );

// //     // Ordena por minutos desc (opcional)
// //     users.sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0));

// //     return res.json({ date: day, users });
// //   } catch (err) {
// //     const msg = err?.message || String(err);
// //     return res.status(500).json({ error: msg });
// //   }
// // });


// // ---- FILTRO DE USUARIOS (exclusión) ----
// const EXCLUDE_DOMAINS = new Set(["officlean.com", "aluvri.com"]);
// const EXCLUDE_USER_IDS = new Set(["2dad872b594c81c8ae6500026864f907"]);

// router.get("/hoy", async (req, res) => {
//   try {
//     const day = String(req.query.date || "").trim() || getTodayISOInTZ(TZ);

//     let colaboradores = await fetchColaboradores(day);

//     // ---- APLICAR FILTRO DE EXCLUSIÓN ----
//     colaboradores = colaboradores.filter((col) => {
//       const userId = col?.idAsignee;

//       // Excluir por ID
//       if (EXCLUDE_USER_IDS.has(userId)) {
//         console.log(`[FILTRO] Excluyendo usuario por ID: ${userId}`);
//         return false;
//       }

//       // Excluir por dominio de email
//       if (col?.email) {
//         const domain = col.email.split("@")[1];
//         if (EXCLUDE_DOMAINS.has(domain)) {
//           console.log(`[FILTRO] Excluyendo usuario por dominio: ${domain}`);
//           return false;
//         }
//       }

//       return true;
//     });

//     const rows = colaboradores
//       .map((c) => procesarColaboradorDia(c, day))
//       .filter(Boolean);

//     // Predicción por usuario (paralelo)
//     const users = await Promise.all(
//       rows.map(async (r) => ({
//         ...r,
//         prediccion: await predecirConModelo(r),
//       }))
//     );

//     // Ordena por minutos desc (opcional)
//     users.sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0));

//     return res.json({ date: day, users });
//   } catch (err) {
//     const msg = err?.message || String(err);
//     return res.status(500).json({ error: msg });
//   }
// });




// module.exports = router;

/**
 * GET /api/productividad/hoy?date=YYYY-MM-DD (opcional)
 * - Consulta revisiones por fecha (API externa)
 * - Calcula actividades/revisiones/minutos por usuario
 * - NUEVO: Calcula revisiones_con_duracion y revisiones_sin_duracion
 * - Llama al microservicio ML (/predict) por usuario
 * - Devuelve array listo para cards en React
 */
require("dotenv").config();
const express = require("express");
const axios = require("axios");

const router = express.Router();

const DEFAULT_REV_URL =
  "https://wlserver-production.up.railway.app/api/reportes/revisiones-por-fecha";

const TZ = "America/Mexico_City";
const START_HOUR = 9;
const END_HOUR = 17; // exclusivo

// Si quieres contar solo revisiones hechas 9-5
const FILTRAR_POR_HORA_REVISION = true;

function getTodayISOInTZ(timeZone) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now);
}

function getLocalParts(dateObj, timeZone) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(dateObj);
  const get = (type) => parts.find((p) => p.type === type)?.value;

  const y = get("year");
  const m = get("month");
  const d = get("day");
  const h = get("hour");
  const min = get("minute");
  if (!y || !m || !d || h == null || min == null) return null;

  return { date: `${y}-${m}-${d}`, hour: Number(h), minute: Number(min) };
}

function revisionEnVentana9a5(rev, day) {
  const ts = rev?.fechaFinTerminada || rev?.fechaCreacion;
  if (!ts) return false;

  const dt = new Date(ts);
  const local = getLocalParts(dt, TZ);
  if (!local) return false;
  if (local.date !== day) return false;

  const mins = local.hour * 60 + local.minute;
  return mins >= START_HOUR * 60 && mins < END_HOUR * 60;
}

function esFtf00secPorTitulo(titulo) {
  const t = String(titulo ?? "").toLowerCase();
  return t.includes("ftf") || t.includes("00sec");
}

function resolveUserName(col) {
  if (col?.name) return col.name;

  const userId = col?.idAsignee;
  const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];

  for (const a of acts) {
    for (const bucket of ["terminadas", "confirmadas", "pendientes"]) {
      const revs = Array.isArray(a?.[bucket]) ? a[bucket] : [];
      for (const r of revs) {
        const asg = Array.isArray(r?.assignees) ? r.assignees : [];
        const hit = asg.find((x) => x?.id === userId && x?.name);
        if (hit?.name) return hit.name;
      }
    }
  }
  return userId || "unknown";
}

async function fetchColaboradores(day) {
  const revUrl = process.env.WL_REVISIONES_POR_FECHA_URL || DEFAULT_REV_URL;
  const { data } = await axios.get(revUrl, { params: { date: day } });
  return Array.isArray(data?.data?.colaboradores) ? data.data.colaboradores : [];
}

function procesarColaboradorDia(col, day) {
  const userId = col?.idAsignee;
  if (!userId) return null;

  const userName = resolveUserName(col);

  // ---- NUEVOS CONTADORES ----
  let revisiones = 0; // Total de revisiones (con + sin duración)
  let revisiones_con_duracion = 0; // Revisiones que sí tienen duracionMin > 0
  let revisiones_sin_duracion = 0; // Revisiones que NO tienen duración
  let minutos = 0;
  const actividadesSet = new Set();

  const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];
  const buckets = ["terminadas", "confirmadas", "pendientes"];

  for (const a of acts) {
    const actId = a?.id;
    const actTitulo = a?.titulo;
    if (!actId) continue;

    if (esFtf00secPorTitulo(actTitulo)) continue;

    for (const b of buckets) {
      const revs = Array.isArray(a?.[b]) ? a[b] : [];
      for (const r of revs) {
        const dur = Number(r?.duracionMin ?? 0) || 0;

        // ---- FILTRO HORARIO PRIMERO ----
        if (FILTRAR_POR_HORA_REVISION) {
          if (!revisionEnVentana9a5(r, day)) continue;
        }

        // ---- CONTAR TODA REVISIÓN QUE PASA FILTRO ----
        revisiones += 1;

        // ---- DIFERENCIAR ENTRE CON/SIN DURACIÓN ----
        if (dur > 0) {
          revisiones_con_duracion += 1;
          minutos += dur;
          actividadesSet.add(actId);
        } else {
          revisiones_sin_duracion += 1;
        }
      }
    }
  }

  return {
    date: day,
    user_id: userId,
    colaborador: userName,
    actividades: actividadesSet.size,
    revisiones,
    revisiones_con_duracion,
    revisiones_sin_duracion,
    tiempo_total: minutos,
  };
}

async function predecirConModelo(features) {
  const mlBase = process.env.ML_API_BASE || "http://127.0.0.1:8000";
  const url = `${mlBase}/predict`;
  const { data } = await axios.post(url, {
    actividades: features.actividades,
    revisiones_con_duracion: features.revisiones_con_duracion,
    revisiones_sin_duracion: features.revisiones_sin_duracion,
    tiempo_total: features.tiempo_total,
  });
  return data;
}

// ---- FILTRO DE USUARIOS (exclusión) ----
const EXCLUDE_DOMAINS = new Set(["officlean.com", "aluvri.com"]);
const EXCLUDE_USER_IDS = new Set(["2dad872b594c81c8ae6500026864f907"]);

router.get("/hoy", async (req, res) => {
  try {
    const day = String(req.query.date || "").trim() || getTodayISOInTZ(TZ);

    let colaboradores = await fetchColaboradores(day);

    // ---- APLICAR FILTRO DE EXCLUSIÓN ----
    colaboradores = colaboradores.filter((col) => {
      const userId = col?.idAsignee;

      // Excluir por ID
      if (EXCLUDE_USER_IDS.has(userId)) {
        console.log(`[FILTRO] Excluyendo usuario por ID: ${userId}`);
        return false;
      }

      // Excluir por dominio de email
      if (col?.email) {
        const domain = col.email.split("@")[1];
        if (EXCLUDE_DOMAINS.has(domain)) {
          console.log(`[FILTRO] Excluyendo usuario por dominio: ${domain}`);
          return false;
        }
      }

      return true;
    });

    const rows = colaboradores
      .map((c) => procesarColaboradorDia(c, day))
      .filter(Boolean);

    // Predicción por usuario (paralelo)
    const users = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        prediccion: await predecirConModelo(r),
      }))
    );

    // Ordena por minutos desc (opcional)
    users.sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0));

    return res.json({ date: day, users });
  } catch (err) {
    const msg = err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
});

module.exports = router;