import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewArticle.css'; // Import the CSS file for styling

function ViewArticle() {
    const { id } = useParams(); // Get the article ID from the URL parameters
    const navigate = useNavigate(); // For navigation after article deletion
    const [article, setArticle] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false); // State to track if the article has been liked
    const [interested, setInterested] = useState(false); // State to track if interest has been noted
    const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is an admin
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await axios.get(`/api/articles/home/${id}`, {
                    params: { userId }
                });
                setArticle(response.data);

                // Check if the user is an admin
                const userResponse = await axios.get('/api/users/current-user');
                setIsAdmin(userResponse.data.admin);

                // Log "connected" interaction if user is connected to the article poster
                if (response.data.isConnected) {
                    await logInteractionIfNotExists({
                        userId,
                        articleId: id,
                        interactionType: 'connected'
                    });
                }
            } catch (err) {
                setError(err.response?.data?.error || 'An error occurred while fetching the article.');
            }
        };

        const checkInteractions = async () => {
            try {
                // Check if the article has been liked
                const likedResponse = await axios.get('/api/interactions/articles', {
                    params: {
                        userId,
                        articleId: id,
                        interactionType: 'liked',
                    }
                });

                if (likedResponse.data && likedResponse.data._id) {
                    setLiked(true); // Article has already been liked
                }

                // Check if interest has been noted
                const interestedResponse = await axios.get('/api/interactions/articles', {
                    params: {
                        userId,
                        articleId: id,
                        interactionType: 'interested',
                    }
                });

                if (interestedResponse.data && interestedResponse.data._id) {
                    setInterested(true); // Interest has already been noted
                }

            } catch (err) {
                console.error('Error checking interactions:', err);
            }
        };

        fetchArticle();
        checkInteractions(); // Check interactions on component mount
    }, [id, userId]);

    // Helper function to log interaction only if it doesn't already exist
    const logInteractionIfNotExists = async ({ userId, articleId, interactionType }) => {
        try {
            const response = await axios.get('/api/interactions/articles', {
                params: { userId, articleId, interactionType },
            });

            if (!response.data || !response.data._id) {
                await axios.post('/api/interactions/articles', { userId, articleId, interactionType });
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                try {
                    await axios.post('/api/interactions/articles', { userId, articleId, interactionType });
                    console.log(`Logged ${interactionType} interaction.`);
                } catch (logError) {
                    console.error('Error logging interaction:', logError.response?.data || logError.message);
                }
            } else {
                console.error('Error checking interaction:', error.response?.data || error.message);
            }
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) {
            alert("Comment can't be empty");
            return;
        }

        try {
            const userName = `${localStorage.getItem('firstName')} ${localStorage.getItem('lastName')}`;

            const response = await axios.post(`/api/articles/${id}/comments`, {
                userId,
                userName,
                content: newComment
            });

            setArticle(prevArticle => ({
                ...prevArticle,
                comments: [...(prevArticle?.comments || []), response.data]
            }));

            setNewComment(''); // Clear the comment input

            await axios.post('/api/interactions/articles', {
                userId,
                articleId: id,
                interactionType: 'commented',
            });

        } catch (err) {
            console.error('Error posting comment:', err);
            alert('Failed to post comment. Please try again.');
        }
    };

    const handleLikeArticle = async () => {
        try {
            await axios.post('/api/interactions/articles', {
                userId,
                articleId: id,
                interactionType: 'liked',
            });

            setLiked(true); // Mark the article as liked
            alert('Article liked!');
        } catch (err) {
            console.error('Error liking article:', err);
            alert('Failed to like the article. Please try again.');
        }
    };

    const handleNoteInterest = async () => {
        try {
            const response = await axios.post(`/api/articles/${id}/note-interest`, { userId, articleId: id });

            await axios.post('/api/interactions/articles', {
                userId,
                articleId: id,
                interactionType: 'interested',
            });

            setInterested(true); // Mark the interest as noted
            alert(response.data.message);
        } catch (err) {
            console.error('Error noting interest:', err);
            alert('Failed to note interest. Please try again.');
        }
    };

    // Handle article deletion
    const handleDeleteArticle = async () => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                await axios.delete(`/api/articles/${id}`, {
                    data: { userId } // Ensure userId is passed in the request
                });
                alert('Article deleted successfully.');
                navigate('/home');
            } catch (err) {
                console.error('Error deleting article:', err);
                alert('Failed to delete article. Please try again.');
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await axios.delete(`/api/articles/${id}/comments/${commentId}`, {
                    data: { userId }
                });
                // Filter out the deleted comment from the local state
                setArticle((prevArticle) => ({
                    ...prevArticle,
                    comments: prevArticle.comments.filter((comment) => comment._id !== commentId)
                }));
                alert('Comment deleted successfully.');
            } catch (err) {
                console.error('Error deleting comment:', err);
                alert('Failed to delete comment. Please try again.');
            }
        }
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!article) {
        return <div>Loading...</div>;
    }

    return (
        <div className="view-article">
            <div className="article-header">
                <h1>{article.title}</h1>
            </div>
            <p><strong>Posted by:</strong> {article.authorName}</p>
            <p>{article.content}</p>
            {article.media?.length > 0 && (
                <div className="media-content">
                    {article.media.map((file, index) => {
                        const filePath = `/${file.replace(/\\/g, '/')}`;
                        console.log(filePath);
                        return (
                            <div key={index}>
                                {filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.jpeg') ? (
                                    <img src={filePath} alt={`media-${index}`} />
                                ) : filePath.endsWith('.mp4') || filePath.endsWith('.mov') ? (
                                    <video controls>
                                        <source src={filePath} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : filePath.endsWith('.mp3') || filePath.endsWith('.wav') ? (
                                    <audio controls>
                                        <source src={filePath} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="interaction-buttons">
                <button
                    onClick={handleLikeArticle}
                    disabled={liked}
                    className={liked ? "liked-button" : ""}
                >
                    {liked ? "Liked" : "Like Article"}
                </button>
                <button
                    onClick={handleNoteInterest}
                    disabled={interested}
                    className={interested ? "interested-button" : "note-interest-button"}
                >
                    {interested ? "Interest Noted" : "Note Interest"}
                </button>
                {isAdmin && (
                    <button
                        onClick={handleDeleteArticle}
                        className="delete-article-button"
                    >
                        Delete Article
                    </button>
                )}
            </div>

            <div className="comments">
                <h3>Comments</h3>
                {article.comments?.map((comment, index) => (
                    <div key={index} className="comment">
                        <p>{comment.content}</p>
                        <small>Posted by {comment.userName} on {new Date(comment.createdAt).toLocaleString()}</small>
                        {isAdmin && (
                            <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="delete-comment-button"
                            >
                                Delete Comment
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="interaction-buttons">
                <textarea
                    placeholder="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <button onClick={handlePostComment}>Post Comment</button>
            </div>
        </div>
    );
}

export default ViewArticle;
