// Updated firebase.js (no changes needed, but included for completeness)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// --- ✅ FINAL CONFIGURATION (MATCHED TO ESP8266) ✅ ---
const firebaseConfig = {
    apiKey: "AIzaSyD_dfRaHXjNVZ-Yw-ZfelIYgJAIO76CpVU",
    authDomain: "ecovolt-87bb5.firebaseapp.com",
    databaseURL: "https://ecovolt-87bb5-default-rtdb.firebaseio.com/",
    projectId: "ecovolt-87bb5",
    storageBucket: "ecovolt-87bb5.firebasestorage.app",
    messagingSenderId: "437186003842",
    appId: "1:437186003842:web:e1fe619a3346487430859b",
    measurementId: "G-9ZGE1TPFT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app); // Para sa Arduino data
export const db = getFirestore(app); // Para sa Transactions, Settings, Users