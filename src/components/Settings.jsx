import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore'; 
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth'; 
import { db, auth } from '../firebase'; 
import { useAuth } from '../context/AuthContext';

const SETTINGS_DOC_REF = doc(db, 'system_settings', 'calibration');

const INITIAL_SETTINGS = {
    max_temp: 40.0,
    min_level: 40.0,
    max_level: 90.0,
    min_power_kW: 0.5,
    alert_gas_ppm: 800,
    system_mode: 'active',
    notifications_enabled: true,
};

const Settings = () => {
    const { currentUser, logout } = useAuth(); // Assume may logout function sa context
    
    // States
    const [localSettings, setLocalSettings] = useState(INITIAL_SETTINGS);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');
    
    const [localProfile, setLocalProfile] = useState({
        displayName: '', email: '', role: 'Admin', phone: '', uid: ''
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');

    // Password States
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false); // Eye icon toggle
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(SETTINGS_DOC_REF, (docSnap) => {
            if (docSnap.exists()) setLocalSettings(docSnap.data());
            else setDoc(SETTINGS_DOC_REF, INITIAL_SETTINGS);
        });
        if (currentUser) {
            setLocalProfile(prev => ({
                ...prev,
                displayName: currentUser.displayName || '',
                email: currentUser.email || '',
                uid: currentUser.uid
            }));
        }
        return () => unsubscribe();
    }, [currentUser]);

    // --- HANDLERS ---

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            await setDoc(SETTINGS_DOC_REF, localSettings);
            setSettingsMessage("✅ System thresholds updated.");
            setTimeout(() => setSettingsMessage(''), 3000);
        } catch (error) { setSettingsMessage(`❌ Error: ${error.message}`); }
        finally { setIsSavingSettings(false); }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await updateProfile(auth.currentUser, { displayName: localProfile.displayName });
            setProfileMessage("✅ Profile updated.");
            setTimeout(() => setProfileMessage(''), 3000);
        } catch (error) { setProfileMessage(`❌ Error: ${error.message}`); }
        finally { setIsSavingProfile(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.next.length < 6) return setPasswordMessage("❌ Password must be at least 6 characters.");
        setIsChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, passwords.current);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, passwords.next);
            setPasswordMessage("✅ Password updated.");
            setPasswords({ current: '', next: '', confirm: '' });
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (error) { 
            setPasswordMessage("❌ Error: Check current password."); 
        } finally { setIsChangingPassword(false); }
    };

    // --- DANGER ZONE ACTIONS ---

    const handleResetLogs = async () => {
        if (!window.confirm("Are you sure? This will erase all sensor history and will not be recoverable.")) return;
        
        try {
            const querySnapshot = await getDocs(collection(db, "sensor_logs"));
            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            alert("✅ All logs have been cleared.");
        } catch (error) {
            alert("❌ Error resetting logs: " + error.message);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmStr = "DELETE";
        const userInput = window.prompt(`I-type "${confirmStr}" to confirm deletion of your account:`);
        
        if (userInput === confirmStr) {
            try {
                // Note: Re-authentication is usually required before deleting a user
                await deleteUser(currentUser);
                alert("Account deleted. Redirecting...");
                window.location.reload(); 
            } catch (error) {
                alert("❌ Error: You need to log in again before deleting the account for security reasons.");
            }
        }
    };

    const cardStyle = {
        background: '#ffffff',
        border: '1px solid #edf2f7',
        borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
        height: '100%'
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="mb-4">
                <h2 className="fw-bold text-dark"><i className="fas fa-cog me-3 text-success"></i>Control Center</h2>
                <p className="text-muted">Calibrate system thresholds and manage your administrator account.</p>
            </div>

            <div className="row g-4">
                {/* 1. CALIBRATION SETTINGS */}
                <div className="col-lg-4">
                    <div className="p-4" style={cardStyle}>
                        <div className="d-flex align-items-center mb-4">
                            <div className="bg-success-light p-3 rounded-circle me-3">
                                <i className="fas fa-sliders-h text-success"></i>
                            </div>
                            <h5 className="mb-0 fw-bold text-dark">System Calibration</h5>
                        </div>
                        
                        <form onSubmit={handleSaveSettings}>
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted"><i className="fas fa-temperature-high me-2"></i>Max Temperature Alert</label>
                                <div className="input-group border rounded-pill overflow-hidden bg-light">
                                    <input type="number" className="form-control bg-transparent border-0 text-dark px-3" 
                                        value={localSettings.max_temp}
                                        onChange={(e) => setLocalSettings({...localSettings, max_temp: e.target.value})} step="0.1"/>
                                    <span className="input-group-text bg-transparent border-0 fw-bold text-muted">°C</span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted"><i className="fas fa-radiation me-2"></i>Gas Alert Threshold</label>
                                <div className="input-group border rounded-pill overflow-hidden bg-light">
                                    <input type="number" className="form-control bg-transparent border-0 text-dark px-3" 
                                        value={localSettings.alert_gas_ppm}
                                        onChange={(e) => setLocalSettings({...localSettings, alert_gas_ppm: e.target.value})}/>
                                    <span className="input-group-text bg-transparent border-0 fw-bold text-muted">PPM</span>
                                </div>
                            </div>

                            <div className="form-check form-switch mb-4 ms-1">
                                <input className="form-check-input custom-switch" type="checkbox" checked={localSettings.notifications_enabled}
                                    onChange={(e) => setLocalSettings({...localSettings, notifications_enabled: e.target.checked})}/>
                                <label className="form-check-label small fw-bold text-dark ms-2">Push Notifications</label>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted"><i className="fas fa-power-off me-2"></i>Operational Mode</label>
                                <select className="form-select border rounded-pill bg-light text-dark px-3" value={localSettings.system_mode}
                                    onChange={(e) => setLocalSettings({...localSettings, system_mode: e.target.value})}>
                                    <option value="active">Active Monitoring</option>
                                    <option value="maintenance">Maintenance Mode</option>
                                    <option value="eco">Eco Mode (Power Save)</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-success w-100 rounded-pill fw-bold py-2 shadow-sm" disabled={isSavingSettings}>
                                {isSavingSettings ? <span className="spinner-border spinner-border-sm"></span> : 'Apply Calibration'}
                            </button>
                            {settingsMessage && <div className="mt-2 small text-center fw-bold text-success">{settingsMessage}</div>}
                        </form>
                    </div>
                </div>

                {/* 2. USER PROFILE */}
                <div className="col-lg-4">
                    <div className="p-4" style={cardStyle}>
                        <div className="d-flex align-items-center mb-4">
                            <div className="bg-primary-light p-3 rounded-circle me-3">
                                <i className="fas fa-user-shield text-primary"></i>
                            </div>
                            <h5 className="mb-0 fw-bold text-dark">Profile Settings</h5>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className="text-center mb-4">
                                <div className="avatar-circle mx-auto mb-2 shadow-sm">
                                    {localProfile.displayName.charAt(0) || 'A'}
                                </div>
                                <span className="badge bg-soft-primary text-primary px-3 rounded-pill border">System {localProfile.role}</span>
                            </div>

                            <div className="mb-3">
                                <label className="form-label small fw-bold text-muted"><i className="fas fa-signature me-2"></i>Full Name</label>
                                <input type="text" className="form-control border rounded-pill bg-light text-dark px-3" 
                                    value={localProfile.displayName}
                                    onChange={(e) => setLocalProfile({...localProfile, displayName: e.target.value})}/>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted"><i className="fas fa-envelope me-2"></i>Email (Read-only)</label>
                                <input type="email" className="form-control border rounded-pill bg-white text-muted px-3" 
                                    value={localProfile.email} readOnly/>
                            </div>

                            <button type="submit" className="btn btn-primary w-100 rounded-pill fw-bold py-2 shadow-sm" disabled={isSavingProfile}>
                                {isSavingProfile ? <span className="spinner-border spinner-border-sm"></span> : 'Update Information'}
                            </button>
                            {profileMessage && <div className="mt-2 small text-center fw-bold text-primary">{profileMessage}</div>}
                        </form>
                    </div>
                </div>

                {/* 3. SECURITY & DANGER ZONE */}
                <div className="col-lg-4">
                    <div className="d-flex flex-column gap-4" style={{ height: '100%' }}>
                        {/* Change Password Card */}
                        <div className="p-4" style={cardStyle}>
                            <h6 className="fw-bold mb-4 text-dark"><i className="fas fa-lock me-2 text-warning"></i>Security</h6>
                            <form onSubmit={handleChangePassword}>
                                <div className="mb-3 position-relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Current Password" 
                                        className="form-control border rounded-pill bg-light text-dark ps-3 pe-5" 
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                                        required
                                    />
                                    <i 
                                        className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    ></i>
                                </div>
                                <div className="mb-3">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="New Password" 
                                        className="form-control border rounded-pill bg-light text-dark px-3" 
                                        value={passwords.next}
                                        onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                                        required
                                    />
                                </div>
                                <button className="btn btn-dark w-100 rounded-pill fw-bold shadow-sm" disabled={isChangingPassword}>
                                    {isChangingPassword ? <span className="spinner-border spinner-border-sm"></span> : 'Update Password'}
                                </button>
                                {passwordMessage && <div className={`mt-2 small text-center fw-bold ${passwordMessage.includes('✅') ? 'text-success' : 'text-danger'}`}>{passwordMessage}</div>}
                            </form>
                        </div>

                        {/* Danger Zone Card */}
                        <div className="p-4 border border-danger border-2 rounded-4 bg-white shadow-sm">
                            <h6 className="text-danger fw-bold mb-2"><i className="fas fa-exclamation-triangle me-2"></i>Danger Zone</h6>
                            <p className="text-muted small">Caution: These actions cannot be undone. (irreversible).</p>
                            
                            <button 
                                onClick={handleResetLogs}
                                className="btn btn-outline-danger btn-sm w-100 rounded-pill mb-2 fw-bold"
                            >
                                <i className="fas fa-trash-alt me-2"></i>Reset Sensor Logs
                            </button>
                            
                            <button 
                                onClick={handleDeleteAccount}
                                className="btn btn-danger btn-sm w-100 rounded-pill fw-bold"
                            >
                                <i className="fas fa-user-times me-2"></i>Delete My Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .bg-success-light { background: #e6f7ed; }
                .bg-primary-light { background: #e7efff; }
                .bg-soft-primary { background: #f0f4ff; }
                .avatar-circle { 
                    width: 80px; height: 80px; background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); 
                    color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    font-size: 2.2rem; font-weight: bold;
                }
                .form-control, .form-select {
                    color: #2d3748 !important;
                    transition: all 0.2s;
                    height: 45px;
                }
                .form-control:focus { 
                    background: #fff !important; 
                    box-shadow: 0 0 0 4px rgba(72, 187, 120, 0.1) !important; 
                    border-color: #48bb78 !important; 
                }
                .custom-switch { width: 3rem !important; height: 1.5rem !important; cursor: pointer; }
                .position-relative i:hover { color: #2d3748 !important; }
            `}</style>
        </div>
    );
};

export default Settings;