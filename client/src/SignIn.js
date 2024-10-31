import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SignIn.css';

function SignIn() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleLogin = useCallback(() => {
        setIsLoading(true);
        axios.post('/api/users/authenticate', { email, password }, { withCredentials: true })
            .then(response => {
                setIsLoggedIn(true);
                setIsAdmin(response.data.isAdmin);
                setFirstName(response.data.firstName);
                setLastName(response.data.lastName);

                // Store user session data in localStorage
                localStorage.setItem('userId', response.data.id);
                localStorage.setItem('firstName', response.data.firstName);
                localStorage.setItem('lastName', response.data.lastName);
                setIsLoading(false);
            })
            .catch(error => {
                alert('Invalid credentials');
                setIsLoading(false);
            });
    }, [email, password]);

    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }, [handleLogin]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className={`container ${isLoading ? 'loading' : ''}`}>
            <img src="logo-color.png" alt="WorkNow Logo" />
            {isLoading && !isLoggedIn && (
                <div className="loader-container">
                    <div className="loader --5"></div>
                </div>
            )}
            {isLoading && !isLoggedIn && (
                <h1>Signing In...</h1>
            )}
            {isLoggedIn && (
                <Dashboard isAdmin={isAdmin} firstName={firstName} />
            )}
            {!isLoading && !isLoggedIn && (
                <div>
                    <label className="input-label">
                        E-mail: <input type="text" value={email} onChange={e => setEmail(e.target.value)} /><br />
                    </label>
                    <label className="input-label">
                        Password: 
                        <div className="password-container">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                id="password" 
                            />
                            <span 
                                className={`toggle-password ${showPassword ? 'bold' : ''}`} 
                                onClick={() => setShowPassword(!showPassword)}
                            >&#128065;</span>
                        </div>
                    </label>
                    <div className="forgot-password">
                        <Link to='/home/forgotpassword'>Forgot password?</Link>
                    </div>
                    <button className="button" onClick={handleLogin} disabled={isLoading}>Sign in</button>
                </div>
            )}
        </div>
    );
}

function Dashboard({ isAdmin, firstName }) {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAdmin) {
                navigate('/adminportal');
            } else {
                navigate('/home');
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [isAdmin, navigate]);

    return (
        <div>
            {isAdmin ? (
                <p style={{ fontWeight: 'bold', fontSize: '24px' }}>Redirecting to the Admin Portal...</p>
            ) : (
                <p style={{ fontWeight: 'bold', fontSize: '24px' }}>Welcome, {firstName}!</p>
            )}
        </div>
    );
}

export default SignIn;
