import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const AdminRoute = ({ element: Element, ...rest }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Make an API call to check if the current session belongs to an admin
        axios.get('/api/users/check-admin')
            .then(response => {
                if (response.data.isAdmin) {
                    setIsAdmin(true);
                }
            })
            .catch(error => {
                console.error('Error checking admin status:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return <div>Loading...</div>; // You can replace this with a spinner or loader
    }

    return isAdmin ? <Element {...rest} /> : <Navigate to="/signin" />;
};

export default AdminRoute;
