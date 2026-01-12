// Conversión de tiempo a minutos
export const timeToMinutes = (time) => {
  if (typeof time === 'number') return time;
  
  // Si viene en formato "HH:MM"
  if (typeof time === 'string' && time.includes(':')) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  return 0;
};

// Conversión de minutos a formato legible
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Normalizar duración de actividad
export const normalizeDuration = (activity) => {
  if (activity.durationInMinutes) {
    return activity.durationInMinutes;
  }
  
  if (activity.startTime && activity.endTime) {
    const start = new Date(activity.startTime);
    const end = new Date(activity.endTime);
    return Math.floor((end - start) / (1000 * 60));
  }
  
  return 0;
};

// Detectar traslapes entre actividades
export const detectOverlaps = (activities) => {
  const sorted = [...activities].sort((a, b) => 
    new Date(a.startTime) - new Date(b.startTime)
  );
  
  const overlaps = [];
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    const currentEnd = new Date(current.endTime);
    const nextStart = new Date(next.startTime);
    
    if (currentEnd > nextStart) {
      overlaps.push({
        activity1: current,
        activity2: next,
        overlapMinutes: Math.floor((currentEnd - nextStart) / (1000 * 60))
      });
    }
  }
  
  return overlaps;
};

// Calcular tiempo sin actividad (idle time)
export const calculateIdleTime = (activities, workdayStart, workdayEnd) => {
  if (activities.length === 0) return 0;
  
  const sorted = [...activities].sort((a, b) => 
    new Date(a.startTime) - new Date(b.startTime)
  );
  
  let totalIdleMinutes = 0;
  const dayStart = new Date(workdayStart);
  const dayEnd = new Date(workdayEnd);
  
  // Tiempo antes de la primera actividad
  const firstActivity = new Date(sorted[0].startTime);
  if (firstActivity > dayStart) {
    totalIdleMinutes += Math.floor((firstActivity - dayStart) / (1000 * 60));
  }
  
  // Tiempo entre actividades
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = new Date(sorted[i].endTime);
    const nextStart = new Date(sorted[i + 1].startTime);
    
    if (nextStart > currentEnd) {
      totalIdleMinutes += Math.floor((nextStart - currentEnd) / (1000 * 60));
    }
  }
  
  // Tiempo después de la última actividad
  const lastActivity = new Date(sorted[sorted.length - 1].endTime);
  if (lastActivity < dayEnd) {
    totalIdleMinutes += Math.floor((dayEnd - lastActivity) / (1000 * 60));
  }
  
  return totalIdleMinutes;
};