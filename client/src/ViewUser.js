import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ViewUser.css';

function ViewUser() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setUser(response.data);
        setLoading(false);

        const currentUserId = localStorage.getItem('userId');

        // Check if the current user is already connected with the viewed user
        if (response.data.connectedWith.includes(currentUserId)) {
          setIsConnected(true);
        }

        // Check if a connection request has already been sent or received
        const requestResponse = await axios.get('/api/connections/check-request-status', {
          params: { senderId: currentUserId, receiverId: userId },
        });

        if (requestResponse.data) {
          const status = requestResponse.data.status;
          if (status === 'request_sent') {
            setRequestSent(true);
          } else if (status === 'request_received') {
            setRequestReceived(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data or connection request status:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSendConnectionRequest = async () => {
    try {
      const senderId = localStorage.getItem('userId');
      const response = await axios.post('/api/connections/connectionrequests', {
        senderId,
        receiverId: userId,
      });

      setRequestStatus(response.data.message);
      setRequestSent(true); // Mark that request has been sent
    } catch (error) {
      console.error('Error sending connection request:', error);
      setRequestStatus('Failed to send request');
    }
  };

  const handleAcceptConnectionRequest = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const requestResponse = await axios.get('/api/connections/check-request-status', {
        params: { senderId: userId, receiverId: currentUserId },
      });

      if (requestResponse.data.status === 'request_received') {
        const requestId = requestResponse.data.requestId;
        await axios.put(`/api/connections/requests/${requestId}`, {
          status: 'accepted',
          userId: currentUserId,
        });
        setIsConnected(true);
        setRequestReceived(false);
        setRequestStatus('Connection accepted');
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      setRequestStatus('Failed to accept connection');
    }
  };

  const handleRemoveConnection = async () => {
    try {
      const currentUserId = localStorage.getItem('userId');
      const response = await axios.put(`/api/users/${currentUserId}/remove-connection`, {
        targetUserId: userId,
      });

      if (response.data.success) {
        setIsConnected(false);
        setRequestStatus('Connection removed');
        setRequestSent(false); // Allow sending request again if connection is removed
      } else {
        setRequestStatus('Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      setRequestStatus('Failed to remove connection');
    }
  };

  const handleStartDiscussion = async () => {
    try {
      // Get conversations involving the current user
      const response = await axios.get(`/api/messages/${localStorage.getItem('userId')}`);

      // Check if the response contains an array of conversations
      if (Array.isArray(response.data)) {
        // Find if a conversation with this user already exists
        const existingConversation = response.data.find(conv =>
          conv.participants.some(participant => participant._id === userId)
        );

        // If a conversation exists, navigate to discussions
        if (existingConversation) {
          navigate(`/home/discussions`);
        } else {
          // Otherwise, create a new conversation
          const newConversation = {
            participants: [localStorage.getItem('userId'), userId],
          };

          await axios.post('/api/messages', newConversation);
          navigate(`/home/discussions`);
        }
      } else {
        console.error('Unexpected data structure for conversations:', response.data);
      }
    } catch (error) {
      console.error('Error starting discussion:', error);
    }
  };

  const requestStatusColor = requestStatus === 'Request is pending' ? 'orange' : 'green';

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const {
    firstName = '',
    lastName = '',
    email = '',
    number = '',
    education = '',
    workExperience = '',
    photo = 'default-profile.png',
    currentPosition = '',
    isEducationPublic,
    isExperiencePublic,
    isSkillsPublic,
    isCurrentPositionPublic,
  } = user || {};

  return (
    <div className="view-user">
      <div className="user-header">
        <img src={photo} alt={`${firstName} ${lastName}`} className="user-photo" />
        <div className="user-info">
          <h1>{firstName} {lastName}</h1>
          {isConnected || isCurrentPositionPublic ? (
            <p>{currentPosition}</p>
          ) : (
            <p>Current Position: Private</p>
          )}
        </div>
      </div>
      <p><strong>E-mail:</strong> {email}</p>
      <p><strong>Number:</strong> {number}</p>
      {isConnected || isEducationPublic ? (
        <p><strong>Education:</strong> {education}</p>
      ) : (
        <p><strong>Education:</strong> Private</p>
      )}
      {isConnected || isExperiencePublic ? (
        <p><strong>Work Experience:</strong> {workExperience}</p>
      ) : (
        <p><strong>Work Experience:</strong> Private</p>
      )}
      {isConnected || isSkillsPublic ? (
        <p><strong>Skills:</strong> {user.skills.join(', ')}</p>
      ) : (
        <p><strong>Skills:</strong> Private</p>
      )}

      {isConnected ? (
        <button className="button-remove-connection" onClick={handleRemoveConnection}>
          Remove Connection
        </button>
      ) : requestReceived ? (
        <button className="button-accept-request" onClick={handleAcceptConnectionRequest}>
          Accept Connection Request
        </button>
      ) : (
        <button
          className={requestSent ? "button-request-sent" : "button-send-request"}
          onClick={handleSendConnectionRequest}
          disabled={requestSent}
        >
          {requestSent ? "Request Sent" : "Send Connection Request"}
        </button>
      )}

      <button className="button-start-discussion" onClick={handleStartDiscussion}>
        Start Discussion
      </button>

      {requestStatus && (
        <p className="request-status" style={{ color: requestStatusColor }}>
          {requestStatus}
        </p>
      )}
    </div>
  );
}

export default ViewUser;
