import React, { useState, useEffect } from 'react';
import './DataExplorer.css';

const DataExplorer = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldAnalysis, setFieldAnalysis] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Consumir el API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://wlserver-production.up.railway.app/api/actividades');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        setData(jsonData);
        
        // Analizar los datos y sacar valores únicos
        analyzeData(jsonData);
      } catch (error) {
        setError(`Error al cargar datos: ${error.message}`);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Función para analizar y extraer valores únicos
  const analyzeData = (apiData) => {
    // Si es un array, usarlo directamente; si es objeto con data adentro, sacar el array
    const records = Array.isArray(apiData) ? apiData : apiData.data || [];
    
    if (records.length === 0) {
      setFieldAnalysis({});
      return;
    }

    const analysis = {};

    // Obtener todos los campos del primer registro
    const sampleRecord = records[0];
    const fields = Object.keys(sampleRecord);

    // Para cada campo, extraer valores únicos
    fields.forEach(field => {
      const uniqueValues = new Set();
      const valueCounts = {};

      records.forEach(record => {
        const value = record[field];
        // Convertir el valor a string para poder compararlo
        const stringValue = JSON.stringify(value);
        
        if (!uniqueValues.has(stringValue)) {
          uniqueValues.add(stringValue);
          valueCounts[stringValue] = 1;
        } else {
          valueCounts[stringValue]++;
        }
      });

      // Convertir los valores únicos a un array ordenado por frecuencia
      const uniqueArray = Array.from(uniqueValues).map(val => ({
        value: JSON.parse(val),
        count: valueCounts[val],
        displayValue: val.length > 50 ? val.substring(0, 47) + '...' : val
      })).sort((a, b) => b.count - a.count);

      analysis[field] = {
        uniqueCount: uniqueValues.size,
        totalRecords: records.length,
        values: uniqueArray,
        type: typeof sampleRecord[field]
      };
    });

    setFieldAnalysis(analysis);
    // Seleccionar el primer campo por defecto
    setSelectedField(fields[0]);
  };

  if (loading) {
    return <div className="explorer-container"><p>⏳ Cargando datos del API...</p></div>;
  }

  if (error) {
    return <div className="explorer-container error"><p>❌ {error}</p></div>;
  }

  if (Object.keys(fieldAnalysis).length === 0) {
    return <div className="explorer-container"><p>No hay datos disponibles</p></div>;
  }

  const totalRecords = data?.length || (data?.data?.length || 0);
  const fields = Object.keys(fieldAnalysis);

  // Filtrar los valores si hay búsqueda
  const getFilteredValues = () => {
    if (!selectedField) return [];
    
    const values = fieldAnalysis[selectedField].values;
    
    if (!searchTerm) return values;
    
    return values.filter(item => 
      item.displayValue.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="explorer-container">
      <header className="explorer-header">
        <h1>🔍 Explorador de Datos - API Actividades</h1>
        <p className="record-count">Total de registros: <strong>{totalRecords.toLocaleString()}</strong></p>
      </header>

      <div className="explorer-content">
        {/* Panel Izquierdo - Lista de Campos */}
        <div className="fields-panel">
          <h2>📋 Campos Disponibles</h2>
          <div className="fields-list">
            {fields.map(field => (
              <button
                key={field}
                className={`field-btn ${selectedField === field ? 'active' : ''}`}
                onClick={() => {
                  setSelectedField(field);
                  setSearchTerm('');
                }}
              >
                <span className="field-name">{field}</span>
                <span className="unique-badge">
                  {fieldAnalysis[field].uniqueCount} únicos
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel Derecho - Detalles del Campo Seleccionado */}
        <div className="details-panel">
          {selectedField && (
            <>
              <div className="field-header">
                <h2>{selectedField}</h2>
                <div className="field-stats">
                  <div className="stat">
                    <span className="label">Valores Únicos:</span>
                    <span className="value">{fieldAnalysis[selectedField].uniqueCount}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Tipo:</span>
                    <span className="value">{fieldAnalysis[selectedField].type}</span>
                  </div>
                </div>
              </div>

              {/* Buscador */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lista de Valores Únicos */}
              <div className="values-list">
                {getFilteredValues().length > 0 ? (
                  getFilteredValues().map((item, idx) => (
                    <div key={idx} className="value-item">
                      <div className="value-content">
                        <code className="value-text">{item.displayValue}</code>
                        {item.displayValue.length > 47 && (
                          <div className="value-tooltip">{JSON.stringify(item.value)}</div>
                        )}
                      </div>
                      <div className="value-count">
                        <span className="count-badge">{item.count}</span>
                        <span className="percentage">
                          {((item.count / fieldAnalysis[selectedField].totalRecords) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-results">No se encontraron resultados</p>
                )}
              </div>

              {/* Resumen para Análisis */}
              <div className="analysis-summary">
                <h3>📊 Resumen para Análisis de Productividad</h3>
                <p className="summary-text">
                  Este campo tiene <strong>{fieldAnalysis[selectedField].uniqueCount}</strong> valores únicos.
                  Para calcular productividad, puedes usar estos valores como indicadores.
                </p>
                <div className="copy-hint">
                  💡 Tip: Usa estos valores para crear tus fórmulas de cálculo de productividad
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;