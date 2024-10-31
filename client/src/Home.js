import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const [user, setUser] = useState({ firstName: '', lastName: '', admin: false });
    const [articles, setArticles] = useState([]); // To store articles
    const [newArticle, setNewArticle] = useState({ title: '', content: '' }); // For posting a new article
    const [mediaFiles, setMediaFiles] = useState([]); // To store selected media files
    const [userId, setUserId] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState([]);


    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrentUserAndConnectedUsers = async () => {
            try {
                // Fetch the current user information from the session
                const userResponse = await axios.get('/api/users/current-user');
                setUserId(userResponse.data._id);
                console.log('userId:', userResponse.data._id); // Use userResponse.data._id directly
    
                // Fetch connected users
                const connectedUserIds = userResponse.data.connectedWith || [];
    
                // Use Promise.allSettled to handle both fulfilled and rejected promises
                const userDetailRequests = connectedUserIds.map(id =>
                    axios.get(`/api/users/${id}`)
                );
                const userDetails = await Promise.allSettled(userDetailRequests);
    
                // Filter out successful and failed requests
                const successfulDetails = userDetails
                    .filter(result => result.status === 'fulfilled')
                    .map(result => result.value.data);
    
                const failedDetails = userDetails
                    .filter(result => result.status === 'rejected');
    
                // Set the connected users to the successfully fetched ones
                setConnectedUsers(successfulDetails);
    
                // Optionally, log or handle the failed requests
                if (failedDetails.length > 0) {
                    console.warn('Some connected users could not be fetched:', failedDetails);
                }
            } catch (error) {
                console.error('Error fetching current user or connected users:', error);
                window.location.href = '/signin'; // Redirect to sign-in if there's an error
            }
        };
    
        fetchCurrentUserAndConnectedUsers();
    }, []);
    

    useEffect(() => {
        axios.get('/api/users/current-user', { withCredentials: true })
            .then(response => {
                if (response.data && response.data._id) {
                    const { firstName, lastName, admin, _id } = response.data;
                    setUser({ firstName, lastName, admin, _id });
                    console.log('Current user fetched:', { firstName, lastName, admin, _id });
    
                    // Fetch recommended articles based on the user's ID
                    return axios.get(`/api/articles/articles/${_id}`, { withCredentials: true });
                } else {
                    console.error('User not authenticated');
                    window.location.href = '/signin'; // Redirect if user not authenticated
                }
            })
            .then(response => {
                if (response && response.data) {
                    console.log('Articles fetched:', response.data);
                    const fetchedArticles = Array.isArray(response.data) ? response.data : [];
                    setArticles(fetchedArticles);
                }
            })
            .catch(error => {
                // Check if the error is a 401 (unauthorized)
                if (error.response && error.response.status === 401) {
                    console.error('User not authenticated, redirecting to sign-in');
                    window.location.href = '/signin'; // Redirect to sign-in
                } else {
                    console.error('Error fetching user or articles:', error);
                }
            });
    }, []);

    const handleSignOut = () => {
        axios.post('/api/signout')
            .then(() => {
                console.log('User signed out');
                window.location.href = '/signin';
            })
            .catch(error => {
                console.error('Error signing out:', error);
            });
    };

    const handlePostArticle = () => {
        const authorName = `${user.firstName} ${user.lastName}`;

        const formData = new FormData();
        formData.append('title', newArticle.title);
        formData.append('content', newArticle.content);
        formData.append('authorId', user._id);
        formData.append('authorName', authorName);

        mediaFiles.forEach((file) => {
            formData.append('media', file);
        });

        axios.post('/api/articles/', formData)
            .then(response => {
                console.log('Article posted:', response.data); // Log the posted article
                setArticles([response.data, ...articles]);
                setNewArticle({ title: '', content: '' });
                setMediaFiles([]); // Clear selected files
            })
            .catch(error => {
                console.error('Error posting article:', error);
            });
    };

    const handleFileChange = (e) => {
        setMediaFiles(Array.from(e.target.files));
    };

    const handleArticleClick = async (articleId) => {
        try {
            console.log('Article clicked:', articleId);
    
            // Check if interaction already exists
            const interactionExists = await axios.get('/api/interactions/articles', {
                params: {
                    userId: user._id,
                    articleId: articleId,
                    interactionType: 'viewed'
                },
                withCredentials: true
            });
    
            if (interactionExists.data && interactionExists.data._id) {
                // If interaction exists, just navigate
                console.log('Interaction already exists. Redirecting...');
                navigate(`/home/articles/${articleId}`);
            } 
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // If interaction does not exist (404), log it
                console.log('Interaction not found. Logging interaction...');
    
                const payload = {
                    userId: user._id,
                    articleId: articleId,
                    interactionType: 'viewed',
                };
    
                await axios.post('/api/interactions/articles', payload, { withCredentials: true });
    
                // Redirect to the article's detail page after logging the interaction
                navigate(`/home/articles/${articleId}`);
            } else {
                console.error('Error checking or logging interaction:', error.response ? error.response.data : error.message);
            }
        }
    };
    
    return (
        <div className="home">
            <div className="topnav">
                <a className="active" href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
                <div className="user-dropdown">
                    <div className="user-container">
                        <button className="user-button">
                            {user.firstName} {user.lastName}
                        </button>
                        <div className="dropdown-content">
                            <button onClick={handleSignOut}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="main-content">
                <div className="sidebar">
                    <h2>Navigation</h2>
                    <ul>
                        <li><a href="/home/personaldetails">Personal Details</a></li>
                        <li><a href="/home/network">Network</a></li>
                    </ul>
                </div>
                <div className="timeline">
                    <h1>Welcome to WorkNow!</h1>
                    <div className="post-article">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newArticle.title}
                            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            value={newArticle.content}
                            onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                        ></textarea>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                        />
                        <button className="button-post" onClick={handlePostArticle}>Post</button>
                    </div>
                    <div className="articles-container">
                        <div className="articles">
                            <h2>{user.admin ? "All Articles" : "Your Timeline"}</h2>
                            {articles.length > 0 ? (
                                articles.map(article => (
                                    <div key={article._id} className="article">
                                        <div className="article-header">
                                            <h3 onClick={() => handleArticleClick(article._id)}>
                                                {article.title}
                                            </h3>
                                            <p><small>Posted by {article.authorName} on {new Date(article.createdAt).toLocaleString()}</small></p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No articles found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
