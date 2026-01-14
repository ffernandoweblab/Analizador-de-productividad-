// src/services/predictorService.js

const API_BASE = 'https://wlserver-production.up.railway.app/api';

/**
 * Obtiene revisiones de un día específico
 */
export const getRevisionesDia = async (fecha) => {
  try {
    const response = await fetch(`${API_BASE}/reportes/revisiones-por-fecha?date=${fecha}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error getRevisionesDia:', error);
    throw error;
  }
};

/**
 * Obtiene revisiones de un rango de fechas
 */
export const getRevisionesRango = async (start, end) => {
  try {
    const response = await fetch(`${API_BASE}/reportes/revisiones-por-fecha?start=${start}&end=${end}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error getRevisionesRango:', error);
    throw error;
  }
};