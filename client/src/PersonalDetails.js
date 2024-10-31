import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PersonalDetails.css';

function PersonalDetails() {
    const [experience, setExperience] = useState('');
    const [education, setEducation] = useState('');
    const [skills, setSkills] = useState('');
    const [currentPosition, setCurrentPosition] = useState(''); // Store current position and employer
    const [isExperiencePublic, setIsExperiencePublic] = useState(true);
    const [isEducationPublic, setIsEducationPublic] = useState(true);
    const [isSkillsPublic, setIsSkillsPublic] = useState(true);
    const [isCurrentPositionPublic, setIsCurrentPositionPublic] = useState(true); // New state for current position public status
    const [photo, setPhoto] = useState(''); // Store the photo
    const [userId, setUserId] = useState(null); // Store the user ID

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get('/api/users/current-user');
                const userData = response.data;
                setUserId(userData._id);
                setEducation(userData.education || '');
                setExperience(userData.workExperience || '');
                setSkills((userData.skills || []).join(', '));
                setCurrentPosition(userData.currentPosition || '');
                setIsExperiencePublic(userData.isExperiencePublic || true);
                setIsEducationPublic(userData.isEducationPublic || true);
                setIsSkillsPublic(userData.isSkillsPublic || true);
                setIsCurrentPositionPublic(userData.isCurrentPositionPublic || true);
            } catch (error) {
                console.error('Error fetching user details:', error);
                window.location.href = '/signin'; // Redirect to sign-in if not authenticated
            }
        };

        fetchUserDetails();
    }, []);

    const handleSave = async () => {
        const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill !== ''); // Ensure no empty skills are added
    
        try {
            if (!userId) {
                alert('User ID not found');
                return;
            }
    
            // Send the update request to the server with education, work experience, skills, current position, and photo
            const response = await axios.put(`/api/users/${userId}/details`, {
                education,
                workExperience: experience,
                skills: skillsArray,
                currentPosition,
                photo,
                isExperiencePublic,
                isEducationPublic,
                isSkillsPublic,
                isCurrentPositionPublic // Send the public status of current position
            });
    
            if (response.data.success) {
                alert('Your personal details have been saved.');
                window.location.reload();
            } else {
                alert('Failed to save your personal details.');
            }
        } catch (error) {
            console.error('Error saving personal details:', error);
            alert('An error occurred while saving your personal details.');
        }
    };

    // Handle file input change
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result); // Save the Base64 encoded string
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="personal-details">
            <div className="topnav">
                <a href="/home">Home</a>
                <a href="/home/network">Network</a>
                <a href="/home/listings">Job Listings</a>
                <a href="/home/discussions">Discussions</a>
                <a href="/home/notifications">Notifications</a>
                <a className="active" href="/home/personaldetails">Personal Details</a>
                <a href="/home/settings">Settings</a>
            </div>
            <div className="details-container">
                <h1>Personal Details</h1>
                <div className="form-group">
                    <label>Education</label>
                    <textarea
                        value={education}
                        placeholder="ex. B.Sc Computer Science, MIT, 1996-1999"
                        onChange={(e) => setEducation(e.target.value)}
                    />
                    <label>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={isEducationPublic}
                            onChange={() => setIsEducationPublic(!isEducationPublic)}
                        />
                        Public
                    </label>
                </div>
                <div className="form-group">
                    <label>Work Experience</label>
                    <textarea
                        value={experience}
                        placeholder="ex. Graphic Designer, IBM, 2000-2003"
                        onChange={(e) => setExperience(e.target.value)}
                    />
                    <label>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={isExperiencePublic}
                            onChange={() => setIsExperiencePublic(!isExperiencePublic)}
                        />
                        Public
                    </label>
                </div>
                <div className="form-group">
                    <label>Skills</label>
                    <textarea
                        value={skills}
                        placeholder="ex. Programming, Graphic Design"
                        onChange={(e) => setSkills(e.target.value)}
                    />
                    <label>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={isSkillsPublic}
                            onChange={() => setIsSkillsPublic(!isSkillsPublic)}
                        />
                        Public
                    </label>
                </div>
                <div className="form-group">
                    <label>Current Employer</label>
                    <input
                        type="text"
                        value={currentPosition}
                        placeholder="ex. Architect, Sweco (2000-2004)"
                        onChange={(e) => setCurrentPosition(e.target.value)}
                    />
                    <label>
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={isCurrentPositionPublic}
                            onChange={() => setIsCurrentPositionPublic(!isCurrentPositionPublic)}
                        />
                        Public
                    </label>
                </div>
                <div className="form-group">
                    <label>Profile Picture</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                    />
                </div>
                <button className="button-save" onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}

export default PersonalDetails;
