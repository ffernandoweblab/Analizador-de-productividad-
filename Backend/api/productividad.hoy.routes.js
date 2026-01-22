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
 * - Consulta actividades por fecha (para obtener dueStart)
 * - Filtra actividades que estén programadas 9-5 (dueStart)
 * - Excluye ftf y 00sec
 * - Calcula actividades/revisiones/minutos por usuario
 * - NUEVO: Calcula revisiones_con_duracion y revisiones_sin_duracion
 * - Llama al microservicio ML (/predict) por usuario
 * - Devuelve array listo para cards en React
 */
require("dotenv").config();
const express = require("express");
const axios = require("axios");

const router = express.Router();

const DEFAULT_ACT_URL = "https://wlserver-production.up.railway.app/api/actividades";
const DEFAULT_REV_URL =
  "https://wlserver-production.up.railway.app/api/reportes/revisiones-por-fecha";

const TZ = "America/Mexico_City";
const START_HOUR = 9;
const END_HOUR = 17; // exclusivo

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

// ---- NUEVO: Filtro por dueStart (cuándo está PROGRAMADA) ----
function isDueStartBetween9and5Local(dueStartStr, day, timeZone) {
  if (!dueStartStr) return { ok: false, reason: "no_dueStart" };

  const dt = new Date(dueStartStr);
  const local = getLocalParts(dt, timeZone);
  if (!local) return { ok: false, reason: "bad_date" };

  // Debe ser el mismo día
  if (local.date !== day) return { ok: false, reason: `date_mismatch` };

  const minutes = local.hour * 60 + local.minute;
  const start = START_HOUR * 60; // 540 (9:00)
  const end = END_HOUR * 60; // 1020 (17:00)

  if (minutes < start) return { ok: false, reason: `before_9` };
  if (minutes >= end) return { ok: false, reason: `after_5` };

  return { ok: true, reason: "ok" };
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

async function fetchActividades(day) {
  const actUrl = process.env.WL_ACTIVIDADES_URL || DEFAULT_ACT_URL;
  const { data } = await axios.get(actUrl, {
    params: { start: day, end: day },
  });

  const list = Array.isArray(data?.data) ? data.data : [];
  const byId = new Map();

  for (const a of list) {
    if (!a?.id) continue;
    byId.set(a.id, {
      id: a.id,
      dueStart: a.dueStart ?? null,
      titulo: a.titulo ?? "",
    });
  }

  return byId;
}

async function fetchColaboradores(day) {
  const revUrl = process.env.WL_REVISIONES_POR_FECHA_URL || DEFAULT_REV_URL;
  const { data } = await axios.get(revUrl, { params: { date: day } });
  return Array.isArray(data?.data?.colaboradores) ? data.data.colaboradores : [];
}

function procesarColaboradorDia(col, day, actividadesById) {
  const userId = col?.idAsignee;
  if (!userId) return null;

  const userName = resolveUserName(col);

  // ---- PASO 1: Obtener IDs de actividades válidas (programadas 9-5, sin ftf/00sec) ----
  const validActIds = new Set();

  const acts = Array.isArray(col?.items?.actividades) ? col.items.actividades : [];
  for (const a of acts) {
    const actId = a?.id;
    if (!actId) continue;

    // Obtener datos de la actividad
    const sched = actividadesById.get(actId);
    if (!sched) continue; // No encontrada en /actividades

    // Excluir ftf/00sec
    if (esFtf00secPorTitulo(sched.titulo)) continue;

    // Filtrar por dueStart 9-5
    const res = isDueStartBetween9and5Local(sched.dueStart, day, TZ);
    if (res.ok) {
      validActIds.add(actId);
    }
  }

  // ---- PASO 2: Contar revisiones SOLO de actividades válidas ----
  let revisiones = 0;
  let revisiones_con_duracion = 0;
  let revisiones_sin_duracion = 0;
  let minutos = 0;

  const buckets = ["terminadas", "confirmadas", "pendientes"];

  for (const a of acts) {
    const actId = a?.id;
    // SOLO procesar actividades válidas
    if (!actId || !validActIds.has(actId)) continue;

    for (const b of buckets) {
      const revs = Array.isArray(a?.[b]) ? a[b] : [];
      for (const r of revs) {
        const dur = Number(r?.duracionMin ?? 0) || 0;

        // Contar TODA revisión de actividad válida
        revisiones += 1;

        // Diferenciar por duración
        if (dur > 0) {
          revisiones_con_duracion += 1;
          minutos += dur;
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
    actividades: validActIds.size,
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

    // ---- PASO 1: Obtener actividades del día ----
    const actividadesById = await fetchActividades(day);

    // ---- PASO 2: Obtener colaboradores y revisiones ----
    let colaboradores = await fetchColaboradores(day);

    // ---- APLICAR FILTRO DE EXCLUSIÓN DE USUARIOS ----
    colaboradores = colaboradores.filter((col) => {
      const userId = col?.idAsignee;

      if (EXCLUDE_USER_IDS.has(userId)) {
        console.log(`[FILTRO] Excluyendo usuario por ID: ${userId}`);
        return false;
      }

      if (col?.email) {
        const domain = col.email.split("@")[1];
        if (EXCLUDE_DOMAINS.has(domain)) {
          console.log(`[FILTRO] Excluyendo usuario por dominio: ${domain}`);
          return false;
        }
      }

      return true;
    });

    // ---- PASO 3: Procesar cada colaborador ----
    const rows = colaboradores
      .map((c) => procesarColaboradorDia(c, day, actividadesById))
      .filter(Boolean);

    // ---- PASO 4: Predicción por usuario (paralelo) ----
    const users = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        prediccion: await predecirConModelo(r),
      }))
    );

    // Ordena por minutos desc
    users.sort((a, b) => (b.tiempo_total || 0) - (a.tiempo_total || 0));

    return res.json({ date: day, users });
  } catch (err) {
    const msg = err?.message || String(err);
    return res.status(500).json({ error: msg });
  }
});

module.exports = router;