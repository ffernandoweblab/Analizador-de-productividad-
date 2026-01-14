// src/utils/predictorEngine.js

import { calcularDias } from './predictorDateUtils';

/**
 * Extrae todas las tareas pendientes de un colaborador
 */
const extraerPendientes = (items, fechaRef) => {
  const pendientes = [];
  
  // De actividades
  if (items?.actividades) {
    items.actividades.forEach(act => {
      if (act.pendientes) {
        act.pendientes.forEach(tarea => {
          pendientes.push({
            id: tarea.id,
            nombre: tarea.nombre,
            fechaCreacion: tarea.fechaCreacion,
            diasArrastre: calcularDias(tarea.fechaCreacion, fechaRef),
            actividad: act.titulo
          });
        });
      }
    });
  }
  
  // Sin actividad
  if (items?.sinActividad?.pendientes) {
    items.sinActividad.pendientes.forEach(tarea => {
      pendientes.push({
        id: tarea.id,
        nombre: tarea.nombre,
        fechaCreacion: tarea.fechaCreacion,
        diasArrastre: calcularDias(tarea.fechaCreacion, fechaRef),
        actividad: 'Sin actividad'
      });
    });
  }
  
  return pendientes;
};

/**
 * Extrae todas las tareas terminadas de un colaborador
 */
const extraerTerminadas = (items) => {
  const terminadas = [];
  
  if (items?.actividades) {
    items.actividades.forEach(act => {
      if (act.terminadas) {
        act.terminadas.forEach(tarea => {
          terminadas.push({
            id: tarea.id,
            nombre: tarea.nombre,
            fechaCreacion: tarea.fechaCreacion,
            fechaFin: tarea.fechaFinTerminada,
            diasParaCompletar: calcularDias(tarea.fechaCreacion, tarea.fechaFinTerminada)
          });
        });
      }
    });
  }
  
  return terminadas;
};

/**
 * Calcula el promedio de días de arrastre
 */
const promedioArrastre = (pendientes) => {
  if (pendientes.length === 0) return 0;
  const total = pendientes.reduce((sum, t) => sum + t.diasArrastre, 0);
  return Math.round((total / pendientes.length) * 10) / 10;
};

/**
 * Determina nivel de productividad según score
 */
const getNivel = (score) => {
  if (score >= 85) return { nivel: 'Excelente', color: '#22c55e', emoji: '🟢', mensaje: 'Óptimo para nuevos proyectos' };
  if (score >= 70) return { nivel: 'Bueno', color: '#84cc16', emoji: '🟡', mensaje: 'Puede recibir tareas moderadas' };
  if (score >= 50) return { nivel: 'Regular', color: '#eab308', emoji: '🟠', mensaje: 'Tiene carga pendiente' };
  return { nivel: 'Bajo', color: '#ef4444', emoji: '🔴', mensaje: 'No asignar nuevas tareas' };
};

/**
 * Calcula predicción de productividad para mañana
 */
const calcularPrediccion = (pendientes, terminadas, totalPendientes, totalTerminadas) => {
  const tareasConArrastre = pendientes.filter(t => t.diasArrastre >= 2).length;
  const promedio = promedioArrastre(pendientes);
  
  // Fórmula del score
  let score = 100;
  score -= totalPendientes * 5;           // -5% por pendiente
  score -= tareasConArrastre * 10;        // -10% extra por arrastre 2+ días
  score -= promedio * 3;                  // -3% por día promedio arrastre
  score += Math.min(totalTerminadas * 2, 20); // +2% por terminada (max 20%)
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  const { nivel, color, emoji, mensaje } = getNivel(score);
  
  return {
    score,
    nivel,
    color,
    emoji,
    mensaje,
    detalles: {
      totalPendientes,
      tareasConArrastre,
      promedioArrastre: promedio,
      totalTerminadas
    }
  };
};

/**
 * Procesa un colaborador y genera su predicción
 */
export const procesarColaborador = (colaborador) => {
  const { idAsignee, name, items, terminadas = 0, confirmadas = 0, pendientes = 0 } = colaborador;
  
  const fechaHoy = new Date();
  const tareasPendientes = extraerPendientes(items, fechaHoy);
  const tareasTerminadas = extraerTerminadas(items);
  
  const prediccion = calcularPrediccion(tareasPendientes, tareasTerminadas, pendientes, terminadas);
  
  // Extraer email del nombre si existe
  let nombreLimpio = name || 'Sin nombre';
  if (nombreLimpio.includes('@')) {
    nombreLimpio = nombreLimpio.split('@')[0];
  }
  
  return {
    id: idAsignee,
    nombre: nombreLimpio,
    email: name,
    terminadas,
    confirmadas,
    pendientes,
    tareasPendientes,
    tareasTerminadas,
    prediccion
  };
};

/**
 * Genera reporte completo de predicción para todos los colaboradores
 */
export const generarReporte = (colaboradores) => {
  const reporte = colaboradores
    .map(col => procesarColaborador(col))
    .filter(col => col.nombre !== 'Sin nombre' && col.email) // Filtrar sin nombre
    .sort((a, b) => b.prediccion.score - a.prediccion.score); // Ordenar por score
  
  return reporte;
};