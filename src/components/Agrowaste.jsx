// Updated Agrowaste.jsx (now uses realtime.level_cm from DataContext instead of separate Firestore fetch)
import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, addDoc, query, orderBy, serverTimestamp, limit, deleteDoc } from 'firebase/firestore'; 
import { db } from '../firebase'; 
import Chart from 'chart.js/auto';
import { useData } from '../context/DataContext'; // Added import for DataContext

const LOG_COLLECTION_REF = collection(db, 'agrowaste_transactions'); 

const glassCardStyle = {
  background: 'white',
  borderRadius: '24px',
  border: 'none',
  boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
  padding: '1.5rem'
};

function Agrowaste() {
    const stockChartRef = useRef(null);
    const stockCanvasRef = useRef(null);
    
    // Use DataContext for realtime data including digester level
    const { realtime } = useData();
    const [digesterLevel, setDigesterLevel] = useState(0); 
    const [inventory, setInventory] = useState({}); 
    const [materialName, setMaterialName] = useState('');
    const [quantityKg, setQuantityKg] = useState('');
    const [activityType, setActivityType] = useState('Add'); 
    const [message, setMessage] = useState('');
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);

    // Update digesterLevel from realtime data
    useEffect(() => {
        setDigesterLevel(realtime.level_cm);
    }, [realtime]);

    const getMaterialSuggestion = (currentInventory) => {
        const materialEntries = Object.entries(currentInventory).filter(([, stock]) => stock > 0);
        if (materialEntries.length === 0) return { type: 'No Stock', stock: 0 }; 
        return materialEntries.reduce(
            (lowest, [type, stock]) => (stock < lowest.stock ? { type, stock } : lowest),
            { type: '', stock: Infinity }
        );
    };
    
    // FUNCTIONAL DELETE: Deletes from Firestore
    const handleDeleteLog = async (id, type, quantity) => {
        if (!window.confirm(`Sigurado ka bang buburahin ang log para sa ${type} (${quantity}kg)?`)) return;
        try {
            await deleteDoc(doc(db, 'agrowaste_transactions', id));
            setMessage(`✅ Transaction deleted successfully.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(`❌ Error deleting: ${error.message}`);
        }
    };
    
    useEffect(() => {
        const qLog = query(LOG_COLLECTION_REF, orderBy('timestamp', 'asc'), limit(50));
        const unsubscribeLog = onSnapshot(qLog, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) : 'Pending...'
            }));
            
            const calculatedInventory = {}; 
            fetchedLogs.forEach(log => { 
                const qty = parseFloat(log.quantity);
                const type = log.type;
                calculatedInventory[type] = calculatedInventory[type] || 0;
                log.action === 'Add' ? calculatedInventory[type] += qty : calculatedInventory[type] -= qty;
            });
            
            setActivityLog([...fetchedLogs].reverse()); 
            setInventory(calculatedInventory);
            setLoading(false);
            renderStockChart(calculatedInventory);
        });
        
        return () => unsubscribeLog();
    }, []);
    
    const renderStockChart = (currentInventory) => {
        if (stockChartRef.current) stockChartRef.current.destroy();
        const labels = Object.keys(currentInventory).filter(key => currentInventory[key] > 0);
        const data = labels.map(key => currentInventory[key]);
        
        if (stockCanvasRef.current) {
            stockChartRef.current = new Chart(stockCanvasRef.current, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Stock (kg)',
                        data: data,
                        backgroundColor: '#58B38F',
                        borderRadius: 8,
                        barThickness: 30
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#999' } },
                        y: { beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { color: '#999' } }
                    }
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const quantity = parseFloat(quantityKg);
        if (activityType === 'Consume' && (inventory[materialName.trim()] || 0) < quantity) {
            setMessage(`❌ Kulang ang stock! Available: ${(inventory[materialName.trim()] || 0).toFixed(1)}kg`);
            return;
        }

        try {
            await addDoc(LOG_COLLECTION_REF, {
                action: activityType,
                type: materialName.trim(),
                quantity: quantity,
                timestamp: serverTimestamp(),
                user: 'Admin', 
            });
            setMessage(`✅ Recorded ${quantity}kg of ${materialName}`);
            setQuantityKg(''); setMaterialName('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        }
    };

    const suggested = getMaterialSuggestion(inventory);

    return (
        <div style={{ backgroundColor: '#F0F5F2', minHeight: '100vh', padding: '2rem' }}>
            {/* FontAwesome for Trash Icon */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="container-fluid">
                <header className="mb-4 d-flex justify-content-between">
                    <h3 className="fw-bold text-dark"><i className="fas fa-leaf text-success me-2"></i>Agrowaste Management</h3>
                    <div className="badge bg-white text-dark shadow-sm p-2 px-3 rounded-pill d-flex align-items-center">
                        <div style={{width:8, height:8, background:'#58B38F', borderRadius:'50%', marginRight:8}}></div>
                        System Live
                    </div>
                </header>

                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="row g-3">
                            {/* DIGESTER LEVEL CARD - NOW FROM REALTIME */}
                            <div className="col-12">
                                <div style={{...glassCardStyle, background: '#58B38F', color: 'white'}}>
                                    <small className="opacity-75">Digester Level (Real-time)</small>
                                    <h2 className="mb-0 fw-bold">{digesterLevel} cm</h2>
                                </div>
                            </div>
                            
                            <div className="col-12">
                                <div style={{...glassCardStyle, borderLeft: `6px solid ${suggested.stock < 10 ? '#FF9F5A' : '#58B38F'}`}}>
                                    <small className="text-muted">Lowest Stock Alert</small>
                                    <h4 className="fw-bold mt-1 text-dark">{suggested.type || 'No Data'}</h4>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="badge bg-light text-dark">{suggested.stock.toFixed(1)} kg left</span>
                                    </div>
                                </div>
                            </div>

                            {/* LOG TRANSACTION FORM - FIX TEXT VISIBILITY */}
                            <div className="col-12">
                                <div style={glassCardStyle}>
                                    <h6 className="fw-bold mb-3 text-dark">Log Transaction</h6>
                                    <form onSubmit={handleSubmit}>
                                        <input 
                                            type="text" 
                                            className="form-control mb-2 rounded-3 text-dark" 
                                            placeholder="Material Name" 
                                            style={{backgroundColor: '#f8f9fa', color: '#000'}} 
                                            value={materialName} 
                                            onChange={(e)=>setMaterialName(e.target.value)} 
                                            required 
                                        />
                                        <input 
                                            type="number" 
                                            className="form-control mb-2 rounded-3 text-dark" 
                                            placeholder="Quantity (kg)" 
                                            style={{backgroundColor: '#f8f9fa', color: '#000'}} 
                                            value={quantityKg} 
                                            onChange={(e)=>setQuantityKg(e.target.value)} 
                                            required 
                                        />
                                        <select className="form-select mb-3 rounded-3 text-dark" value={activityType} onChange={(e)=>setActivityType(e.target.value)}>
                                            <option value="Add">Add to Stock</option>
                                            <option value="Consume">Consume (Feed)</option>
                                        </select>
                                        <button className="btn btn-success w-100 rounded-pill fw-bold">Update Inventory</button>
                                        {message && <div className="mt-2 small text-center fw-bold">{message}</div>}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        <div className="mb-4" style={glassCardStyle}>
                            <h6 className="fw-bold text-muted mb-4">CURRENT FEEDSTOCK DISTRIBUTION</h6>
                            <div style={{ height: '250px' }}>
                                <canvas ref={stockCanvasRef}></canvas>
                            </div>
                        </div>

                        {/* RECENT TRANSACTIONS - FIX DELETE BUTTON VISIBILITY */}
                        <div style={glassCardStyle}>
                            <h6 className="fw-bold text-muted mb-3">Recent Transactions</h6>
                            <div className="table-responsive" style={{maxHeight: '400px'}}>
                                <table className="table table-hover align-middle">
                                    <thead>
                                        <tr className="text-muted small">
                                            <th>DATE</th>
                                            <th>ACTIVITY</th>
                                            <th>MATERIAL</th>
                                            <th className="text-end">QTY</th>
                                            <th className="text-center">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody className="small">
                                        {activityLog.map(log => (
                                            <tr key={log.id}>
                                                <td>{log.date}</td>
                                                <td>
                                                    <span className={`badge rounded-pill ${log.action === 'Add' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="fw-bold text-dark">{log.type}</td>
                                                <td className="text-end text-dark">{log.quantity}kg</td>
                                                <td className="text-center">
                                                    {/* VISIBLE DELETE BUTTON */}
                                                    <button 
                                                        onClick={() => handleDeleteLog(log.id, log.type, log.quantity)} 
                                                        className="btn btn-outline-danger btn-sm border-0 rounded-circle"
                                                        title="Delete Log"
                                                    >
                                                        <i className="fas fa-trash-alt"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .bg-success-light { background: #E8F5E9; }
                .bg-danger-light { background: #FFEBEE; }
                .form-control::placeholder { color: #6c757d; }
                .form-control:focus { color: #000; background-color: #fff; }
            `}</style>
        </div>
    );
}

export default Agrowaste;