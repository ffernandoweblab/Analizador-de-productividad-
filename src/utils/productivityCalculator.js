// Clasificar actividad según su cumplimiento
export const classifyActivity = (activity) => {
  const plannedMinutes = activity.plannedDuration || 0;
  const actualMinutes = activity.actualDuration || 0;
  
  // Si no tiene tiempo real registrado
  if (!activity.completed && !actualMinutes) {
    const now = new Date();
    const deadline = new Date(activity.endTime);
    
    if (now > deadline) {
      return 'retrasada';
    }
    return 'en riesgo';
  }
  
  // Si está completada
  if (activity.completed) {
    const variance = ((actualMinutes - plannedMinutes) / plannedMinutes) * 100;
    
    if (Math.abs(variance) <= 10) {
      return 'cumplida';
    } else if (variance > 10) {
      return 'cumplida con retraso';
    }
    return 'cumplida';
  }
  
  return 'pendiente';
};

// Calcular métricas de productividad del día
export const calculateProductivityMetrics = (activities) => {
  const totalPlanned = activities.reduce((sum, act) => 
    sum + (act.plannedDuration || 0), 0
  );
  
  const totalCompleted = activities
    .filter(act => act.completed)
    .reduce((sum, act) => sum + (act.actualDuration || 0), 0);
  
  const totalDelayed = activities
    .filter(act => classifyActivity(act) === 'retrasada')
    .reduce((sum, act) => sum + (act.plannedDuration || 0), 0);
  
  const completionRate = totalPlanned > 0 
    ? (totalCompleted / totalPlanned) * 100 
    : 0;
  
  const onTimeActivities = activities.filter(act => 
    ['cumplida', 'cumplida con retraso'].includes(classifyActivity(act))
  ).length;
  
  const onTimeRate = activities.length > 0
    ? (onTimeActivities / activities.length) * 100
    : 0;
  
  return {
    totalPlanned,
    totalCompleted,
    totalDelayed,
    completionRate: Math.round(completionRate),
    onTimeRate: Math.round(onTimeRate),
    totalActivities: activities.length,
    completedActivities: activities.filter(act => act.completed).length
  };
};

// Interpretar nivel de productividad general
export const interpretProductivity = (metrics) => {
  const { completionRate, onTimeRate } = metrics;
  
  if (completionRate >= 85 && onTimeRate >= 80) {
    return {
      level: 'productivo',
      message: 'Excelente gestión del tiempo',
      color: '#10b981' // green
    };
  }
  
  if (completionRate >= 65 && onTimeRate >= 60) {
    return {
      level: 'regular',
      message: 'Productividad aceptable con áreas de mejora',
      color: '#f59e0b' // yellow
    };
  }
  
  return {
    level: 'no productivo',
    message: 'Requiere optimización en la gestión del tiempo',
    color: '#ef4444' // red
  };
};

// Identificar patrones problemáticos
export const identifyPatterns = (activities) => {
  const patterns = [];
  
  // Detectar exceso de micro-tareas (< 15 min)
  const microTasks = activities.filter(act => 
    (act.plannedDuration || 0) < 15
  );
  
  if (microTasks.length > activities.length * 0.3) {
    patterns.push({
      type: 'micro-tareas',
      severity: 'warning',
      message: `${microTasks.length} micro-tareas detectadas (${Math.round((microTasks.length / activities.length) * 100)}%). Considera agruparlas para mejorar el enfoque.`
    });
  }
  
  // Detectar sobrecarga horaria
  const hourlyLoad = {};
  activities.forEach(act => {
    const hour = new Date(act.startTime).getHours();
    hourlyLoad[hour] = (hourlyLoad[hour] || 0) + 1;
  });
  
  const overloadedHours = Object.entries(hourlyLoad)
    .filter(([_, count]) => count > 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  
  if (overloadedHours.length > 0) {
    patterns.push({
      type: 'sobrecarga',
      severity: 'alert',
      message: `Sobrecarga detectada en ${overloadedHours.length} hora(s): ${overloadedHours.map(h => `${h.hour}:00 (${h.count} tareas)`).join(', ')}`
    });
  }
  
  // Detectar mala distribución (muchas horas sin actividad)
  const activeHours = new Set(activities.map(act => 
    new Date(act.startTime).getHours()
  ));
  
  const workdayHours = 8; // 8 horas laborales típicas
  if (activeHours.size < workdayHours * 0.5) {
    patterns.push({
      type: 'distribución',
      severity: 'info',
      message: `Solo ${activeHours.size} horas con actividades registradas. Considera distribuir mejor las tareas.`
    });
  }
  
  return patterns;
};






