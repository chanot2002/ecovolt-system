// Updated EFOAnalysis.jsx (removed AI Tuning and Feedstock Blend sections)
import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, query, limitToLast, update } from 'firebase/database';
import { rtdb } from '../firebase';
import Chart from 'chart.js/auto';

const RT_PATH = "realtime_data/latest"; 
const HISTORY_PATH = "sensor_logs"; 
const MAX_HISTORY_POINTS = 30; 

const glassCardStyle = {
  background: 'white',
  borderRadius: '24px',
  border: 'none',
  boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
  padding: '1.5rem'
};

function EFOAnalysis() {
    const powerTrendChartRef = useRef(null);
    const tempChartRef = useRef(null);
    const gasChartRef = useRef(null);
    const levelChartRef = useRef(null);
    
    const powerCanvasRef = useRef(null);
    const tempCanvasRef = useRef(null);
    const gasCanvasRef = useRef(null);
    const levelCanvasRef = useRef(null);

    const [realtimeData, setRealtimeData] = useState({ temp_c: 0, gas_ppm: 0, voltage_v: 0, level_cm: 0 });
    const [isTuning, setIsTuning] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // 1. Real-time Sensor Data
        const rtRef = ref(rtdb, RT_PATH);
        const unsubscribeRT = onValue(rtRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setRealtimeData({
                    temp_c: parseFloat(data.temp_c || 0),
                    gas_ppm: parseInt(data.gas_ppm || 0),
                    voltage_v: parseFloat(data.voltage_v || 0),
                    level_cm: parseFloat(data.level_cm || 0),
                });
            }
        });

        // 2. History Data for Line Charts
        const historyRef = ref(rtdb, HISTORY_PATH);
        const q = query(historyRef, limitToLast(MAX_HISTORY_POINTS));
        const unsubscribeHistory = onValue(q, (snapshot) => {
            const fetchedData = [];
            snapshot.forEach(childSnapshot => {
                const data = childSnapshot.val();
                fetchedData.push({
                    temp: parseFloat(data.temp_c || 0),
                    gas: parseInt(data.gas_ppm || 0),
                    power: (data.voltage_v * 1 / 1000), 
                    level: parseFloat(data.level_cm || 0),
                    timestamp: new Date(parseInt(data.timestamp) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                });
            });
            renderHistoryCharts(fetchedData);
        });

        return () => {
            unsubscribeRT();
            unsubscribeHistory();
        };
    }, []);

    const renderHistoryCharts = (data) => {
        const labels = data.map(item => item.timestamp);
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#999', font: { size: 10 } } },
                y: { grid: { color: '#f0f0f0' }, ticks: { color: '#999' } }
            }
        };

        // Power Chart
        if (powerTrendChartRef.current) powerTrendChartRef.current.destroy();
        powerTrendChartRef.current = new Chart(powerCanvasRef.current, {
            type: 'line',
            data: {
                labels,
                datasets: [{ label: 'Power', data: data.map(i => i.power), borderColor: '#58B38F', backgroundColor: '#58B38F22', fill: true, tension: 0.4 }]
            },
            options: commonOptions
        });

        // Temp Chart
        if (tempChartRef.current) tempChartRef.current.destroy();
        tempChartRef.current = new Chart(tempCanvasRef.current, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Temp', data: data.map(i => i.temp), borderColor: '#FF9F5A', backgroundColor: '#FF9F5A22', fill: true, tension: 0.4 }] },
            options: commonOptions
        });

        // Gas Chart
        if (gasChartRef.current) gasChartRef.current.destroy();
        gasChartRef.current = new Chart(gasCanvasRef.current, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Gas', data: data.map(i => i.gas), borderColor: '#4FC3F7', backgroundColor: '#4FC3F722', fill: true, tension: 0.4 }] },
            options: commonOptions
        });

        // Level Chart
        if (levelChartRef.current) levelChartRef.current.destroy();
        levelChartRef.current = new Chart(levelCanvasRef.current, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Level', data: data.map(i => i.level), borderColor: '#6A5ACD', backgroundColor: '#6A5ACD22', fill: true, tension: 0.4 }] },
            options: commonOptions
        });
    };

    return (
        <div style={{ backgroundColor: '#F0F5F2', minHeight: '100vh', padding: '2rem' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="container-fluid">
                <header className="mb-4 d-flex justify-content-between align-items-center">
                    <h3 className="fw-bold text-dark">
                        <i className="fas fa-microscope text-success me-2"></i>EFO Analysis & Optimization
                    </h3>
                    <div className="badge bg-white text-dark shadow-sm p-2 px-3 rounded-pill d-flex align-items-center">
                        <div className="spinner-grow text-success me-2" style={{width: 10, height: 10}}></div>
                        Analyzing...
                    </div>
                </header>

                <div className="row g-4">
                    <div className="col-lg-12">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <div style={{...glassCardStyle, background: '#58B38F', color: 'white'}}>
                                    <i className="fas fa-bolt mb-2 opacity-75"></i>
                                    <small className="d-block opacity-75">Power Output</small>
                                    <h2 className="mb-0 fw-bold">{(realtimeData.voltage_v * 1 / 1000).toFixed(2)} kW</h2>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div style={glassCardStyle}>
                                    <i className="fas fa-thermometer-half text-warning mb-2"></i>
                                    <small className="text-muted d-block">Reactor Temp</small>
                                    <h2 className="mb-0 fw-bold text-dark">{realtimeData.temp_c.toFixed(1)}°C</h2>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div style={glassCardStyle}>
                                    <i className="fas fa-cloud text-info mb-2"></i>
                                    <small className="text-muted d-block">Methane Level</small>
                                    <h2 className="mb-0 fw-bold text-dark">{realtimeData.gas_ppm} <small style={{fontSize: '1rem'}}>ppm</small></h2>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div style={glassCardStyle}>
                                    <i className="fas fa-ruler-vertical text-indigo mb-2"></i>
                                    <small className="text-muted d-block">Digester Level</small>
                                    <h2 className="mb-0 fw-bold text-dark">{realtimeData.level_cm.toFixed(1)} cm</h2>
                                </div>
                            </div>
                        </div>

                        {/* Power Performance Trend */}
                        <div className="mb-4" style={glassCardStyle}>
                            <h6 className="fw-bold mb-4 text-muted"><i className="fas fa-chart-line me-2"></i>POWER PERFORMANCE TREND</h6>
                            <div style={{ height: '300px' }}>
                                <canvas ref={powerCanvasRef}></canvas>
                            </div>
                        </div>

                        {/* Other Charts */}
                        <div className="row g-4">
                            <div className="col-md-6">
                                <div style={glassCardStyle}>
                                    <h6 className="fw-bold mb-3 text-muted"><i className="fas fa-temperature-low me-2"></i>Stability Index</h6>
                                    <div style={{ height: '180px' }}>
                                        <canvas ref={tempCanvasRef}></canvas>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={glassCardStyle}>
                                    <h6 className="fw-bold mb-3 text-muted"><i className="fas fa-flask me-2"></i>Gas Yield Trend</h6>
                                    <div style={{ height: '180px' }}>
                                        <canvas ref={gasCanvasRef}></canvas>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div style={glassCardStyle}>
                                    <h6 className="fw-bold mb-3 text-muted"><i className="fas fa-ruler-vertical me-2"></i>Level Trend</h6>
                                    <div style={{ height: '180px' }}>
                                        <canvas ref={levelCanvasRef}></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EFOAnalysis;