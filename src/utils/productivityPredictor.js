// src/utils/productivityPredictor.js

import { calcularDiasTranscurridos } from './timeUtils';

/**
 * Procesa los datos de un colaborador y extrae métricas
 * @param {Object} colaborador - Datos del colaborador de la API
 * @param {string} fechaAnalisis - Fecha de análisis (default: hoy)
 * @returns {Object} - Métricas del colaborador
 */
export const procesarColaborador = (colaborador, fechaAnalisis = null) => {
  const { idAsignee, name, items, terminadas = 0, confirmadas = 0, pendientes = 0 } = colaborador;
  
  // Extraer todas las tareas pendientes con sus días de arrastre
  const tareasPendientes = extraerTareasPendientes(items, fechaAnalisis);
  
  // Extraer tareas terminadas
  const tareasTerminadas = extraerTareasTerminadas(items);
  
  return {
    id: idAsignee,
    nombre: name || 'Sin nombre',
    totalTerminadas: terminadas,
    totalConfirmadas: confirmadas,
    totalPendientes: pendientes,
    tareasPendientes,
    tareasTerminadas,
    diasArrastrePromedio: calcularPromedioArrastre(tareasPendientes),
    tareasConArrastre: tareasPendientes.filter(t => t.diasArrastre >= 2).length
  };
};

/**
 * Extrae todas las tareas pendientes de un colaborador
 */
const extraerTareasPendientes = (items, fechaAnalisis) => {
  const pendientes = [];
  const fechaRef = fechaAnalisis ? new Date(fechaAnalisis) : new Date();
  
  // Revisar actividades
  if (items?.actividades) {
    items.actividades.forEach(actividad => {
      if (actividad.pendientes) {
        actividad.pendientes.forEach(tarea => {
          pendientes.push({
            id: tarea.id,
            nombre: tarea.nombre,
            fechaCreacion: tarea.fechaCreacion,
            diasArrastre: calcularDiasTranscurridos(tarea.fechaCreacion, fechaRef),
            actividad: actividad.titulo
          });
        });
      }
    });
  }
  
  // Revisar tareas sin actividad
  if (items?.sinActividad?.pendientes) {
    items.sinActividad.pendientes.forEach(tarea => {
      pendientes.push({
        id: tarea.id,
        nombre: tarea.nombre,
        fechaCreacion: tarea.fechaCreacion,
        diasArrastre: calcularDiasTranscurridos(tarea.fechaCreacion, fechaRef),
        actividad: 'Sin actividad'
      });
    });
  }
  
  return pendientes;
};

/**
 * Extrae todas las tareas terminadas de un colaborador
 */
