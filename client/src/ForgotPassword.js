import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Reset Password
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordResetRequest = () => {
        setLoading(true);
        axios.post('/api/users/forgot-password', { email })
        .then(response => {
            setMessage(response.data.message);
            setStep(2); // Move to the next step to enter OTP
            
            // Automatically clear the message after 2 seconds
            setTimeout(() => {
                setMessage('');
            }, 2000);
        })
        .catch(error => {
            console.error('Error sending reset link:', error);
            setMessage('Error sending reset link. Please try again.');
            
            // Automatically clear the error message after 2 seconds
            setTimeout(() => {
                setMessage('');
            }, 2000);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handlePasswordReset = () => {
        setLoading(true);
        axios.post('https://localhost:3001/api/users/reset-password', { email, otp, newPassword })
            .then(response => {
                setMessage('Password reset successfully.');
                localStorage.setItem('userId', response.data.userId); // Store user ID in localStorage
                window.location.href = '/home'; // Redirect to home page
            })
            .catch(error => {
                console.error('Error resetting password:', error);
                setMessage('Failed to reset password. Please check your OTP and try again.');

                // Automatically clear the error message after 2 seconds
                setTimeout(() => {
                    setMessage('');
                }, 2000);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="forgot-password-container">
            <h1>Forgot Password</h1>
            {step === 1 ? (
                <>
                    <label>
                        Enter your email address below and we'll send you a link to reset your password. 
                        <input 
                            type="email" 
                            placeholder="Enter your email address"
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </label>
                    <button className="button" onClick={handlePasswordResetRequest} disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </>
            ) : (
                <>
                    <label>
                        Enter the OTP sent to your email:
                        <input 
                            type="text" 
                            placeholder="Enter OTP"
                            value={otp} 
                            onChange={e => setOtp(e.target.value)} 
                            required 
                        />
                    </label>
                    <label>
                        Enter your new password:
                        <input 
                            type="password" 
                            placeholder="New Password"
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            required 
                        />
                    </label>
                    <button className="button" onClick={handlePasswordReset} disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </>
            )}
            {message && (
                <div className="popup-message">
                    {message}
                </div>
            )}
        </div>
    );
}

export default ForgotPassword;
