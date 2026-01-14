// src/services/productivityService.js

const API_BASE_URL = 'https://wlserver-production.up.railway.app/api';

/**
 * Obtiene las revisiones de un día específico
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Object>}
 */
export const obtenerRevisionesPorDia = async (date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reportes/revisiones-por-fecha?date=${date}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener revisiones del día:', error);
    throw error;
  }
};

/**
 * Obtiene las revisiones de un rango de fechas
 * @param {string} startDate - Fecha inicio YYYY-MM-DD
 * @param {string} endDate - Fecha fin YYYY-MM-DD
 * @returns {Promise<Object>}
 */
export const obtenerRevisionesPorRango = async (startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reportes/revisiones-por-fecha?start=${startDate}&end=${endDate}`
    );
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error al obtener revisiones por rango:', error);
    throw error;
  }
};

/**
 * Obtiene los datos necesarios para la predicción
 * (datos de hoy + historial de la semana)
 * @param {string} startWeek - Inicio de semana YYYY-MM-DD
 * @param {string} today - Fecha de hoy YYYY-MM-DD
 * @returns {Promise<Object>}
 */
export const obtenerDatosPrediccion = async (startWeek, today) => {
  try {
    // Obtener datos del rango de la semana
    const dataSemana = await obtenerRevisionesPorRango(startWeek, today);
    
    return {
      success: true,
      colaboradores: dataSemana?.data?.colaboradores || [],
      rango: dataSemana?.data?.range || { start: startWeek, end: today },
      totalRevisiones: dataSemana?.data?.totalRevisiones || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      colaboradores: []
    };
  }
};