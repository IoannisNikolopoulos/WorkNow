import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Notifications.css'; // Import the CSS file for styling
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

function Notifications() {
    const [requests, setRequests] = useState([]);
    const [articleNotifications, setArticleNotifications] = useState([]);
    const [jobListingsWithApplicants, setJobListingsWithApplicants] = useState([]); // New state for job listings with applicants
    const [message, setMessage] = useState('');
    const [user, setUser] = useState(null); // New state to store user data

    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/users/current-user');
                const userData = response.data;
                setUser(userData);

                // Fetch connection requests
                try {
                    const requestsResponse = await axios.get(`/api/connectionrequests/${userData._id}`);
                    const fetchedRequests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
                    setRequests(fetchedRequests);
                } catch (error) {
                    console.error('Error fetching connection requests:', error);
                    setRequests([]); // Ensure requests is an array
                }

                // Fetch article notifications
                try {
                    const articleNotificationsResponse = await axios.get(`/api/articles/notifications/${userData._id}`);
                    if (Array.isArray(articleNotificationsResponse.data)) {
                        setArticleNotifications(articleNotificationsResponse.data);
                    } else {
                        console.error('Invalid data format received for article notifications:', articleNotificationsResponse.data);
                        setArticleNotifications([]);
                    }
                } catch (error) {
                    console.error('Error fetching article notifications:', error);
                    setArticleNotifications([]); // Ensure articleNotifications is an array
                }

                // Fetch job listings with applicants
                try {
                    const jobListingsResponse = await axios.get(`/api/job-listings/my-job-listings-with-applicants`, {
                        params: { userId: userData._id }
                    });
                    const fetchedListings = Array.isArray(jobListingsResponse.data) ? jobListingsResponse.data : [];
                    setJobListingsWithApplicants(fetchedListings);
                } catch (error) {
                    console.error('Error fetching job listings with applicants:', error);
                    setJobListingsWithApplicants([]); // Ensure jobListingsWithApplicants is an array
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                window.location.href = '/signin'; // Redirect to sign-in if there's an error
            }
        };

        fetchUserData();
    }, []);

    const handleAccept = async (id) => {
        try {
            const response = await axios.post(`/api/connection-requests/${id}/accept`, { userId: user._id });
            if (response.data.success) {
                setRequests((prevRequests) => prevRequests.filter((request) => request._id !== id));
                alert(response.data.message); // Optional: Display a success message
            } else {
                alert(response.data.message || 'Failed to accept the connection request.');
            }
        } catch (error) {
            console.error('Error accepting connection request:', error);
            alert('Error accepting connection request.');
        }
    };

    const handleReject = async (id) => {
        try {
            const response = await axios.put(`/api/connectionrequests/${id}`, { status: 'rejected' });
            setRequests((prevRequests) => prevRequests.filter((request) => request._id !== id));
            setMessage(response.data.message);
        } catch (error) {
            console.error('Error rejecting connection request:', error);
            setMessage('Failed to reject request');
        }
    };

    // New handler for navigating to ViewArticle
    const handleArticleClick = (articleId) => {
        navigate(`/home/articles/${articleId}`); // Redirect to the ViewArticle page
    };

    // New handler for navigating to ViewListing
    const handleListingClick = (listingId) => {
        navigate(`/home/listings/viewlisting/${listingId}`); // Redirect to the ViewListing page
    };

    const handleApplicantClick = (applicantId) => {
        navigate(`/users/${applicantId}`); // Redirect to the applicant's ViewUser page
    };

    return (
        <div className="notifications">
            <div className="topnav">
                <a href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a className="active" href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
            </div>
            <div className="notifications-container">
                <div className="connection-requests">
                    <h2>Connection Requests</h2>
                    {requests.length > 0 ? (
                        requests.map((request) => (
                            <div key={request._id} className="request-item">
                                <a href={`/users/${request.senderId._id}`}>{request.senderId.firstName} {request.senderId.lastName}</a>
                                <div className="request-actions">
                                    <button className="button accept" onClick={() => handleAccept(request._id)}>Accept</button>
                                    <button className="button reject" onClick={() => handleReject(request._id)}>Reject</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <h5>No connection requests</h5>
                    )}
                    {message && <p className="message">{message}</p>}
                </div>

                <div className="articles-jobs-container">
                    <div className="article-notifications">
                        <h2>Article Notifications</h2>
                        {Array.isArray(articleNotifications) && articleNotifications.length > 0 ? (
                            articleNotifications.map((notification) => (
                                <div key={notification.articleId} className="notification-item">
                                    <h3 onClick={() => handleArticleClick(notification.articleId)}>Article: {notification.title}</h3>
                                    {notification.interestedUsers.length > 0 && (
                                        <div className="interests">
                                            <h4>Interested Users:</h4>
                                            <ul>
                                                {notification.interestedUsers.map(user => (
                                                    <li key={user._id}>
                                                        <a href={`/users/${user._id}`}>{user.name}</a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {notification.comments.length > 0 && (
                                        <div className="comments">
                                            <h4>Comments:</h4>
                                            {notification.comments.map(comment => (
                                                <div key={comment._id} className="comment-item">
                                                    <p>"{comment.content}" - <a href={`/users/${comment.userId}`}>{comment.userName}</a> at {new Date(comment.createdAt).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No article notifications</p>
                        )}
                    </div>

                    <div className="job-listings-with-applicants">
                        <h2>Your Job Listings</h2>
                        {jobListingsWithApplicants.length > 0 ? (
                            jobListingsWithApplicants.map((listing) => (
                                <div key={listing._id} className="listing-item">
                                    <h3 onClick={() => handleListingClick(listing._id)}>{listing.title}</h3>
                                    <p>{listing.description}</p>
                                    {listing.applicants.length > 0 ? (
                                        <div className="applicants">
                                            <h4>Applicants:</h4>
                                            <ul>
                                                {listing.applicants.map((applicant) => (
                                                    <li key={applicant._id} onClick={() => handleApplicantClick(applicant._id)} className="applicant-link">
                                                        {applicant.firstName} {applicant.lastName} ({applicant.email})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p>No applicants for this listing yet.</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No job listings found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Notifications;
