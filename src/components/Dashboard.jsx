// Updated Dashboard.jsx (removed Quick Report)
import React from 'react';
import { useData } from '../context/DataContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#333',
      bodyColor: '#666',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      padding: 10,
      displayColors: false
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#999', font: { size: 10 } } },
    y: { grid: { color: '#f5f5f5' }, ticks: { color: '#999', font: { size: 10 } } },
  },
};

const CustomLineChart = ({ data, color, dataKey }) => (
  <Line
    data={{
      labels: data.map(d => d.time),
      datasets: [{
        data: data.map(d => d[dataKey]),
        borderColor: color,
        backgroundColor: `${color}22`,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 3,
      }],
    }}
    options={chartOptions}
  />
);

const StatCard = ({ label, value, unit, icon, color, description }) => (
  <div className="flex-fill mx-2 p-3 rounded-4 shadow-sm border-0 position-relative overflow-hidden" 
       style={{ background: 'white', minWidth: '200px', transition: 'transform 0.2s' }}>
    <div className="d-flex align-items-center mb-2">
      <div className="rounded-circle p-2 me-3" style={{ background: `${color}15`, color: color }}>
        <i className={`fas ${icon} fa-fw`}></i>
      </div>
      <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{label}</small>
    </div>
    <div className="d-flex align-items-baseline">
      <h3 className="mb-0 fw-bold text-dark">{value}</h3>
      <small className="ms-1 fw-bold text-muted">{unit}</small>
    </div>
    <div style={{ height: '4px', width: '40%', background: color, borderRadius: '10px', marginTop: '8px' }}></div>
  </div>
);

const Dashboard = () => {
  const { realtime, history } = useData();

  return (
    <div style={{ backgroundColor: '#F0F5F2', minHeight: '100vh', padding: '25px' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      
      <div className="container-fluid">
        {/* Header Section */}
        <header className="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold text-dark mb-1">
              <i className="fas fa-chart-pie text-success me-2"></i>System Overview
            </h3>
            <p className="text-muted small mb-0">Real-time monitoring of your biomass energy system.</p>
          </div>
          <div className="badge bg-white shadow-sm text-dark p-2 px-3 rounded-pill border">
            <span className={realtime.isOnline ? 'text-success' : 'text-danger'}>●</span> 
            <span className="ms-2 fw-bold">{realtime.isOnline ? 'System Live' : 'System Offline'}</span>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-lg-9">
            {/* Real-time Stats Row - Added Digester Level */}
            <div className="d-flex flex-wrap justify-content-between mb-4 mx-n2">
              <StatCard label="Temperature" value={realtime.temp_c} unit="°C" icon="fa-thermometer-half" color="#FF9F5A" />
              <StatCard label="Methane Level" value={realtime.gas_ppm} unit="PPM" icon="fa-biohazard" color="#4FC3F7" />
              <StatCard label="Current Voltage" value={realtime.voltage_v} unit="V" icon="fa-bolt" color="#58B38F" />
              <StatCard label="Digester Level" value={realtime.level_cm} unit="cm" icon="fa-ruler-vertical" color="#6A5ACD" />
            </div>

            {/* Main Charts Area - Added Level Trend Chart */}
            <div className="bg-white rounded-5 p-4 shadow-sm">
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="fw-bold text-dark mb-4 px-2">
                      <i className="fas fa-wave-square text-success me-2"></i>Primary Voltage Output (V)
                    </h6>
                    <div style={{ height: '280px' }}>
                      <CustomLineChart data={history} color="#58B38F" dataKey="voltage_v" />
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 mb-4 mb-md-0">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="fw-bold text-dark mb-4">
                      <i className="fas fa-fire-alt text-warning me-2"></i>Thermal Stability
                    </h6>
                    <div style={{ height: '200px' }}>
                      <CustomLineChart data={history} color="#FF9F5A" dataKey="temp_c" />
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-4 mb-md-0">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="fw-bold text-dark mb-4">
                      <i className="fas fa-wind text-info me-2"></i>Gas Concentration
                    </h6>
                    <div style={{ height: '200px' }}>
                      <CustomLineChart data={history} color="#4FC3F7" dataKey="gas_ppm" />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-4">
                    <h6 className="fw-bold text-dark mb-4">
                      <i className="fas fa-ruler-vertical text-indigo me-2"></i>Digester Level Trend
                    </h6>
                    <div style={{ height: '200px' }}>
                      <CustomLineChart data={history} color="#6A5ACD" dataKey="level_cm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - System Health */}
          <div className="col-lg-3">
            <div className="card border-0 rounded-5 mb-4 shadow-sm overflow-hidden">
              <div className="p-4 text-center text-white" 
                   style={{ background: 'linear-gradient(135deg, #58B38F 0%, #3a8d6e 100%)' }}>
                <div className="bg-white bg-opacity-25 rounded-circle d-inline-flex p-3 mb-3">
                  <i className="fas fa-heartbeat fa-2x"></i>
                </div>
                <h5 className="fw-bold mb-1">System Health</h5>
                <p className="small opacity-75 mb-0">All sensors are stable</p>
              </div>
              <div className="p-4 bg-white">
                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                  <span className="text-muted small">Update Frequency</span>
                  <span className="fw-bold small text-dark">5 Seconds</span>
                </div>
                <div className="d-flex justify-content-between mb-3 border-bottom pb-2">
                  <span className="text-muted small">Data Points</span>
                  <span className="fw-bold small text-dark">Active</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Last Sync</span>
                </div>
                <p className="fw-bold text-dark small mb-0">
                  <i className="far fa-clock me-2 text-success"></i>{realtime.timestamp || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;