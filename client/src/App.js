import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SignIn from './SignIn'; // Import the SignIn component
import SignUp from './SignUp';
import Home from './Home';
import AdminPortal from './AdminPortal';
import ManageUsers from './ManageUsers';
import Network from './Network';
import Listings from './Listings';
import Discussions from './Discussions';
import Notifications from './Notifications';
import PersonalDetails from './PersonalDetails';
import Settings from './Settings';
import ForgotPassword from './ForgotPassword';
import ViewUser from './ViewUser';
import ViewUserAdmin from './ViewUserAdmin';
import AdminRoute from './AdminRoute'; // Import the AdminRoute component
import ViewListing from './ViewListing';
import ViewArticle from './ViewArticle';
import './App.css'; // Import your styling

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/home" element={<Home />} />
                    {/* Protected admin routes */}
                    <Route path="/adminportal" element={<AdminRoute element={AdminPortal} />} />
                    <Route path="/manageusers" element={<AdminRoute element={ManageUsers} />} />
                    <Route path="/admin/users/:userId" element={<AdminRoute element={ViewUserAdmin} />} />
                    {/* Regular user routes */}
                    <Route path="/home/network" element={<Network />} />
                    <Route path="/home/listings" element={<Listings />} />
                    <Route path="/home/discussions" element={<Discussions />} />
                    <Route path="/home/notifications" element={<Notifications />} />
                    <Route path="/home/personaldetails" element={<PersonalDetails />} />
                    <Route path="/home/settings" element={<Settings />} />
                    <Route path="/home/forgotpassword" element={<ForgotPassword />} />
                    <Route path="/users/:userId" element={<ViewUser />} /> {/* Updated Route Path */}
                    <Route path="/home/listings/viewlisting/:id" element={<ViewListing />} />
                    <Route path="/home/articles/:id" element={<ViewArticle />} /> {/* New route for viewing articles */}
                    {/* Add other routes as needed */}
                </Routes>
            </div>
        </Router>
    );
}

function Welcome() {
    return (
        <div className="container">
            <img src="/logo-color.png" alt="WorkNow Logo" />
            <h1><marquee direction="right">Welcome to WorkNow!</marquee></h1>
            <div className="button-container">
                <Link to="/signup">
                    <button className="button">Sign up</button>
                </Link>
                <Link to="/signin">
                    <button className="button">Sign in</button>
                </Link>
            </div>
            <p>Here you can find a job in a few clicks!</p>
        </div>
    );
}

export default App;
