import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import './App.css';
import Provider from './pages/Provider';
import Booking from "./pages/Booking"
function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path='/providers' element={<Provider/>}/>
          <Route path='/booking' element={<Booking/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;