const extraerTareasTerminadas = (items) => {
  const terminadas = [];
  
  if (items?.actividades) {
    items.actividades.forEach(actividad => {
      if (actividad.terminadas) {
        actividad.terminadas.forEach(tarea => {
          terminadas.push({
            id: tarea.id,
            nombre: tarea.nombre,
            fechaCreacion: tarea.fechaCreacion,
            fechaFinTerminada: tarea.fechaFinTerminada,
            diasParaCompletar: calcularDiasTranscurridos(tarea.fechaCreacion, tarea.fechaFinTerminada),
            actividad: actividad.titulo
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
const calcularPromedioArrastre = (tareasPendientes) => {
  if (tareasPendientes.length === 0) return 0;
  
  const totalDias = tareasPendientes.reduce((sum, t) => sum + t.diasArrastre, 0);
  return Math.round((totalDias / tareasPendientes.length) * 10) / 10;
};

/**
 * Calcula la predicción de productividad para mañana
 * @param {Object} metricas - Métricas procesadas del colaborador
 * @param {Array} historialSemana - Datos de días anteriores de la semana
 * @returns {Object} - Predicción con score y detalles
 */
export const calcularPrediccion = (metricas, historialSemana = []) => {
  const { totalPendientes, tareasConArrastre, diasArrastrePromedio, totalTerminadas } = metricas;
  
  // Factores de penalización
  const PENALIZACION_POR_PENDIENTE = 5;        // -5% por cada tarea pendiente
  const PENALIZACION_POR_ARRASTRE = 10;        // -10% extra por tareas con 2+ días
  const PENALIZACION_POR_DIAS_PROMEDIO = 3;    // -3% por cada día de arrastre promedio
  const BONIFICACION_POR_TERMINADA = 2;        // +2% por cada tarea terminada en la semana
  
  // Calcular score base (100%)
  let score = 100;
  
  // Penalizar por tareas pendientes
  score -= totalPendientes * PENALIZACION_POR_PENDIENTE;
  
  // Penalizar extra por tareas con arrastre (2+ días)
  score -= tareasConArrastre * PENALIZACION_POR_ARRASTRE;
  
  // Penalizar por promedio de días de arrastre
  score -= diasArrastrePromedio * PENALIZACION_POR_DIAS_PROMEDIO;
  
  // Bonificar por tareas terminadas (máximo +20%)
  const bonificacion = Math.min(totalTerminadas * BONIFICACION_POR_TERMINADA, 20);
  score += bonificacion;
  
  // Calcular tendencia basada en historial
  const tendencia = calcularTendencia(historialSemana);
  
  // Ajustar score por tendencia (-10% a +10%)
  score += tendencia.ajuste;
  
  // Limitar score entre 0 y 100
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determinar nivel y recomendación
  const { nivel, color, emoji, recomendacion } = obtenerNivelProductividad(score);
  
  return {
    score,
    nivel,
    color,
    emoji,
    recomendacion,
    tendencia: tendencia.direccion,
    factores: {
      pendientes: totalPendientes,
      conArrastre: tareasConArrastre,
      diasPromedioArrastre: diasArrastrePromedio,
      terminadasSemana: totalTerminadas,
      bonificacion,
      ajusteTendencia: tendencia.ajuste
    }
  };
};

/**
 * Calcula la tendencia basada en el historial de la semana
 */
const calcularTendencia = (historialSemana) => {
  if (historialSemana.length < 2) {
    return { direccion: 'sin_datos', ajuste: 0, descripcion: 'Datos insuficientes' };
  }
  
  // Comparar los últimos 2 días
  const ultimoDia = historialSemana[historialSemana.length - 1];
  const diaAnterior = historialSemana[historialSemana.length - 2];
  
  const terminadasUltimo = ultimoDia?.terminadas || 0;
  const terminadasAnterior = diaAnterior?.terminadas || 0;
  const pendientesUltimo = ultimoDia?.pendientes || 0;
  const pendientesAnterior = diaAnterior?.pendientes || 0;
  
  // Si terminó más y tiene menos pendientes = mejorando
  if (terminadasUltimo >= terminadasAnterior && pendientesUltimo <= pendientesAnterior) {
    return { direccion: 'mejorando', ajuste: 5, descripcion: 'Tendencia positiva' };
  }
  
  // Si terminó menos y tiene más pendientes = empeorando
  if (terminadasUltimo < terminadasAnterior && pendientesUltimo > pendientesAnterior) {
    return { direccion: 'empeorando', ajuste: -10, descripcion: 'Tendencia negativa' };
  }
  
  // Estable
  return { direccion: 'estable', ajuste: 0, descripcion: 'Tendencia estable' };
};

/**
 * Determina el nivel de productividad basado en el score
 */
const obtenerNivelProductividad = (score) => {
  if (score >= 85) {
    return {
      nivel: 'Excelente',
      color: '#22c55e', // verde
      emoji: '🟢',
      recomendacion: 'Óptimo para asignar nuevos proyectos'
    };
  }
  
  if (score >= 70) {
    return {
      nivel: 'Bueno',
      color: '#84cc16', // verde lima
      emoji: '🟡',
      recomendacion: 'Puede recibir tareas con moderación'
    };
  }
  
  if (score >= 50) {
    return {
      nivel: 'Regular',
      color: '#eab308', // amarillo
      emoji: '🟠',
      recomendacion: 'Tiene carga pendiente, asignar con cuidado'
    };
  }
  
  return {
    nivel: 'Bajo',
    color: '#ef4444', // rojo
    emoji: '🔴',
    recomendacion: 'No recomendado para nuevas asignaciones'
  };
};

/**
 * Procesa todos los colaboradores y genera el reporte de predicción
 * @param {Array} colaboradores - Array de colaboradores de la API
 * @param {Array} historialPorColaborador - Historial de la semana por colaborador
 * @returns {Array} - Reporte con predicciones ordenado por score
 */
export const generarReportePrediccion = (colaboradores, historialPorColaborador = {}) => {
  const reporte = colaboradores.map(colaborador => {
    const metricas = procesarColaborador(colaborador);
    const historial = historialPorColaborador[colaborador.idAsignee] || [];
    const prediccion = calcularPrediccion(metricas, historial);
    
    return {
      id: colaborador.idAsignee,
      nombre: metricas.nombre,
      metricas,
      prediccion
    };
  });
  
  // Ordenar por score (mayor a menor)
  return reporte.sort((a, b) => b.prediccion.score - a.prediccion.score);
};