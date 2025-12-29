// Updated DataContext.jsx (added level_cm to realtime and history)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { rtdb, db } from '../firebase';
import { ref, onValue, query as rtdbQuery, limitToLast } from 'firebase/database';
import { collection, doc, onSnapshot, setDoc, addDoc, query as fsQuery, orderBy, serverTimestamp } from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within a DataProvider");
    return context;
};

export const DataProvider = ({ children }) => {
    const [realtime, setRealtime] = useState({ temp_c: 0, gas_ppm: 0, voltage_v: 0, level_cm: 0, timestamp: 'N/A', isOnline: false });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const RT_DOC_REF = ref(rtdb, 'realtime_data/latest');
        const SENSOR_LOGS_REF = rtdbQuery(ref(rtdb, 'sensor_logs'), limitToLast(12));

        const unsubRT = onValue(RT_DOC_REF, (snap) => {
            if (snap.exists()) {
                const d = snap.val();
                const ts = parseInt(d.timestamp) || 0;
                setRealtime({
                    temp_c: parseFloat(d.temp_c || 0).toFixed(1),
                    gas_ppm: parseInt(d.gas_ppm || 0),
                    voltage_v: parseFloat(d.voltage_v || 0).toFixed(2),
                    level_cm: parseFloat(d.level_cm || 0).toFixed(1),
                    timestamp: new Date(ts * 1000).toLocaleTimeString(),
                    isOnline: Math.floor(Date.now() / 1000) - ts <= 90,
                });
            }
            setLoading(false);
        });

        const unsubHist = onValue(SENSOR_LOGS_REF, (snap) => {
            const list = [];
            snap.forEach((child) => {
                const d = child.val();
                list.push({
                    time: new Date(parseInt(d.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temp_c: parseFloat(d.temp_c || 0),
                    gas_ppm: parseInt(d.gas_ppm || 0),
                    voltage_v: parseFloat(d.voltage_v || 0),
                    level_cm: parseFloat(d.level_cm || 0),
                });
            });
            setHistory(list);
        });

        return () => { unsubRT(); unsubHist(); };
    }, []);

    return (
        <DataContext.Provider value={{ realtime, history, loading }}>
            {children}
        </DataContext.Provider>
    );
};