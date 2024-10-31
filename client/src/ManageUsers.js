import React, { useState, useEffect } from 'react';
import './ManageUsers.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get('/api/users/current-user');
                const userData = response.data;

                if (!userData.admin) {
                    navigate('/home');
                    return;
                }

                setUserId(userData._id);
                fetchUsers();
            } catch (error) {
                console.error('Error fetching user details:', error);
                navigate('/signin');
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                if (response.status === 200) {
                    setUsers(Array.isArray(response.data) ? response.data : []);
                    setError(null);
                } else {
                    throw new Error(`Failed with status ${response.status}`);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                setError('Failed to load users. Please try again later.');
                setUsers([]);
            }
        };

        fetchUserDetails();
    }, [navigate]);

    const handleUserSelect = (id) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((userId) => userId !== id)
                : [...prevSelected, id]
        );
    };

    const exportData = async (format) => {
        const selectedData = [];

        for (let userId of selectedUsers) {
            try {
                const userResponse = await axios.get(`/api/admin/users/${userId}`);
                const articlesResponse = await axios.get(`/api/articles?userId=${userId}`); // Updated endpoint
                const jobListingsResponse = await axios.get(`/api/job-listings?userId=${userId}`);

                const user = userResponse.data;
                const articles = articlesResponse.data;
                const jobListings = jobListingsResponse.data;

                // Ensure articles is an array
                const articleTitles = Array.isArray(articles) && articles.length > 0
                    ? articles.map(article => article.title).join(", ")
                    : "No data provided";

                // Ensure jobListings is an array
                const jobListingTitles = Array.isArray(jobListings) && jobListings.length > 0
                    ? jobListings.map(listing => listing.title).join(", ")
                    : "No data provided";

                // Ensure connectedWith is an array
                const connectedWithNames = Array.isArray(user.connectedWith) && user.connectedWith.length > 0
                    ? user.connectedWith.map(conn => `${conn.firstName} ${conn.lastName}`).join(", ")
                    : "No data provided";

                const exportContent = {
                    ...user,
                    education: user.education || "No data provided",
                    workExperience: user.workExperience || "No data provided",
                    articles: articleTitles,
                    jobListings: jobListingTitles,
                    connectedWith: connectedWithNames,
                    comments: user.comments || "No data provided", // Assuming comments are included in the user data
                    notes: user.notes || "No data provided" // Assuming notes are included in the user data
                };

                selectedData.push(exportContent);
            } catch (error) {
                console.error(`Error fetching data for user ${userId}:`, error);
                setError(`Failed to fetch data for user ${userId}.`);
            }
        }

        const element = document.createElement("a");
        if (format === "json") {
            const file = new Blob([JSON.stringify(selectedData, null, 2)], {
                type: "application/json",
            });
            element.href = URL.createObjectURL(file);
            element.download = "users.json";
        } else if (format === "xml") {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<users>\n';
            selectedData.forEach((user) => {
                xml += `  <user>\n`;
                xml += `    <id>${user._id}</id>\n`;
                xml += `    <email>${user.email}</email>\n`;
                xml += `    <firstName>${user.firstName}</firstName>\n`;
                xml += `    <lastName>${user.lastName}</lastName>\n`;
                xml += `    <number>${user.number}</number>\n`;
                xml += `    <photo>${user.photo}</photo>\n`;
                xml += `    <admin>${user.admin}</admin>\n`;
                xml += `    <skills>${user.skills ? user.skills.join(", ") : "No data provided"}</skills>\n`;
                xml += `    <connectedWith>${user.connectedWith}</connectedWith>\n`;
                xml += `    <currentPosition>${user.currentPosition}</currentPosition>\n`;
                xml += `    <education>${user.education}</education>\n`;
                xml += `    <workExperience>${user.workExperience}</workExperience>\n`;
                xml += `    <articles>${user.articles}</articles>\n`;
                xml += `    <jobListings>${user.jobListings}</jobListings>\n`;
                xml += `    <comments>${user.comments}</comments>\n`;
                xml += `    <notes>${user.notes}</notes>\n`;
                xml += `  </user>\n`;
            });
            xml += "</users>";
            const file = new Blob([xml], { type: "application/xml" });
            element.href = URL.createObjectURL(file);
            element.download = "users.xml";
        }
        document.body.appendChild(element);
        element.click();
    };

    return (
        <div className="manage-users">
            <h1>Manage Users</h1>
            {error && <p className="error-message">{error}</p>}
            <ul>
                {users.length > 0 ? (
                    users.map((user) => (
                        <li key={user._id}>
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={() => handleUserSelect(user._id)}
                            />
                            {user.firstName} {user.lastName}
                            <button onClick={() => navigate(`/admin/users/${user._id}`)}>View Data</button>
                        </li>
                    ))
                ) : (
                    <p>No users found.</p>
                )}
            </ul>
            <div className="buttons-container">
                <button onClick={() => exportData('json')} disabled={selectedUsers.length === 0}>
                    Export to JSON
                </button>
                <button onClick={() => exportData('xml')} disabled={selectedUsers.length === 0}>
                    Export to XML
                </button>
            </div>
        </div>
    );
}

export default ManageUsers;
