import React from 'react';
import './AdminPortal.css';

function AdminPortal() {
    return (
        <div className="container">
            <img src="logo-color.png" alt="WorkNow Logo" />
            <h1>WorkNow Admin Portal</h1>
            <br />
            <a href="/manageusers">
                <button className="button-manage-users">Manage users</button>
            </a>
            <br />
        </div>
    );
}

export default AdminPortal;
