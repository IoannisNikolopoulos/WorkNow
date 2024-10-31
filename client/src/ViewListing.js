import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ViewListing.css';

function ViewListing() {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [error, setError] = useState('');
    const userId = String(localStorage.getItem('userId')); // Get user ID from localStorage
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const response = await axios.get(`/api/job-listings/${id}`, { params: { userId } });
                setListing(response.data);
    
                // Only proceed to check interactions if the listing was fetched successfully
                if (response.data.isConnected) {
                    try {
                        const interactionResponse = await axios.get('/api/interactions', {
                            params: {
                                userId: userId,
                                jobId: id,
                            }
                        });
    
                        // Safely check if the interaction exists and contains 'connected'
                        const interactionExists = interactionResponse.data?.interactionType?.includes('connected');
    
                        // Log the "connected" interaction if not already logged
                        if (!interactionExists) {
                            await axios.post('/api/interactions', {
                                userId: userId,
                                jobId: id,
                                interactionType: 'connected',
                                interactionScore: 1,
                            });
                        }
                    } catch (interactionError) {
                        console.error('Error checking or logging interaction:', interactionError);
                        setError('An error occurred while checking or logging interactions.');
                    }
                }
            } catch (listingError) {
                console.error('Error fetching listing:', listingError);
                if (listingError.response) {
                    setError(listingError.response.data.error || 'An error occurred while fetching the job listing.');
                } else if (listingError.request) {
                    setError('No response from the server. Please try again later.');
                } else {
                    setError('An error occurred while fetching the job listing.');
                }
            }
        };

        const checkInteractions = async () => {
            try {
                // Check if user has applied
                const appliedResponse = await axios.get('/api/interactions/jobs', {
                    params: {
                        userId,
                        jobId: id,
                        interactionType: 'applied',
                    }
                });

                if (appliedResponse.data && appliedResponse.data._id) {
                    setApplied(true); // User has applied
                }

            } catch (err) {
                console.error('Error checking interactions:', err);
            }
        };
    
        fetchListing();
        checkInteractions();
    }, [id, userId]);
    
    
    const handleApply = async () => {
        try {
            // First, apply to the job by calling the apply endpoint
            const applyResponse = await axios.post(`/api/job-listings/${id}/apply`, {
                userId: userId,
            });
    
            // Log the "applied" interaction by calling the interactions endpoint
            await axios.post('/api/interactions', {
                userId: userId,
                jobId: id,
                interactionType: 'applied',
                interactionScore: 1,
            });
    
            // Update the applied state to true
            setApplied(true);
    
            alert(`Successfully applied to the listing: ${listing.title}`);
        } catch (error) {
            console.error('Error applying to job listing:', error.response?.data || error.message);
            alert('Failed to apply. Please try again.');
        }
    };
    
    

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!listing) {
        return <div>Loading...</div>;
    }

    return (
        <div className="view-listing">
            <h1>{listing.title}</h1>
            <p><strong>Description:</strong> {listing.description}</p>
            <p><strong>Posted by:</strong> {listing.poster}</p>
            <p><strong>Skills required:</strong> {(listing.skills || []).join(', ')}</p>
            {/* Apply button */}
            <button 
                className={applied ? "applied-button" : "button-apply-listing"} 
                disabled = {applied} 
                onClick={handleApply}>
            {applied ? "Applied" : "Apply"}
            </button>
        </div>
    );
}

export default ViewListing;
