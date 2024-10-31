import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

function Settings() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [confirmNewEmail, setConfirmNewEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    const [userId, setUserId] = useState(null); // Store the user ID

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get('/api/users/current-user');
                const userData = response.data;
                setUserId(userData._id);
                console.log('Current user ID:', userData._id);
            } catch (error) {
                console.error('Error fetching user details:', error);
                window.location.href = '/signin'; // Redirect to sign-in if not authenticated
            }
        };

        fetchUserDetails();
    }, []);

    const handleCurrentPasswordChange = (e) => {
        setCurrentPassword(e.target.value);
    };

    const handleNewPasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleConfirmNewPasswordChange = (e) => {
        setConfirmNewPassword(e.target.value);
    };

    const handleNewEmailChange = (e) => {
        setNewEmail(e.target.value);
    };

    const handleConfirmNewEmailChange = (e) => {
        setConfirmNewEmail(e.target.value);
    };

    const handleSaveChanges = async () => {
        setIsButtonVisible(false); // Hide the button immediately after click

        // Check if user is updating the email only
        if (newEmail && !newPassword && !confirmNewPassword) {
            if (newEmail !== confirmNewEmail) {
                setMessage('New email addresses do not match');
                setMessageType('error');
                setIsButtonVisible(true); // Show the button again if there's an error
                return;
            }

            try {
                const response = await axios.put(`/api/users/${userId}/email`, { newEmail });

                if (response.data.success) {
                    setMessage('Email changed successfully');
                    setMessageType('success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    setMessage(response.data.message || 'Error updating email');
                    setMessageType('error');
                    setIsButtonVisible(true); // Show the button again if there's an error
                }
            } catch (error) {
                console.error('Error updating email:', error);
                setMessage('Error updating email');
                setMessageType('error');
                setIsButtonVisible(true); // Show the button again if there's an error
            }
            return;
        }

        // Check if user is updating the password only
        if (newPassword && confirmNewPassword) {
            if (!currentPassword) {
                setMessage('Current password is required to change password');
                setMessageType('error');
                setIsButtonVisible(true); // Show the button again if there's an error
                return;
            }

            if (newPassword !== confirmNewPassword) {
                setMessage('New passwords do not match');
                setMessageType('error');
                setIsButtonVisible(true); // Show the button again if there's an error
                return;
            }

            try {
                const response = await axios.put(`/api/users/${userId}/password`, {
                    currentPassword,
                    newPassword,
                });

                if (response.data.success) {
                    setMessage('Password updated successfully');
                    setMessageType('success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    setMessage(response.data.message || 'Error updating password');
                    setMessageType('error');
                    setIsButtonVisible(true); // Show the button again if there's an error
                }
            } catch (error) {
                console.error('Error updating password:', error);
                setMessage('Error updating password');
                setMessageType('error');
                setIsButtonVisible(true); // Show the button again if there's an error
            }
            return;
        }

        setMessage('Please fill out the fields correctly to update your details');
        setMessageType('error');
        setIsButtonVisible(true); // Show the button again if there's an error
    };

    return (
        <div className="settings">
            <div className="topnav">
                <a href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a className="active" href="/home/settings">Settings</a>
            </div>
            <div className="settings-container">
                <h1>Settings</h1>
                <div className="form-group">
                    <label>New Email:</label>
                    <input type="email" value={newEmail} onChange={handleNewEmailChange} autoComplete='off' />
                </div>
                <div className="form-group">
                    <label>Confirm New Email:</label>
                    <input type="email" value={confirmNewEmail} onChange={handleConfirmNewEmailChange} />
                </div>
                <div className="form-group">
                    <label>Current Password (required for changing password):</label>
                    <input type="password" value={currentPassword} onChange={handleCurrentPasswordChange} autoComplete='off' />
                </div>
                <div className="form-group">
                    <label>New Password:</label>
                    <input type="password" value={newPassword} onChange={handleNewPasswordChange} />
                </div>
                <div className="form-group">
                    <label>Confirm New Password:</label>
                    <input type="password" value={confirmNewPassword} onChange={handleConfirmNewPasswordChange} />
                </div>
                {isButtonVisible && (
                    <button className="button" onClick={handleSaveChanges}>Save Changes</button>
                )}
                {message && (
                    <p className={`message-settings ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Settings;
