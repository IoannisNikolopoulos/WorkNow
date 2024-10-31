import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './Listings.css';

function Listings() {
    const [listings, setListings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResults, setFilteredResults] = useState([]);
    const [newListing, setNewListing] = useState({
        title: '',
        description: '',
        skills: '',
    });
    const [userSkills, setUserSkills] = useState([]);
    const [user, setUser] = useState({ admin: false });
    const [recommendedListings, setRecommendedListings] = useState([]);

    const userId = String(localStorage.getItem('userId'));

    const fetchUserData = useCallback(async () => {
        try {
            const response = await axios.get('/api/users/current-user');
            const { _id, firstName, lastName, skills, admin } = response.data;
            setUser({ _id, firstName, lastName, admin });
            setUserSkills(skills || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
            window.location.href = '/signin';
        }
    }, []);

    const fetchListings = useCallback(async () => {
        try {
            const response = await axios.get('/api/job-listings', {
                params: { userId }
            });
            setListings(response.data);
            console.log('Fetched listings:', response.data);
        } catch (error) {
            console.error('Error fetching listings:', error);
        }
    }, [userId]);

    const fetchRecommendations = useCallback(async () => {
        try {
            const response = await axios.get(`/api/recommendations/${userId}`);
            setRecommendedListings(response.data.recommendedJobs || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        }
    }, [userId]);

    const filterResults = useCallback((query) => {
        const userSkillsLowerCase = userSkills.map(skill => skill.toLowerCase());

        let results = listings.filter(listing =>
            listing.title.toLowerCase().includes(query.toLowerCase()) ||
            listing.description.toLowerCase().includes(query.toLowerCase())
        );

        if (userSkillsLowerCase.length > 0) {
            results.sort((a, b) => {
                const aMatches = a.skills.some(skill => userSkillsLowerCase.includes(skill.toLowerCase()));
                const bMatches = b.skills.some(skill => userSkillsLowerCase.includes(skill.toLowerCase()));

                if (aMatches && !bMatches) return -1;
                if (!aMatches && bMatches) return 1;
                return 0;
            });
        }

        setFilteredResults(results);
    }, [listings, userSkills]);

    useEffect(() => {
        if (userId) {
            fetchUserData();
            fetchListings();
            fetchRecommendations();
        }
    }, [userId, fetchUserData, fetchListings, fetchRecommendations]);

    useEffect(() => {
        if (listings.length > 0) {
            filterResults(searchQuery);
        }
    }, [listings, userSkills, filterResults, searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        filterResults(e.target.value);
    };

    const handleInputChange = (e) => {
        setNewListing({
            ...newListing,
            [e.target.name]: e.target.value,
        });
    };

    const handlePostListing = async () => {
        if (!newListing.title || !newListing.description || !newListing.skills) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await axios.post('/api/job-listings', {
                ...newListing,
                poster: `${user.firstName} ${user.lastName}`,
                userId,
                connected: true,
            });

            setListings([...listings, response.data]);
            setFilteredResults([...listings, response.data]);
            setNewListing({ title: '', description: '', skills: '' });
        } catch (error) {
            console.error('Error posting listing:', error);
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await axios.delete(`/api/job-listings/${listingId}`, { data: { userId } });
                setListings(listings.filter(listing => listing._id !== listingId));
                setFilteredResults(filteredResults.filter(listing => listing._id !== listingId));
                alert('Job listing deleted successfully.');
            } catch (error) {
                console.error('Error deleting listing:', error);
                alert('Failed to delete the job listing. Please try again later.');
            }
        }
    };

    const handleListingClick = async (listingId) => {
        try {
            await axios.post('/api/interactions', {
                userId: userId,
                jobId: listingId,
                interactionType: 'viewed',
                interactionScore: 1,
            });
            console.log('Interaction logged successfully');
        } catch (error) {
            console.error('Error logging interaction:', error);
        }
    };

    return (
        <div className="listings">
            <div className="topnav">
                <a href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a className="active" href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
            </div>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>
            <div className="post-listing">
                <h3>Post a New Job Listing</h3>
                <input
                    type="text"
                    name="title"
                    placeholder="Job Title"
                    value={newListing.title}
                    onChange={handleInputChange}
                />
                <textarea
                    name="description"
                    placeholder="Job Description"
                    value={newListing.description}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="skills"
                    placeholder="Required Skills (comma separated)"
                    value={newListing.skills}
                    onChange={handleInputChange}
                />
                <button onClick={handlePostListing}>Post Listing</button>
            </div>
            <div className="listings-container">
                <h3>Recommended Listings</h3>
                <div className="listings-grid">
                    {Array.isArray(recommendedListings) && recommendedListings.length > 0 ? (
                        recommendedListings.map(listing => (
                            <div key={listing._id} className={`listing-card ${listing.connected ? 'connected' : 'not-connected'}`}>
                                <h3 onClick={() => handleListingClick(listing._id)}>
                                    <Link to={`/home/listings/viewlisting/${listing._id}`}>
                                        {listing.title}
                                    </Link>
                                </h3>
                                <p><strong>Posted by:</strong> {listing.poster}</p>
                                <p><strong>Skills required:</strong> {(listing.skills || []).join(', ')}</p>
                            </div>
                        ))
                    ) : (
                        <p>No recommended listings found.</p>
                    )}
                </div>
                <h3>All Listings</h3>
                <div className="listings-grid">
                    {Array.isArray(filteredResults) && filteredResults.length > 0 ? (
                        filteredResults.map(listing => (
                            <div key={listing._id} className={`listing-card ${listing.connected ? 'connected' : 'not-connected'}`}>
                                <h3 onClick={() => handleListingClick(listing._id)}>
                                    <Link to={`/home/listings/viewlisting/${listing._id}`}>
                                        {listing.title}
                                    </Link>
                                </h3>
                                <p><strong>Posted by:</strong> {listing.poster}</p>
                                <p><strong>Skills required:</strong> {(listing.skills || []).join(', ')}</p>
                                {(user.admin || listing.userId === userId) && (
                                    <button
                                        className="button-delete"
                                        onClick={() => handleDeleteListing(listing._id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No listings found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Listings;
