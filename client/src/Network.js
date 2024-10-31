import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Network.css';

function Network() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchCurrentUserAndConnectedUsers = async () => {
            try {
                // Fetch the current user information from the session
                const userResponse = await axios.get('/api/users/current-user');
                setUserId(userResponse.data._id);

                // Fetch connected users
                const connectedUserIds = userResponse.data.connectedWith || [];
                const userDetailRequests = connectedUserIds.map(id => axios.get(`/api/users/${id}`));
                const userDetails = await Promise.all(userDetailRequests);

                setConnectedUsers(userDetails.map(detail => detail.data));
            } catch (error) {
                console.error('Error fetching current user or connected users:', error);
                window.location.href = '/signin'; // Redirect to sign-in if there's an error
            }
        };

        fetchCurrentUserAndConnectedUsers();
    }, []);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query === '') {
            setSearchResults([]);
        } else {
            try {
                const response = await axios.get(`/api/users?search=${query}`);
                // Filter out the logged-in user and already connected users from search results
                const filteredResults = response.data.filter(user => 
                    user._id !== userId && !connectedUsers.some(connectedUser => connectedUser._id === user._id)
                );
                setSearchResults(filteredResults);
            } catch (error) {
                console.error('Error searching for users:', error);
            }
        }
    };

    const handleProfessionalClick = (id) => {
        window.location.href = `/users/${id}`;
    };

    const parsecurrentPosition = (currentPosition, isCurrentPositionPublic, isConnected) => {
        if (!isConnected && !isCurrentPositionPublic) {
            if (currentPosition && currentPosition.trim() !== '') {
                return { position: 'Position not public', employer: 'Employer not public' };
            }
            return { position: 'Position not provided', employer: 'Employer not provided' };
        }

        if (!currentPosition || currentPosition.trim() === '') {
            return { position: 'Position not provided', employer: 'Employer not provided' };
        }

        const [position, ...rest] = currentPosition.split(',');
        const employer = rest.join(',').trim() || 'Employer not provided';
        
        return { position: position.trim() || 'Position not provided', employer };
    };

    return (
        <div className="network">
            <div className="topnav">
                <a href="/home">Home</a>
                <a className="active" href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
            </div>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search professionals..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>
            <h2>Your Connections</h2>
            <div className="connections-container"> {/* Wrapper for scrollbar */}
                <div className="professionals-grid">
                    {connectedUsers.length > 0 ? (
                        connectedUsers.map(professional => {
                            const { position, employer } = parsecurrentPosition(
                                professional.currentPosition,
                                professional.isCurrentPositionPublic,
                                true // Assume connected users are always visible
                            );
                            return (
                                <div
                                    key={professional._id}
                                    className="professional-card"
                                    onClick={() => handleProfessionalClick(professional._id)}
                                >
                                    <img
                                        src={professional.photo || 'default-profile.png'}
                                        alt={`${professional.firstName} ${professional.lastName}`}
                                        className="professional-photo"
                                    />
                                    <h3>{professional.firstName} {professional.lastName}</h3>
                                    <p>{position}</p>
                                    <p>{employer}</p>
                                </div>
                            );
                        })
                    ) : (
                        <p>You have no connections yet.</p>
                    )}
                </div>
            </div>
            {searchResults.length > 0 && (
                <div className="search-results">
                    <h2>Search Results:</h2>
                    {searchResults.map(professional => {
                        const isConnected = connectedUsers.some(user => user._id === professional._id);
                        const { position, employer } = parsecurrentPosition(
                            professional.currentPosition,
                            professional.isCurrentPositionPublic,
                            isConnected
                        );
                        return (
                            <div
                                key={professional._id}
                                className="search-result"
                                onClick={() => handleProfessionalClick(professional._id)}
                            >
                                <img
                                    src={professional.photo || 'default-profile.png'}
                                    alt={`${professional.firstName} ${professional.lastName}`}
                                    className="professional-photo"
                                />
                                <h3>{professional.firstName} {professional.lastName}</h3>
                                <p>{position}</p>
                                <p>{employer}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Network;
