import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [isForgot, setIsForgot] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, loginWithGoogle, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            if (isForgot) {
                await resetPassword(email);
                setMessage('✅ Password reset link sent to your email.');
            } else {
                await login(email, password);
                navigate('/');
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            setError("Google connection failed.");
        }
    };

    return (
        <div className="login-viewport d-flex align-items-center justify-content-center">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
            
            <div className="login-container shadow-lg">
                {/* SIDEBAR WITH LOGO */}
                <div className="login-sidebar d-none d-lg-flex flex-column justify-content-between p-4 bg-light border-end">
                    <div className="text-center mt-4">
                        <img src="/logo.png" alt="EcoVolt Logo" style={{ width: '100px', marginBottom: '20px' }} />
                        <h4 className="fw-bold text-dark mb-1">EcoVolt</h4>
                        <span className="badge bg-soft-success text-success fs-small mb-4">SYSTEM v2.0</span>
                        <p className="text-muted small px-3">Advanced Energy Analytics & Monitoring System.</p>
                        
                        <div className="mt-5 text-start px-4">
                            <div className="d-flex align-items-center mb-3">
                                <i className="fas fa-shield-alt text-success me-3"></i>
                                <small className="text-secondary fw-bold">Secure Access</small>
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <i className="fas fa-bolt text-success me-3"></i>
                                <small className="text-secondary fw-bold">Live Monitoring</small>
                            </div>
                        </div>
                    </div>
                    <div className="small text-muted opacity-75 text-center">© 2025 EcoVolt Technologies.</div>
                </div>

                {/* LOGIN FORM AREA */}
                <div className="login-form-area p-4 p-md-5 bg-white">
                    <div className="mb-4 text-center text-md-start">
                        <h3 className="fw-bold text-dark mb-1">{isForgot ? 'Account Recovery' : 'System Login'}</h3>
                        <p className="text-muted small">Enter your authorized credentials.</p>
                    </div>

                    {error && <div className="alert-custom alert-error mb-3">{error}</div>}
                    {message && <div className="alert-custom alert-success mb-3">{message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label className="label-saas">EMAIL ADDRESS</label>
                            <div className="input-saas-wrapper">
                                <i className="fas fa-envelope me-2 text-muted"></i>
                                <input type="email" className="input-saas" placeholder="admin@ecovolt.sys" 
                                    onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        {!isForgot && (
                            <div className="form-group mb-4">
                                <div className="d-flex justify-content-between">
                                    <label className="label-saas">PASSWORD</label>
                                    <span className="forgot-link" onClick={() => setIsForgot(true)}>Forgot?</span>
                                </div>
                                <div className="input-saas-wrapper">
                                    <i className="fas fa-lock me-2 text-muted"></i>
                                    <input type={showPassword ? "text" : "password"} className="input-saas" 
                                        placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required />
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} cursor-pointer text-muted`}
                                        onClick={() => setShowPassword(!showPassword)}></i>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-saas-primary mb-3">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : (isForgot ? 'SEND RESET LINK' : 'AUTHORIZE LOGIN')}
                        </button>
                    </form>

                    {!isForgot && (
                        <>
                            <div className="divider mb-3"><span>OR</span></div>
                            <button onClick={handleGoogleLogin} className="btn-saas-google mb-4 border shadow-sm">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
                                Sign in with Google
                            </button>
                        </>
                    )}

                    <div className="text-center">
                        {isForgot ? (
                            <span className="text-success small fw-bold cursor-pointer" onClick={() => setIsForgot(false)}>Back to Login</span>
                        ) : (
                            <p className="small text-muted">New user? <Link to="/register" className="text-success fw-bold text-decoration-none ms-1">Register</Link></p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .login-viewport { min-height: 100vh; background: #f1f5f9; }
                .login-container { display: flex; width: 950px; min-height: 550px; border-radius: 24px; overflow: hidden; }
                .login-sidebar { width: 380px; }
                .login-form-area { flex: 1; }
                .label-saas { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; display: block; }
                .input-saas-wrapper { display: flex; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0 15px; }
                .input-saas-wrapper:focus-within { border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.1); }
                .input-saas { background: transparent; border: none; padding: 12px 5px; width: 100%; outline: none; }
                .btn-saas-primary { background: #22c55e; color: white; border: none; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; transition: 0.3s; }
                .btn-saas-primary:hover { background: #16a34a; transform: translateY(-1px); }
                .btn-saas-google { background: white; width: 100%; padding: 12px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; }
                .forgot-link { font-size: 11px; color: #22c55e; cursor: pointer; font-weight: 700; }
                .alert-custom { padding: 12px; border-radius: 10px; font-size: 13px; text-align: center; }
                .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
                .alert-success { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
                .divider { display: flex; align-items: center; text-align: center; color: #cbd5e1; font-size: 10px; font-weight: 800; }
                .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
                .divider:not(:empty)::before { margin-right: .75em; }
                .divider:not(:empty)::after { margin-left: .75em; }
                .cursor-pointer { cursor: pointer; }
                @media (max-width: 992px) { .login-container { width: 450px; } }
            `}</style>
        </div>
    );
};

export default Login;
