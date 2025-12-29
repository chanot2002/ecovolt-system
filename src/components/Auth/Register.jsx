import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match");
        try {
            setError("");
            setLoading(true);
            await signup(email, password);
            navigate("/");
        } catch (err) { setError(err.message.replace('Firebase: ', '')); }
        setLoading(false);
    };

    return (
        <div className="login-viewport d-flex align-items-center justify-content-center">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="login-container shadow-lg">
                {/* SIDEBAR WITH LOGO */}
                <div className="login-sidebar d-none d-lg-flex flex-column justify-content-between p-4 bg-light border-end">
                    <div className="text-center mt-4">
                        <img src="/logo.png" alt="EcoVolt Logo" style={{ width: '100px', marginBottom: '20px' }} />
                        <h4 className="fw-bold text-dark mb-1">Join EcoVolt</h4>
                        <p className="text-muted small px-3">Create your account to start managing energy analytics.</p>
                        
                        <div className="mt-5 text-start px-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="step-badge me-3">1</div>
                                <small className="text-secondary fw-bold">Admin Details</small>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <div className="step-badge me-3">2</div>
                                <small className="text-secondary fw-bold">System Access</small>
                            </div>
                        </div>
                    </div>
                    <div className="small text-muted opacity-75 text-center">© 2025 EcoVolt Technologies.</div>
                </div>

                {/* REGISTER FORM AREA */}
                <div className="login-form-area p-4 p-md-5 bg-white">
                    <div className="mb-4 text-center text-md-start">
                        <h3 className="fw-bold text-dark mb-1">Create Account</h3>
                        <p className="text-muted small">Initialize your system access key.</p>
                    </div>

                    {error && <div className="alert-custom alert-error mb-3">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label className="label-saas">EMAIL ADDRESS</label>
                            <div className="input-saas-wrapper">
                                <i className="fas fa-envelope me-2 text-muted"></i>
                                <input type="email" className="input-saas" placeholder="user@ecovolt.sys" 
                                    onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group mb-3">
                            <label className="label-saas">PASSWORD</label>
                            <div className="input-saas-wrapper">
                                <i className="fas fa-lock me-2 text-muted"></i>
                                <input type={showPassword ? "text" : "password"} className="input-saas" 
                                    placeholder="Min. 6 characters" onChange={(e) => setPassword(e.target.value)} required />
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer text-muted`}
                                    onClick={() => setShowPassword(!showPassword)}></i>
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="label-saas">CONFIRM PASSWORD</label>
                            <div className="input-saas-wrapper">
                                <i className="fas fa-check-circle me-2 text-muted"></i>
                                <input type={showPassword ? "text" : "password"} className="input-saas" 
                                    placeholder="Repeat password" onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-saas-primary mb-3">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : 'INITIALIZE ACCOUNT'}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="small text-muted">Already have an account? <Link to="/login" className="text-success fw-bold text-decoration-none ms-1">Sign In</Link></p>
                    </div>
                </div>
            </div>

            <style>{`
                /* Same CSS variables as Login for consistency */
                .login-viewport { min-height: 100vh; background: #f1f5f9; }
                .login-container { display: flex; width: 950px; min-height: 550px; border-radius: 24px; overflow: hidden; }
                .login-sidebar { width: 380px; }
                .step-badge { width: 24px; height: 24px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
                .login-form-area { flex: 1; }
                .label-saas { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; display: block; }
                .input-saas-wrapper { display: flex; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0 15px; }
                .input-saas-wrapper:focus-within { border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.1); }
                .input-saas { background: transparent; border: none; padding: 12px 5px; width: 100%; outline: none; }
                .btn-saas-primary { background: #22c55e; color: white; border: none; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; transition: 0.3s; }
                .btn-saas-primary:hover { background: #16a34a; transform: translateY(-1px); }
                .alert-custom { padding: 12px; border-radius: 10px; font-size: 13px; text-align: center; }
                .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
                .cursor-pointer { cursor: pointer; }
                @media (max-width: 992px) { .login-container { width: 450px; } }
            `}</style>
        </div>
    );
};

export default Register;