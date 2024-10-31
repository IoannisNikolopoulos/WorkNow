import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import axios from 'axios';
import './ViewUserAdmin.css';

function ViewUserAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [commentsOnOtherArticles, setCommentsOnOtherArticles] = useState([]);
  const [notesOfInterest, setNotesOfInterest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(`/api/users/admin/users/${userId}`);
        if (userResponse.data) {
          setUser(userResponse.data);
        } else {
          setError('User data is unavailable.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data. Please try again later.');
      }
    };

    const fetchUserArticles = async () => {
      try {
        const articlesResponse = await axios.get(`/api/articles/${userId}`);
        
        // Check if response is an array or an object with 'articles' key
        const articlesData = Array.isArray(articlesResponse.data) ? articlesResponse.data : articlesResponse.data.articles || [];
        
        setArticles(articlesData.filter(article => article.authorId === userId));
      } catch (error) {
        console.error('Error fetching user articles:', error);
        setError('Failed to fetch user articles. Please try again later.');
      }
    };
    

    const fetchUserJobListings = async () => {
      try {
        const jobListingsResponse = await axios.get(`/api/job-listings?userId=${userId}`);
        setJobListings(jobListingsResponse.data.filter(listing => listing.userId === userId));
      } catch (error) {
        console.error('Error fetching user job listings:', error);
        setError('Failed to fetch user job listings. Please try again later.');
      }
    };

    const fetchCommentsAndInterests = async () => {
      try {
        const articlesResponse = await axios.get(`/api/articles/${userId}`);
        
        // Check if response is an array or an object with 'articles' key
        const articlesData = Array.isArray(articlesResponse.data) ? articlesResponse.data : articlesResponse.data.articles || [];
        
        const userComments = [];
        const userInterests = [];
    
        articlesData.forEach(article => {
          article.comments.forEach(comment => {
            if (comment.userId === userId) {
              userComments.push({
                articleTitle: article.title,
                content: comment.content,
                createdAt: comment.createdAt,
              });
            }
          });
    
          if (article.interested && article.interested.includes(userId)) {
            userInterests.push(article.title);
          }
        });
    
        setCommentsOnOtherArticles(userComments);
        setNotesOfInterest(userInterests);
      } catch (error) {
        console.error('Error fetching comments and interests:', error);
        setError('Failed to fetch comments and interests. Please try again later.');
      }
    };
    

    fetchUserData();
    fetchUserArticles();
    fetchUserJobListings();
    fetchCommentsAndInterests();
    setLoading(false);
  }, [userId]);

  const handleDeleteUser = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      alert('User deleted successfully');
      navigate('/admin/users'); // Redirect to the users list or another appropriate page
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again later.');
    }
  };

  const handleArticleClick = () => {
    navigate('/home'); // Redirect to the home page
  };

  const handleJobListingClick = () => {
    navigate('/home/listings'); // Redirect to the job listings page
  };

  const handleConnectionClick = (connectionId) => {
    navigate(`/admin/users/${connectionId}`); // Redirect to the ViewUserAdmin page of the connection
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!user) {
    return <div className="error-message">No user data available.</div>;
  }

  const {
    firstName,
    lastName,
    email,
    number,
    photo,
    education,
    workExperience,
    currentPosition,
    skills,
    connectedWith,
  } = user;

  const biography = `${education || ''}\n${workExperience || ''}\n${currentPosition || ''}`.trim();

  return (
    <div className="view-user-admin">
      <div className="user-header">
        <img src={photo || 'default-profile.png'} alt={`${firstName} ${lastName}`} className="user-photo" />
        <div className="user-info">
          <h1>{firstName} {lastName}</h1>
          {biography ? (
            <pre className="biography">{biography}</pre>
          ) : (
            <p>No biography available.</p>
          )}
        </div>
      </div>
      <p><strong>E-mail:</strong> {email || 'No email provided.'}</p>
      <p><strong>Number:</strong> {number || 'No phone number provided.'}</p>
      {skills && skills.length > 0 ? (
        <p><strong>Skills:</strong> {skills.join(', ')}</p>
      ) : (
        <p><strong>Skills:</strong> No skills listed.</p>
      )}

      <div className="user-articles">
        <h2>Articles</h2>
        {articles.length > 0 ? (
          articles.map(article => (
            <div key={article._id} className="article-item" onClick={handleArticleClick}>
              <h3>{article.title}</h3>
            </div>
          ))
        ) : (
          <p>No articles found</p>
        )}
      </div>

      <div className="user-job-listings">
        <h2>Job Listings</h2>
        {jobListings.length > 0 ? (
          jobListings.map(listing => (
            <div key={listing._id} className="job-item" onClick={handleJobListingClick}>
              <h3>{listing.title}</h3>
            </div>
          ))
        ) : (
          <p>No job listings found</p>
        )}
      </div>

      <div className="user-interests">
        <h2>Notes of Interest</h2>
        {notesOfInterest.length > 0 ? (
          notesOfInterest.map((interest, index) => (
            <div key={index} className="interest-item">
              <p>{interest}</p>
            </div>
          ))
        ) : (
          <p>No notes of interest found</p>
        )}
      </div>

      <div className="user-comments">
        <h2>Comments on Other Articles</h2>
        {commentsOnOtherArticles.length > 0 ? (
          commentsOnOtherArticles.map((comment, index) => (
            <div key={index} className="comment-item">
              <p><strong>Article:</strong> {comment.articleTitle}</p>
              <p>"{comment.content}"</p> {/* Added quotations here */}
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p>No comments found on other articles</p>
        )}
      </div>

      <div className="user-network">
        <h2>Connections</h2>
        {connectedWith && connectedWith.length > 0 ? (
          connectedWith.map(connection => (
            <div key={connection._id} className="network-item" onClick={() => handleConnectionClick(connection._id)}>
              <p>{connection.firstName} {connection.lastName}</p>
            </div>
          ))
        ) : (
          <p>No connections found</p>
        )}
      </div>

      {/* Delete User Button */}
      <div className="delete-user-button">
        <button onClick={handleDeleteUser}>Delete User</button>
      </div>
    </div>
  );
}

export default ViewUserAdmin;
