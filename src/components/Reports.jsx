// Updated Reports.jsx (Fixed search bar text visibility)
import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove, query, limitToLast } from 'firebase/database'; 
import { rtdb } from '../firebase'; 
import * as XLSX from 'xlsx';

const SENSOR_LOGS_REF = ref(rtdb, 'sensor_logs'); 
const MAX_HISTORY_POINTS = 500;

const glassCardStyle = {
    background: 'white',
    borderRadius: '24px',
    border: 'none',
    boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
    padding: '1.5rem'
};

const formatTimestamp = (timestampInSeconds) => {
    if (!timestampInSeconds || parseInt(timestampInSeconds) < 1000000000) { 
        return "❌ Invalid Timestamp";
    }
    const milliseconds = parseInt(timestampInSeconds) * 1000;
    const date = new Date(milliseconds);
    return date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });
};

function Reports() {
    const [allHistoryData, setAllHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(SENSOR_LOGS_REF, limitToLast(MAX_HISTORY_POINTS));
        const unsubscribe = onValue(q, (snapshot) => {
            const fetchedData = [];
            snapshot.forEach(childSnapshot => {
                const data = childSnapshot.val();
                const voltage = data.voltage_v || 0;
                const power_kw = (voltage * 1 / 1000).toFixed(2);
                
                fetchedData.push({
                    id: childSnapshot.key,
                    timestamp: parseInt(data.timestamp), 
                    date_formatted: formatTimestamp(data.timestamp), 
                    power_kw: parseFloat(power_kw),
                    temp_c: parseFloat(data.temp_c || 0).toFixed(2),
                    gas_ppm: parseInt(data.gas_ppm || 0),
                    level_cm: parseFloat(data.level_cm || 0).toFixed(1),
                });
            });
            setAllHistoryData([...fetchedData].reverse()); 
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredData = useMemo(() => {
        if (allHistoryData.length === 0) return [];
        const oneMinuteInSeconds = 60;
        const filtered = [];
        let lastLoggedTimestamp = 0;

        const dataToFilter = allHistoryData.filter(item => 
            item.date_formatted.toLowerCase().includes(searchTerm.toLowerCase())
        );

        for (const item of dataToFilter) {
            if (item.date_formatted.includes("❌")) continue;
            
            if (filtered.length === 0 || Math.abs(lastLoggedTimestamp - item.timestamp) >= oneMinuteInSeconds) {
                filtered.push(item);
                lastLoggedTimestamp = item.timestamp;
            }
        }
        return filtered;
    }, [allHistoryData, searchTerm]);

    const stats = useMemo(() => {
        if (filteredData.length === 0) return { avgPower: 0, avgTemp: 0 };
        const sumPower = filteredData.reduce((acc, curr) => acc + curr.power_kw, 0);
        const sumTemp = filteredData.reduce((acc, curr) => acc + parseFloat(curr.temp_c), 0);
        return {
            avgPower: (sumPower / filteredData.length).toFixed(2),
            avgTemp: (sumTemp / filteredData.length).toFixed(1)
        };
    }, [filteredData]);

    const handleExport = () => {
        if (filteredData.length === 0) return setMessage("❌ Walang data na ma-eexport.");
        const ws = XLSX.utils.json_to_sheet(filteredData.map(item => ({
            'Date/Time': item.date_formatted, 
            'Power (kW)': item.power_kw,
            'Temperature (°C)': item.temp_c,
            'Gas (ppm)': item.gas_ppm,
            'Level (cm)': item.level_cm
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sensor Report");
        XLSX.writeFile(wb, `EcoVolt_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleDelete = async (id) => {
        if(window.confirm('Sigurado ka bang buburahin ang record na ito?')) {
            try {
                await remove(ref(rtdb, `sensor_logs/${id}`));
                setMessage("✅ Record deleted successfully.");
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                setMessage("❌ Error deleting: " + error.message);
            }
        }
    }

    return (
        <div style={{ backgroundColor: '#F0F5F2', minHeight: '100vh', padding: '2rem' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="container-fluid">
                <header className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h3 className="fw-bold text-dark mb-0">System Reports</h3>
                        <p className="text-muted small">Data Interval: 1 Minute | Total: {filteredData.length} records</p>
                    </div>
                    <button className="btn btn-success rounded-pill px-4 shadow-sm fw-bold" onClick={handleExport}>
                        <i className="fas fa-file-excel me-2"></i> Export Excel
                    </button>
                </header>

                <div className="row g-3 mb-4 text-dark">
                    <div className="col-md-3">
                        <div style={{...glassCardStyle, padding: '1.2rem', borderBottom: '4px solid #58B38F'}}>
                            <small className="text-muted d-block fw-bold">AVG. POWER</small>
                            <span className="h4 fw-bold text-success">{stats.avgPower} kW</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div style={{...glassCardStyle, padding: '1.2rem', borderBottom: '4px solid #FFC107'}}>
                            <small className="text-muted d-block fw-bold">AVG. TEMPERATURE</small>
                            <span className="h4 fw-bold text-warning">{stats.avgTemp} °C</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div style={{...glassCardStyle, padding: '1.2rem', borderBottom: '4px solid #0D6EFD'}}>
                            <small className="text-muted d-block fw-bold">INTERVAL</small>
                            <span className="h4 fw-bold text-primary">1 Minute</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div style={{...glassCardStyle, padding: '1.2rem', borderBottom: '4px solid #6C757D'}}>
                            <small className="text-muted d-block fw-bold">STATUS</small>
                            <span className="h4 fw-bold text-secondary">Monitoring</span>
                        </div>
                    </div>
                </div>

                <div style={glassCardStyle}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        {/* FIXED SEARCH BAR - Mas malinaw na ang text kapag nagta-type */}
                        <div className="input-group w-50" style={{ maxWidth: '500px' }}>
                            <span className="input-group-text bg-white border-end-0" style={{ borderRadius: '50px 0 0 50px' }}>
                                <i className="fas fa-search text-muted"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0 ps-0 text-dark fw-medium"
                                placeholder="Maghanap ng petsa o oras..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    borderRadius: '0 50px 50px 0',
                                    backgroundColor: '#ffffff',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                    height: '50px'
                                }}
                            />
                        </div>
                        {message && <div className="badge bg-white text-success border border-success p-2 px-3 rounded-pill">{message}</div>}
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '500px' }}>
                        <table className="table table-hover align-middle">
                            <thead className="sticky-top bg-white">
                                <tr className="text-muted small">
                                    <th>TIMESTAMP</th>
                                    <th>POWER (kW)</th>
                                    <th>TEMP (°C)</th>
                                    <th>GAS (ppm)</th>
                                    <th>LEVEL (cm)</th>
                                    <th className="text-center">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-success"></div></td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-5 text-muted">Walang records na nahanap.</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id}>
                                            <td className="fw-bold text-dark">{item.date_formatted}</td>
                                            <td><span className="badge bg-success-light">{item.power_kw} kW</span></td>
                                            <td><span className="badge bg-warning-light">{item.temp_c}°C</span></td>
                                            <td><span className="badge bg-info-light">{item.gas_ppm} ppm</span></td>
                                            <td className="text-dark fw-medium">{item.level_cm} cm</td>
                                            <td className="text-center">
                                                <button 
                                                    className="btn btn-sm text-danger hover-scale"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                .bg-success-light { background: #E8F5E9 !important; color: #2E7D32 !important; border: 1px solid #C8E6C9 !important; }
                .bg-warning-light { background: #FFF3E0 !important; color: #EF6C00 !important; border: 1px solid #FFE0B2 !important; }
                .bg-info-light { background: #E3F2FD !important; color: #1565C0 !important; border: 1px solid #BBDEFB !important; }
                .hover-scale:hover { transform: scale(1.2); transition: 0.2s; color: #dc3545 !important; }
                .table thead th { border-bottom: 2px solid #f8f9fa; font-weight: 700; color: #495057; }
                .text-dark { color: #212529 !important; }

                /* Extra assurance para sa search input text visibility */
                .form-control::placeholder {
                    color: #aaa !important;
                    opacity: 1;
                }
                .form-control:focus {
                    box-shadow: 0 0 0 0.2rem rgba(67, 24, 255, 0.15);
                    border-color: #4318FF;
                }
            `}</style>
        </div>
    );
}

export default Reports;