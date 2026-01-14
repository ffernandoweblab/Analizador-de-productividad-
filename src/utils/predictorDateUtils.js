// src/utils/predictorDateUtils.js

/**
 * Calcula los días transcurridos entre dos fechas
 */
export const calcularDias = (fechaInicio, fechaFin = null) => {
  const inicio = new Date(fechaInicio);
  const fin = fechaFin ? new Date(fechaFin) : new Date();
  
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);
  
  const diferencia = fin - inicio;
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};
  
/**
 * Obtiene el lunes de la semana actual
 */
export const obtenerLunesSemana = () => {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diferencia);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};

/**
 * Formatea fecha a YYYY-MM-DD
 */
export const formatoFecha = (fecha) => {
  return fecha.toISOString().split('T')[0];
};

/**
 * Obtiene el rango de la semana actual (lunes a hoy)
 */
export const rangoSemanaActual = () => {
  const lunes = obtenerLunesSemana();
  const hoy = new Date();
  
  return {
    start: formatoFecha(lunes),
    end: formatoFecha(hoy)
  };
};

/**
 * Obtiene la fecha de mañana formateada
 */
export const fechaManana = () => {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return formatoFecha(manana);
};