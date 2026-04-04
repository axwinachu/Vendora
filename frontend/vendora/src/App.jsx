import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import './App.css';
import Provider from './pages/Provider';
import Booking from "./pages/Booking";
import ChatPage from './pages/ChatPage';
function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path='/providers' element={<Provider/>}/>
          <Route path='/booking' element={<Booking/>}/>
          <Route path="/chat/:providerId" element={<ChatPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;