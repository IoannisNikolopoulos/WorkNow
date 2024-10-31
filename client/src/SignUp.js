import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SignUp.css'; // Import the CSS file for styling

function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [number, setNumber] = useState('');
    const [photo, setPhoto] = useState(null);
    const [message, setMessage] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);
    const [loading, setLoading] = useState(false); // State for showing loader
    const [accountCreated, setAccountCreated] = useState(false); // State for account created message
    const [inputErrors, setInputErrors] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        firstName: false,
        lastName: false,
        number: false,
        photo: false,
    });

    const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for toggling confirm password visibility

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhoto(reader.result); // Convert file to base64 string
            setInputErrors(prev => ({ ...prev, photo: false }));
        };
        reader.readAsDataURL(file);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const validateEmail = (email) => {
        return email.includes("@gmail.com");
    };

    const handleSignUp = useCallback(() => {
        const errors = {
            email: !email || !validateEmail(email),
            password: !password,
            confirmPassword: !confirmPassword || password !== confirmPassword,
            firstName: !firstName,
            lastName: !lastName,
            number: isNaN(number) || !number || number.length < 10,
        };

        if (Object.values(errors).some(err => err)) {
            setInputErrors(errors);
            setMessage("Please insert the necessary credentials in the above fields");
        } else {
            setLoading(true); // Show loader
            setIsDisabled(true);
            setInputErrors({
                email: false,
                password: false,
                confirmPassword: false,
                firstName: false,
                lastName: false,
                number: false,
                photo: false,
            });

            // Send user data to the server
            axios.post('/api/users', {
                email,
                password,
                firstName,
                lastName,
                number,
                photo,
            }).then(response => {
                setLoading(false); // Hide loader
                setAccountCreated(true); // Show "Account created" message
                setTimeout(() => {
                    window.location.href = '/signin'; // Redirect to sign-in page
                }, 1000); // Show "Account was created" for 1 second
            }).catch(error => {
                setLoading(false); // Hide loader
                setIsDisabled(false);
                setMessage('Error creating account. Please try again.');
                console.error('There was an error!', error);
            });
        }
    }, [email, password, confirmPassword, firstName, lastName, number, photo]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                handleSignUp();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleSignUp]);

    return (
        <div className="container">
            <img src="/logo-color.png" alt="WorkNow Logo" />
            {loading ? (
                <div className="loader --5"></div> /* Loader is displayed when loading is true */
            ) : accountCreated ? (
                <h2 className="account-created">Account was created</h2>
            ) : (
                <div>
                    <label>
                        E-mail: 
                        <input type="text" id="e-mail" className={inputErrors.email ? 'error' : ''} value={email} onChange={e => {
                            setEmail(e.target.value);
                            setInputErrors(prev => ({ ...prev, email: false }));
                        }} />
                    </label>
                    <label className="password-container">
                        Password: 
                        <input type={showPassword ? "text" : "password"} id="password" className={inputErrors.password ? 'error' : ''} value={password} onChange={e => {
                            setPassword(e.target.value);
                            setInputErrors(prev => ({ ...prev, password: false }));
                        }} />
                        <span className={`toggle-password ${showPassword ? 'bold' : ''}`} onClick={togglePasswordVisibility}>
                            &#128065;
                        </span>
                    </label>
                    <label className="password-container">
                        Confirm Password: 
                        <input type={showConfirmPassword ? "text" : "password"} id="password2" className={inputErrors.confirmPassword ? 'error' : ''} value={confirmPassword} onChange={e => {
                            setConfirmPassword(e.target.value);
                            setInputErrors(prev => ({ ...prev, confirmPassword: false }));
                        }} />
                        <span className={`toggle-password ${showConfirmPassword ? 'bold' : ''}`} onClick={toggleConfirmPasswordVisibility}>
                            &#128065;
                        </span>
                    </label>
                    <label>
                        First name: <input type="text" id="firstName" className={inputErrors.firstName ? 'error' : ''} value={firstName} onChange={e => {
                            setFirstName(e.target.value);
                            setInputErrors(prev => ({ ...prev, firstName: false }));
                        }} /><br />
                    </label>
                    <label>
                        Last name: <input type="text" id="lastName" className={inputErrors.lastName ? 'error' : ''} value={lastName} onChange={e => {
                            setLastName(e.target.value);
                            setInputErrors(prev => ({ ...prev, lastName: false }));
                        }} /><br />
                    </label>
                    <label>
                        Contact number: <input type="text" id="number" className={inputErrors.number ? 'error' : ''} value={number} onChange={e => {
                            setNumber(e.target.value);
                            setInputErrors(prev => ({ ...prev, number: false }));
                        }} /><br />
                    </label>

                    <button className="button" id="submit" onClick={handleSignUp} disabled={isDisabled || loading}>
                        {isDisabled ? "Account was created" : "Sign up"}
                    </button>
                    {message && <p className="error-message">{message}</p>}
                </div>
            )}
        </div>
    );
}

export default SignUp;
