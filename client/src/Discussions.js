import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Discussions.css';

// Connect to the socket.io server
const socket = io.connect('https://localhost:3001');

function Discussions() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);

    // Fetch the current user data from the session
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('/api/users/current-user');
                setUser(response.data);

                // Join the user's socket.io room based on their user ID
                socket.emit('joinUser', response.data._id);

                // Fetch the user's conversations
                const conversationsResponse = await axios.get(`/api/messages/${response.data._id}`);
                const data = Array.isArray(conversationsResponse.data) ? conversationsResponse.data : [];
                setConversations(data);
                setSelectedConversation(data[0] || null);

                if (data[0]) {
                    socket.emit('joinConversation', data[0]._id);
                }
            } catch (error) {
                console.error('Error fetching user data or conversations:', error);
                window.location.href = '/signin'; // Redirect to sign-in if there's an error
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            const conversationIndex = conversations.findIndex(conv => conv._id === message.conversationId);

            if (conversationIndex > -1) {
                const updatedConversations = [...conversations];
                updatedConversations[conversationIndex].messages.push(message);
                setConversations(updatedConversations);

                if (selectedConversation && selectedConversation._id === message.conversationId) {
                    setSelectedConversation(updatedConversations[conversationIndex]);
                }
            } else {
                const fetchConversation = async () => {
                    const response = await axios.get(`/api/messages/${user._id}`);
                    const newConversations = Array.isArray(response.data) ? response.data : [];
                    setConversations(newConversations);

                    const newConv = newConversations.find(conv => conv._id === message.conversationId);
                    if (newConv) {
                        setSelectedConversation(newConv);
                    }
                };

                fetchConversation();
            }
        });

        socket.on('newConversation', (newConversation) => {
            setConversations(prevConversations => [...prevConversations, newConversation]);
            if (newConversation.participants.some(p => p._id === user._id)) {
                setSelectedConversation(newConversation);
                socket.emit('joinConversation', newConversation._id); // Join the conversation right away
            }
        });

        return () => {
            socket.off('receiveMessage');
            socket.off('newConversation');
        };
    }, [selectedConversation, conversations, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation?.messages]);

    const handleConversationClick = (conversation) => {
        setSelectedConversation(conversation);
        setSearchResults([]);
        socket.emit('joinConversation', conversation._id);
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !selectedConversation) return;

        const receiver = selectedConversation?.participants?.find(p => p._id !== user._id);
        if (!receiver) return;

        const messageData = {
            conversationId: selectedConversation._id,
            senderId: user._id,
            receiverId: receiver._id,
            text: newMessage,
        };

        socket.emit('sendMessage', messageData, (response) => {
            if (response.status === 'ok') {
                console.log('Message sent successfully');
            } else {
                console.error('Error sending message:', response.error);
            }
        });
        
        setNewMessage('');
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            // If search query is empty, clear search results and show active conversations
            setSearchResults([]);
            return;
        }

        try {
            // Wait until the user data is available
            if (!user || !user._id) return;

            const response = await axios.get(`/api/users?search=${searchQuery}`);
            
            // Filter out the logged-in user from the search results
            const filteredResults = response.data.filter(result => result._id !== user._id);

            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleStartConversation = async (receiverId) => {
        try {
            const existingConversation = conversations.find(conv =>
                conv.participants.some(participant => participant._id === receiverId)
            );

            if (existingConversation) {
                setSelectedConversation(existingConversation);
                socket.emit('joinConversation', existingConversation._id);
                setSearchResults([]);
                setSearchQuery('');
            } else {
                const newConversation = {
                    participants: [user._id, receiverId],
                };

                const response = await axios.post('/api/messages', newConversation);

                const fullConversation = await axios.get(`/api/messages/${user._id}`);
                const updatedConversations = Array.isArray(fullConversation.data) ? fullConversation.data : [];

                setConversations(updatedConversations);
                const createdConversation = updatedConversations.find(conv => conv._id === response.data._id);
                setSelectedConversation(createdConversation);
                setSearchResults([]);
                setSearchQuery('');

                socket.emit('joinConversation', response.data._id);
            }

        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const renderMessages = (messages) => {
        return messages.map((message, index) => {
            // Add a check to ensure message.senderId and user exist
            const senderIdString = message.senderId && message.senderId._id ? message.senderId._id.toString() : message.senderId ? message.senderId.toString() : null;
            const userIdString = user && user._id ? user._id.toString() : null;
    
            // Make sure senderIdString and userIdString are valid
            if (!senderIdString || !userIdString) {
                return null;
            }
    
            const isOutgoing = senderIdString === userIdString;
            const participant = selectedConversation?.participants?.find(p => p._id === senderIdString);
    
            return (
                <div key={message._id?.toString() || index} className={`message ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                    {!isOutgoing && participant?.photo && (
                        <img src={participant.photo} alt={participant.firstName} className="message-photo" />
                    )}
                    {message.text}
                </div>
            );
        });
    };

    return (
        <div className="discussions">
            <div className="conversations-list">
                <div className="conversations-header">
                    <h2 className="direct-messages">Direct Messages</h2>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
                <ul>
                    {searchResults.length > 0 ? (
                        searchResults.map(resultUser => (
                            <li
                                key={resultUser._id}
                                onClick={() => handleStartConversation(resultUser._id)}
                            >
                                <div className="conversation-item">
                                    <img src="profile-placeholder.png" alt={resultUser.firstName} className="conversation-photo" />
                                    <div className="conversation-info">
                                        <span className="conversation-name">
                                            {resultUser.firstName} {resultUser.lastName}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))
                    ) : (
                        conversations.map(conversation => {
                            const participant = conversation?.participants?.find(p => p._id !== user._id);
                            const participantName = participant
                                ? `${participant.firstName || ''} ${participant.lastName || ''}`.trim()
                                : 'New conversation';

                            return (
                                <li
                                    key={conversation._id}
                                    onClick={() => handleConversationClick(conversation)}
                                    className={conversation._id === selectedConversation?._id ? 'selected' : ''}
                                >
                                    <div className="conversation-item">
                                        {participant?.photo ? (
                                            <img src={participant.photo} alt={participantName} className="conversation-photo" />
                                        ) : (
                                            <img src="profile-placeholder.png" alt={participantName} className="conversation-photo" />
                                        )}
                                        <div className="conversation-info">
                                            <span className="conversation-name">
                                                {participantName || 'New conversation'}
                                            </span>
                                            <span className="conversation-message">
                                                {conversation?.messages?.[conversation.messages.length - 1]?.text || ''}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
            <div className="messages">
                {selectedConversation && (
                    <>
                        <div className="messages-header">
                            <h2>
                                {selectedConversation?.participants?.find(p => p._id !== user._id)?.firstName} {selectedConversation?.participants?.find(p => p._id !== user._id)?.lastName}
                            </h2>
                            <i className="info-icon">&#9432;</i>
                        </div>
                        <div className="messages-list">
                            {renderMessages(selectedConversation?.messages || [])}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="message-input">
                            <input
                                type="text"
                                placeholder="Message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                style={{ maxHeight: '100px', overflowY: 'auto' }}
                            />
                            <button className="button-discussions" onClick={handleSendMessage}>Send</button>
                        </div>
                    </>
                )}
            </div>
            <div className="topnav">
                <a href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a className="active" href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
            </div>
        </div>
    );
}

export default Discussions;
